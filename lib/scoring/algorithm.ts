/**
 * Scoring 5D - OportunIA core algorithm
 *
 * Calcula un score 0-100 para un negocio basado en 5 dimensiones:
 *   A. Brecha Digital (25%)  - qué tan atrasado en digital
 *   B. Gap Operativo  (25%)  - qué tan solo está operando
 *   C. Fit del Negocio (25%) - qué tanto encaja con servicios AI
 *   D. Señales de Compra (15%) - tiene dinero y voluntad
 *   E. Proximidad     (10%)  - puedes llegar físicamente
 *
 * Score alto = mejor prospecto (más probable que compre AI services).
 *
 * Pesos calibrados según spec: A=0.25, B=0.25, C=0.25, D=0.15, E=0.10
 */

import type { DigitalSignals } from "./signals";
import { scoreBrechaDigital } from "./signals";

export type ScoreTier = "hot" | "warm" | "nurture" | "skip";

export interface ScoringInput {
  /** From Firecrawl/Tavily of business website */
  digitalSignals: DigitalSignals | null;
  /** From Google Places */
  hasGoogleRating: boolean;
  reviewCount: number | null;
  hasPhone: boolean;
  hasEmail: boolean;
  /** From business.primary_type or sector_id mapping */
  sector: string | null;
  primaryType: string | null;
  /** Estimated average ticket (USD). null = unknown. */
  avgTicketUsd: number | null;
  /** Distance from origin in miles */
  distanceMiles: number | null;
  /** Whether business type is 24/7 emergency */
  is24_7Emergency: boolean;
  /** Multi-location indicator (number of locations) */
  locationCount: number | null;
  /** Years in business (or null) */
  yearsInBusiness: number | null;
  /** Last review date (Unix seconds) or null */
  lastReviewAt: number | null;
  /** Last post date on website (Unix seconds) or null */
  lastPostAt: number | null;
  /** Number of employees (estimate) or null */
  employeeCount: number | null;
  /** Has active ads (e.g. Google Ads, Meta) - boolean */
  hasActiveAds: boolean | null;
}

export interface ScoreBreakdown {
  total: number;
  breakdown: {
    brechaDigital: number;
    gapOperativo: number;
    fitNegocio: number;
    senalesCompra: number;
    proximidad: number;
  };
  tier: ScoreTier;
  weights: {
    brechaDigital: 0.25;
    gapOperativo: 0.25;
    fitNegocio: 0.25;
    senalesCompra: 0.15;
    proximidad: 0.10;
  };
  reasoning: {
    brechaDigital: string;
    gapOperativo: string;
    fitNegocio: string;
    senalesCompra: string;
    proximidad: string;
  };
}

const WEIGHTS = {
  brechaDigital: 0.25,
  gapOperativo: 0.25,
  fitNegocio: 0.25,
  senalesCompra: 0.15,
  proximidad: 0.10,
} as const;

// =====================================================================
// A. Brecha Digital (25%)
// =====================================================================
export function scoreBrechaDigitalDim(input: ScoringInput): {
  score: number;
  reasoning: string;
} {
  // If we have signals from website crawl, use them
  if (input.digitalSignals) {
    const score = scoreBrechaDigital(input.digitalSignals);
    const s = input.digitalSignals;
    const gaps: string[] = [];
    if (!s.has_chat) gaps.push("sin chat en vivo");
    if (!s.has_whatsapp) gaps.push("sin WhatsApp");
    if (!s.has_booking) gaps.push("sin booking online");
    if (!s.has_contact_form) gaps.push("sin formulario de contacto");
    if (!s.mentions_24_7) gaps.push("no menciona 24/7");
    if (!s.has_social) gaps.push("sin redes sociales");
    if (s.last_post_age_days !== null && s.last_post_age_days > 365) {
      gaps.push(`último post hace ${s.last_post_age_days} días`);
    }
    const reasoning = gaps.length > 0
      ? `Brechas detectadas: ${gaps.slice(0, 4).join(", ")}.`
      : "Sitio bien mantenido, sin brechas digitales evidentes.";
    return { score, reasoning };
  }
  // No website crawled → assume high brecha
  return {
    score: 65,
    reasoning: "No pudimos analizar el sitio web. Asumimos brecha digital media-alta.",
  };
}

