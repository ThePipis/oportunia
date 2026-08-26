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

export interface YelpEnrichment {
  rating: number;
  reviewCount: number;
  url: string;
  reputationGap: number; // Google rating - Yelp rating
}

export interface ScoringInput {
  /** From Firecrawl/Tavily/Direct Fetch of business website */
  digitalSignals: Partial<DigitalSignals> | null;
  /** Explicit website status if known */
  websiteStatus?: "active" | "parked" | "offline" | "no_website";
  /** From Google Places */
  hasGoogleRating: boolean;
  googleRating?: number | null;
  reviewCount: number | null;
  hasPhone: boolean;
  hasEmail: boolean;
  hasAddress?: boolean;
  businessName?: string | null;
  businessTypes?: string[] | string | null;
  /** From business.primary_type or sector_id mapping */
  sector: string | null;
  primaryType: string | null;
  /** Estimated average ticket (USD). null = unknown. */
  avgTicketUsd: number | null;
  /** Distance from origin in miles */
  distanceMiles: number | null;
  /** Whether business type is 24/7 emergency */
  is24_7Emergency: boolean;
  /** Yelp Fusion enrichment data */
  yelpData?: YelpEnrichment | null;
  /** Semantic review complaints detected */
  reviewComplaints?: string[] | null;
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
  reasoning: {
    brechaDigital: string;
    gapOperativo: string;
    fitNegocio: string;
    senalesCompra: string;
    proximidad: string;
  };
  tier: ScoreTier;
}

export const DIMENSION_WEIGHTS = {
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
  // Check for parked, expired or broken domain
  if (input.digitalSignals?.is_parked_or_broken || input.websiteStatus === "parked") {
    return {
      score: 95,
      reasoning: "🚨 Dominio vencido / Página de parking detectada: El enlace oficial en Google Maps no tiene una web funcional activa. Oportunidad crítica para crear Web con IA y captación 24/7.",
    };
  }

  // Social Funnel Gap: Active social profiles but NO working website
  if (input.digitalSignals?.social_funnel_gap) {
    const profiles = Object.entries(input.digitalSignals.social_profiles ?? {})
      .filter(([_, v]) => Boolean(v))
      .map(([k]) => k.toUpperCase())
      .join(", ");
    return {
      score: 95,
      reasoning: `🚨 Fuga de Tráfico Social: Tiene presencia activa en redes (${profiles || "Instagram/Facebook"}) pero carece de sitio web propio y chatbot con IA para convertir seguidores en clientes directos.`,
    };
  }

  if (input.websiteStatus === "no_website") {
    return {
      score: 90,
      reasoning: "Sin sitio web oficial en Google Places. Brecha digital crítica: se recomienda creación de sitio web moderno con IA.",
    };
  }

  // If we have signals from website crawl, use them
  if (input.digitalSignals) {
    const score = scoreBrechaDigital(input.digitalSignals);
    const s = input.digitalSignals;
    const gaps: string[] = [];
    if (s.cms_name && s.cms_name !== "Custom" && s.cms_name !== "None") {
      gaps.push(`web en ${s.cms_name}`);
    }
    if (!s.has_chat) gaps.push("sin chat en vivo");
    if (!s.has_whatsapp) gaps.push("sin WhatsApp");
    if (!s.has_booking) gaps.push("sin booking online");
    if (!s.has_contact_form) gaps.push("sin formulario de contacto");
    if (!s.mentions_24_7) gaps.push("no opera 24/7");
    if (!s.has_social) gaps.push("sin redes sociales");
    if (s.last_post_age_days != null && s.last_post_age_days > 365) {
      gaps.push(`último post hace ${s.last_post_age_days} días`);
    }
    const reasoning = gaps.length > 0
      ? `Brechas web detectadas: ${gaps.slice(0, 4).join(", ")}.`
      : "Sitio web activo y optimizado.";
    return { score, reasoning };
  }

  return {
    score: 75,
    reasoning: "Presencia web limitada sin automatizaciones detectadas.",
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

  // Semantic review complaints (critical pain point)
  if (input.reviewComplaints && input.reviewComplaints.length > 0) {
    if (input.reviewComplaints.includes("missed_calls")) {
      score += 25;
      gaps.push("🚨 Reseñas reportan llamadas no contestadas");
    }
    if (input.reviewComplaints.includes("slow_response")) {
      score += 15;
      gaps.push("demoras reportadas en cotizaciones");
    }
    if (input.reviewComplaints.includes("booking_difficulty")) {
      score += 15;
      gaps.push("dificultad para agendar citas");
    }
  }

  if (!input.hasPhone) {
    score += 20;
    gaps.push("sin teléfono de contacto");
  }
  if (!input.hasEmail) {
    score += 8;
    gaps.push("sin email directo");
  }
  if (!input.digitalSignals?.mentions_24_7 && !input.is24_7Emergency) {
    score += 15;
    gaps.push("sin cobertura 24/7");
  }
  if (!input.hasGoogleRating) {
    score += 12;
    gaps.push("sin perfil verificado en Google");
  }
  if (input.reviewCount !== null) {
    if (input.reviewCount < 10) {
      score += 15;
      gaps.push(`volumen bajo de reseñas (${input.reviewCount})`);
    } else if (input.reviewCount < 30) {
      score += 8;
      gaps.push(`pocas reseñas (${input.reviewCount})`);
    }
  }
  if (!input.digitalSignals?.has_contact_form) {
    score += 15;
    gaps.push("sin formulario de cotización");
  }
  if (!input.digitalSignals?.has_booking) {
    score += 15;
    gaps.push("sin agendamiento de citas online");
  }

  return {
    score: Math.min(100, score),
    reasoning:
      gaps.length > 0
        ? `Gaps operativos: ${gaps.slice(0, 4).join(", ")}.`
        : "Operación comercial bien cubierta.",
  };
}

// =====================================================================
// C. Fit del Negocio (25%)
// =====================================================================

interface SectorProfile {
  name: string;
  tier: "high" | "medium" | "low";
  baseScore: number;
  typicalTicket: number;
  recommendedServices: string;
  keywords: string[];
}

const SECTOR_PROFILES: SectorProfile[] = [
  {
    name: "HVAC & Climatización",
    tier: "high",
    baseScore: 35,
    typicalTicket: 1500,
    recommendedServices: "AI Receptionist 24/7, Speed-to-Lead y Ads Optimization",
    keywords: ["hvac", "air_conditioning", "heating", "aire acondicionado", "furnace", "cooling"],
  },
  {
    name: "Plomería & Fontanería",
    tier: "high",
    baseScore: 35,
    typicalTicket: 1200,
    recommendedServices: "AI Receptionist 24/7 y Speed-to-Lead",
    keywords: ["plumb", "plumber", "plumbing", "drain", "water_heater", "fontanero"],
  },
  {
    name: "Techos & Roofing",
    tier: "high",
    baseScore: 35,
    typicalTicket: 3500,
    recommendedServices: "AI Appointment Setter, Ads Optimization y Speed-to-Lead",
    keywords: ["roof", "roofing", "roofer", "shingles"],
  },
  {
    name: "Electricistas",
    tier: "high",
    baseScore: 35,
    typicalTicket: 1000,
    recommendedServices: "AI Receptionist 24/7 y Speed-to-Lead",
    keywords: ["electric", "electrician", "electrical", "wiring"],
  },
  {
    name: "Solar & Energías Renovables",
    tier: "high",
    baseScore: 35,
    typicalTicket: 5000,
    recommendedServices: "AI Appointment Setter y Reactivador Outbound",
    keywords: ["solar", "solar_panel", "clean_energy"],
  },
  {
    name: "Contabilidad, Impuestos & CPA",
    tier: "high",
    baseScore: 35,
    typicalTicket: 800,
    recommendedServices: "AI Appointment Setter, Voice Confirmations y Review Booster",
    keywords: ["account", "accounting", "cpa", "tax", "taxes", "bookkeep", "finance", "audit", "payroll"],
  },
  {
    name: "Abogados & Servicios Legales",
    tier: "high",
    baseScore: 35,
    typicalTicket: 1800,
    recommendedServices: "AI Receptionist 24/7 y AI Appointment Setter",
    keywords: ["law", "lawyer", "attorney", "legal", "notary"],
  },
  {
    name: "Dental & Odontología",
    tier: "high",
    baseScore: 32,
    typicalTicket: 650,
    recommendedServices: "AI Appointment Setter, Voice Confirmations y Review Booster",
    keywords: ["dent", "dental", "dentist", "orthodont", "teeth"],
  },
  {
    name: "Restauración & Daños por Agua",
    tier: "high",
    baseScore: 35,
    typicalTicket: 2500,
    recommendedServices: "AI Receptionist 24/7 y Speed-to-Lead",
    keywords: ["restoration", "water_damage", "mold", "fire_damage", "flood"],
  },
  {
    name: "Talleres Mecánicos & Car Care",
    tier: "medium",
    baseScore: 28,
    typicalTicket: 450,
    recommendedServices: "AI Receptionist 24/7, Review Booster y Voice Confirmations",
    keywords: ["car_repair", "auto_repair", "mechanic", "tire", "brakes", "auto_body", "oil_change"],
  },
  {
    name: "Cafetería, Panadería & Restaurante",
    tier: "medium",
    baseScore: 25,
    typicalTicket: 250,
    recommendedServices: "AI Review Booster, WhatsApp Ordering y Menú Digital con IA",
    keywords: ["bakery", "coffee", "coffee_shop", "cafe", "restaurant", "food", "panaderia", "pastry", "catering", "dining"],
  },
  {
    name: "Salón de Belleza, Barbería & Spa",
    tier: "medium",
    baseScore: 25,
    typicalTicket: 200,
    recommendedServices: "AI Appointment Setter, Review Booster y WhatsApp Chatbot",
    keywords: ["salon", "beauty", "hair", "barber", "spa", "nail", "massage", "lashes"],
  },
  {
    name: "Gimnasios & Fitness",
    tier: "medium",
    baseScore: 25,
    typicalTicket: 220,
    recommendedServices: "AI Follow-Up Nurture y Ads Optimization",
    keywords: ["gym", "fitness", "crossfit", "yoga", "pilates", "training"],
  },
  {
    name: "Veterinarias & Mascotas",
    tier: "medium",
    baseScore: 28,
    typicalTicket: 350,
    recommendedServices: "AI Appointment Setter y Review Booster",
    keywords: ["veterin", "vet", "pet", "animal", "dog", "cat"],
  },
  {
    name: "Jardinería & Landscaping",
    tier: "medium",
    baseScore: 25,
    typicalTicket: 400,
    recommendedServices: "Speed-to-Lead y AI Review Booster",
    keywords: ["landscape", "landscaping", "lawn", "garden", "tree_service"],
  },
  {
    name: "Limpieza Comercial & Residencial",
    tier: "medium",
    baseScore: 25,
    typicalTicket: 350,
    recommendedServices: "AI Appointment Setter y Speed-to-Lead",
    keywords: ["cleaning", "maid", "janitorial", "carpet_cleaning"],
  },
  {
    name: "Cerrajería & Locksmith",
    tier: "medium",
    baseScore: 28,
    typicalTicket: 250,
    recommendedServices: "AI Receptionist 24/7 y Speed-to-Lead",
    keywords: ["lock", "locksmith", "key", "cerrajeria"],
  },
  {
    name: "Control de Plagas",
    tier: "medium",
    baseScore: 28,
    typicalTicket: 400,
    recommendedServices: "AI Appointment Setter y Review Booster",
    keywords: ["pest", "pest_control", "termite", "exterminator"],
  },
];

export function scoreFitNegocioDim(input: ScoringInput): {
  score: number;
  reasoning: string;
} {
  let score = 0;
  let matchedProfile: SectorProfile | null = null;

  // Build unified search string from all business metadata
  const typesStr = Array.isArray(input.businessTypes) 
    ? input.businessTypes.join(" ") 
    : (input.businessTypes ?? "");
  const searchCorpus = `${input.businessName ?? ""} ${input.primaryType ?? ""} ${typesStr} ${input.sector ?? ""}`.toLowerCase();

  for (const profile of SECTOR_PROFILES) {
    if (profile.keywords.some((k) => searchCorpus.includes(k))) {
      matchedProfile = profile;
      break;
    }
  }

  if (matchedProfile) {
    score += matchedProfile.baseScore;
    const ticket = input.avgTicketUsd ?? matchedProfile.typicalTicket;

    if (ticket >= 1500) {
      score += 30;
    } else if (ticket >= 600) {
      score += 22;
    } else if (ticket >= 250) {
      score += 15;
    } else {
      score += 8;
    }

    if (input.is24_7Emergency) {
      score += 25;
    }

    if (input.locationCount && input.locationCount > 1) {
      score += 15;
    }

    const multiText =
      input.locationCount && input.locationCount > 1
        ? ` · 📍 Cadena multi-sucursal (${input.locationCount} locales)`
        : "";
    const reasoning = `Fit: Sector ${matchedProfile.name} (Ticket ~$${ticket})${multiText}. Ideal para ${matchedProfile.recommendedServices}.`;
    return { score: Math.min(100, score), reasoning };
  }

  // Fallback if truly unknown
  const multiText =
    input.locationCount && input.locationCount > 1
      ? ` · 📍 Cadena (${input.locationCount} locales)`
      : "";
  return {
    score: 35 + (input.locationCount && input.locationCount > 1 ? 15 : 0),
    reasoning: `Fit: Comercio local general${multiText}. Apto para Review Booster y WhatsApp Chatbot.`,
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

  // Google Reviews volume (strongest proof of cash flow and customer base)
  if (input.reviewCount !== null && input.reviewCount > 0) {
    if (input.reviewCount >= 100) {
      score += 35;
      signals.push(`${input.reviewCount} reseñas en Google (alto flujo de clientes)`);
    } else if (input.reviewCount >= 50) {
      score += 28;
      signals.push(`${input.reviewCount} reseñas en Google (flujo comercial constante)`);
    } else if (input.reviewCount >= 15) {
      score += 18;
      signals.push(`${input.reviewCount} reseñas (negocio activo)`);
    } else {
      score += 10;
      signals.push(`${input.reviewCount} reseñas`);
    }
  }

  // High rating indicates owner cares about reputation and customer experience
  const rating = input.googleRating ?? (input.hasGoogleRating ? 4.5 : null);
  if (rating !== null && rating >= 4.0) {
    score += 20;
    signals.push(`rating ${rating.toFixed(1)}★ (cuida su reputación)`);
  }

  // Physical verified location
  if (input.hasAddress) {
    score += 15;
    signals.push("local comercial físico verificado");
  }

  // Active phone line
  if (input.hasPhone) {
    score += 15;
    signals.push("línea telefónica activa");
  }

  // Years in business estimation
  if (input.yearsInBusiness !== null && input.yearsInBusiness >= 2) {
    score += 12;
    signals.push(`${input.yearsInBusiness}+ años operando`);
  }

  // Active digital advertising & Tracking pixels
  const hasAds = input.hasActiveAds === true || Boolean(input.digitalSignals?.has_active_ads);
  if (hasAds) {
    score += 18;
    const adList = input.digitalSignals?.detected_ad_pixels?.length
      ? `invierte en publicidad (${input.digitalSignals.detected_ad_pixels.join(", ")})`
      : "invierte en publicidad digital";
    signals.push(adList);
  }

  // Yelp Fusion reputation signals
  if (input.yelpData) {
    if (input.yelpData.reviewCount >= 10) {
      score += 12;
      signals.push(`${input.yelpData.reviewCount} reseñas en Yelp (${input.yelpData.rating}★)`);
    }
    if (Math.abs(input.yelpData.reputationGap) >= 0.7) {
      score += 15;
      signals.push(`brecha de reputación (${input.googleRating?.toFixed(1) ?? "4.5"}★ Google vs ${input.yelpData.rating}★ Yelp)`);
    }
  }

  return {
    score: Math.min(100, Math.max(score, 20)),
    reasoning:
      signals.length > 0
        ? `Señales detectadas: ${signals.slice(0, 3).join(", ")}.`
        : "Negocio local activo en Google Maps.",
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
    return { score: 50, reasoning: "Distancia no especificada, score neutral." };
  }
  if (distanceMiles <= 3) {
    return { score: 100, reasoning: `A ${distanceMiles.toFixed(1)} mi (zona inmediata de alta cobertura).` };
  }
  if (distanceMiles <= 7) {
    return { score: 85, reasoning: `A ${distanceMiles.toFixed(1)} mi (fácil acceso en auto).` };
  }
  if (distanceMiles <= 15) {
    return { score: 65, reasoning: `A ${distanceMiles.toFixed(1)} mi (distancia moderada en Inland Empire).` };
  }
  if (distanceMiles <= 30) {
    return { score: 45, reasoning: `A ${distanceMiles.toFixed(1)} mi (requiere coordinación de traslado).` };
  }
  return { score: 20, reasoning: `A ${distanceMiles.toFixed(1)} mi (zona periférica).` };
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
    brecha.score * DIMENSION_WEIGHTS.brechaDigital +
      gap.score * DIMENSION_WEIGHTS.gapOperativo +
      fit.score * DIMENSION_WEIGHTS.fitNegocio +
      senales.score * DIMENSION_WEIGHTS.senalesCompra +
      prox.score * DIMENSION_WEIGHTS.proximidad
  );

  const tier: ScoreTier =
    total >= 75 ? "hot" :
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
    reasoning: {
      brechaDigital: brecha.reasoning,
      gapOperativo: gap.reasoning,
      fitNegocio: fit.reasoning,
      senalesCompra: senales.reasoning,
      proximidad: prox.reasoning,
    },
  };
}