// =====================================================================
// B. Gap Operativo (25%)
// =====================================================================
export function scoreGapOperativoDim(input: ScoringInput): {
  score: number;
  reasoning: string;
} {
  let score = 0;
  const gaps: string[] = [];

  if (!input.hasPhone) {
    score += 20;
    gaps.push("sin teléfono público");
  }
  if (!input.hasEmail) {
    score += 8;
    gaps.push("sin email visible");
  }
  if (!input.digitalSignals?.mentions_24_7) {
    score += 15;
    gaps.push("no opera 24/7");
  }
  if (!input.hasGoogleRating) {
    score += 12;
    gaps.push("sin rating en Google");
  }
  if (input.reviewCount !== null) {
    if (input.reviewCount < 10) {
      score += 12;
      gaps.push(`solo ${input.reviewCount} reseñas`);
    } else if (input.reviewCount < 30) {
      score += 5;
      gaps.push(`pocas reseñas (${input.reviewCount})`);
    }
  }
  if (!input.digitalSignals?.has_contact_form) {
    score += 15;
    gaps.push("sin formulario de contacto");
  }
  if (!input.digitalSignals?.has_booking) {
    score += 8;
    gaps.push("sin booking online");
  }
  if (input.distanceMiles !== null && input.distanceMiles > 30) {
    // Lejano: menos probable que visiten
    score += 5;
  }

  return {
    score: Math.min(100, score),
    reasoning:
      gaps.length > 0
        ? `Gaps operativos: ${gaps.slice(0, 4).join(", ")}.`
        : "Bien establecido operativamente.",
  };
}

// =====================================================================
// C. Fit del Negocio (25%)
// =====================================================================

const HIGH_TICKET_SECTORS = [
  "hvac", "plumber", "plumbing", "electrician", "roofing", "dental",
  "dentist", "solar", "water damage", "restoration", "auto repair",
  "auto body", "glass repair", "locksmith", "pest control",
];

const MEDIUM_TICKET_SECTORS = [
  "restaurant", "cafe", "salon", "barber", "gym", "fitness",
  "landscaping", "cleaning", "lawyer", "accountant", "real estate",
  "veterinarian",
];

export function scoreFitNegocioDim(input: ScoringInput): {
  score: number;
  reasoning: string;
} {
  let score = 0;
  const factors: string[] = [];

  // Sector match
  const sectorLower = (input.sector ?? "").toLowerCase();
  const primaryLower = (input.primaryType ?? "").toLowerCase();
  const isHighTicket =
    HIGH_TICKET_SECTORS.some(
      (s) => sectorLower.includes(s) || primaryLower.includes(s)
    ) || false;
  const isMediumTicket =
    MEDIUM_TICKET_SECTORS.some(
      (s) => sectorLower.includes(s) || primaryLower.includes(s)
    ) || false;

  if (isHighTicket) {
    score += 35;
    factors.push("sector de alto ticket");
  } else if (isMediumTicket) {
    score += 20;
    factors.push("sector de ticket medio");
  } else {
    score += 10;
    factors.push("sector no identificado");
  }

  // Ticket promedio
  if (input.avgTicketUsd !== null) {
    if (input.avgTicketUsd >= 2000) {
      score += 20;
      factors.push(`ticket alto (~$${input.avgTicketUsd})`);
    } else if (input.avgTicketUsd >= 500) {
      score += 12;
      factors.push(`ticket medio (~$${input.avgTicketUsd})`);
    } else if (input.avgTicketUsd >= 200) {
      score += 5;
      factors.push(`ticket bajo (~$${input.avgTicketUsd})`);
    } else {
      factors.push(`ticket muy bajo (~$${input.avgTicketUsd})`);
    }
  }

  // 24/7 emergency
  if (input.is24_7Emergency) {
    score += 25;
    factors.push("es 24/7 emergency");
  }

  // B2B vs B2C - many of our sectors are B2C
  if (
    sectorLower.includes("hvac") ||
    sectorLower.includes("plumb") ||
    sectorLower.includes("roof") ||
    sectorLower.includes("electric")
  ) {
    score += 10;
    factors.push("negocio de servicios residenciales");
  }

  return {
    score: Math.min(100, score),
    reasoning:
      factors.length > 0
        ? `Fit: ${factors.slice(0, 3).join(", ")}.`
        : "Fit no evaluado.",
  };
}

// =====================================================================
// D. Señales de Compra (15%)
// =====================================================================
export function scoreSenalesCompraDim(input: ScoringInput): {
  score: number;
  reasoning: string;
} {
  let score = 0;
  const signals: string[] = [];

  if (input.employeeCount !== null) {
    if (input.employeeCount >= 10) {
      score += 25;
      signals.push(`${input.employeeCount}+ empleados`);
    } else if (input.employeeCount >= 5) {
      score += 15;
      signals.push(`${input.employeeCount} empleados`);
    } else if (input.employeeCount >= 2) {
      score += 5;
      signals.push("equipo pequeño");
    }
  }

  if (input.locationCount !== null && input.locationCount > 1) {
    score += 20;
    signals.push(`multi-sede (${input.locationCount})`);
  }

  if (input.lastReviewAt !== null) {
    const daysSince = Math.floor(Date.now() / 1000) - input.lastReviewAt;
    const daysSinceDays = Math.floor(daysSince / 86400);
    if (daysSinceDays < 30) {
      score += 15;
      signals.push("reseña reciente (<30 días)");
    } else if (daysSinceDays < 90) {
      score += 8;
      signals.push("actividad reciente en reseñas");
    }
  }

  if (input.lastPostAt !== null) {
    const daysSince = Math.floor(Date.now() / 1000) - input.lastPostAt;
    const daysSinceDays = Math.floor(daysSince / 86400);
    if (daysSinceDays < 60) {
      score += 10;
      signals.push("publica contenido reciente");
    }
  }

  if (input.hasActiveAds === true) {
    score += 15;
    signals.push("invierte en publicidad");
  }

  if (input.yearsInBusiness !== null) {
    if (input.yearsInBusiness >= 3 && input.yearsInBusiness <= 15) {
      score += 10;
      signals.push(`${input.yearsInBusiness} años operando`);
    } else if (input.yearsInBusiness > 15) {
      // Established but maybe resistant to change
      score += 5;
      signals.push(`negocio establecido (${input.yearsInBusiness} años)`);
    }
  }

  return {
    score: Math.min(100, score),
    reasoning:
      signals.length > 0
        ? `Señales: ${signals.slice(0, 3).join(", ")}.`
        : "Sin señales de compra detectadas.",
  };
}

// =====================================================================
// E. Proximidad (10%)
// =====================================================================
export function scoreProximidadDim(distanceMiles: number | null): {
  score: number;
  reasoning: string;
} {
  if (distanceMiles === null) {
    return { score: 50, reasoning: "Distancia desconocida, score neutral." };
  }
  if (distanceMiles <= 5) {
    return { score: 100, reasoning: `A ${distanceMiles.toFixed(1)} mi, muy cerca.` };
  }
  if (distanceMiles <= 15) {
    return { score: 80, reasoning: `A ${distanceMiles.toFixed(1)} mi, accesible.` };
  }
  if (distanceMiles <= 30) {
    return { score: 50, reasoning: `A ${distanceMiles.toFixed(1)} mi, requiere viaje.` };
  }
  if (distanceMiles <= 50) {
    return { score: 25, reasoning: `A ${distanceMiles.toFixed(1)} mi, lejano.` };
  }
  return { score: 5, reasoning: `A ${distanceMiles.toFixed(1)} mi, fuera de zona.` };
}

// =====================================================================
// Combined Score
// =====================================================================
export function calculateScore(input: ScoringInput): ScoreBreakdown {
  const brecha = scoreBrechaDigitalDim(input);
  const gap = scoreGapOperativoDim(input);
  const fit = scoreFitNegocioDim(input);
  const senales = scoreSenalesCompraDim(input);
  const prox = scoreProximidadDim(input.distanceMiles);

  const total = Math.round(
    brecha.score * WEIGHTS.brechaDigital +
      gap.score * WEIGHTS.gapOperativo +
      fit.score * WEIGHTS.fitNegocio +
      senales.score * WEIGHTS.senalesCompra +
      prox.score * WEIGHTS.proximidad
  );

  const tier: ScoreTier =
    total >= 80 ? "hot" :
    total >= 60 ? "warm" :
    total >= 40 ? "nurture" :
    "skip";

  return {
    total,
    breakdown: {
      brechaDigital: brecha.score,
      gapOperativo: gap.score,
      fitNegocio: fit.score,
      senalesCompra: senales.score,
      proximidad: prox.score,
    },
    tier,
    weights: WEIGHTS,
    reasoning: {
      brechaDigital: brecha.reasoning,
      gapOperativo: gap.reasoning,
      fitNegocio: fit.reasoning,
      senalesCompra: senales.reasoning,
      proximidad: prox.reasoning,
    },
  };
}
