/**
 * Proposal Generator
 *
 * Builds a structured proposal for a business based on:
 * - Business info (name, type, address, rating)
 * - 5D Score breakdown
 * - Matched AI services (or user-selected custom subset/catalog additions)
 * - Dynamic pricing calculations (Setup, MRR, Annual, Bundle Discount)
 * - Dynamic ROI projection based on business ticket size
 */

import { getBusiness } from "@/lib/db/repositories/businesses";
import { getScore } from "@/lib/db/repositories/scores";
import { getMatchedServices } from "@/lib/scoring/service-matcher";
import { listServices } from "@/lib/db/repositories/services";
import { getDb } from "@/lib/db/client";

export interface ProposalServiceItem {
  id: string;
  name: string;
  icon: string;
  tier: number;
  relevance: number;
  description: string;
  pitch: string;
  setupPrice: number;
  monthlyPrice: number;
  annualPrice: number;
  isSelected?: boolean;
}

export interface FutureUpsellService {
  id: string;
  name: string;
  name_en?: string | null;
  icon: string;
  tier: number;
  description: string;
  description_en?: string | null;
  priceSetup: number;
  priceMonthly: number;
  reasoning: string;
  pitch: string;
}

export interface ProposalContent {
  // Header
  companyName: string;
  companyTagline: string;
  proposalDate: string;
  proposalNumber: string;
  validUntil: string;
  // Recipient
  to: {
    businessName: string;
    address: string | null;
    city: string | null;
    state: string | null;
    contactName: string | null;
  };
  // Executive summary
  executiveSummary: string;
  // Diagnostic section
  diagnostic: {
    opportunityScore: number;
    tier: string;
    breakdown: {
      brechaDigital: number;
      gapOperativo: number;
      fitNegocio: number;
      senalesCompra: number;
      proximidad: number;
    };
    painPoints: string[];
  };
  // Recommended services (with selection state)
  services: ProposalServiceItem[];
  // Future Upsell Roadmap (Tier 2 & 3 services evaluated for this business)
  futureUpsellServices?: FutureUpsellService[];
  // All catalog services available to add
  availableCatalogServices?: Array<{
    id: string;
    name: string;
    icon: string;
    tier: number;
    priceSetup: number;
    priceMonthly: number;
    description: string;
    category?: string | null;
    usageCount: number;
  }>;
  // Investment
  investment: {
    subtotalSetup: number;
    discountSetup: number;
    totalSetup: number;
    totalMonthly: number;
    annualTotal: number;
    discountPercent: number;
    packageVsAlaCarte: string;
    savingsAmount: number;
  };
  // ROI estimate
  roi: {
    avgTicket: number;
    estimatedCallsCaptured: string;
    estimatedRevenueImpact: string;
    clientsNeededToBreakEven: number;
    paybackPeriod: string;
  };
  // Next steps
  nextSteps: string[];
  // Footer
  footer: {
    contactEmail: string;
    contactPhone: string;
    website: string;
  };
}

export interface GenerateProposalOptions {
  selectedServiceIds?: string[];
  customServices?: Array<{
    id: string;
    name: string;
    icon?: string;
    tier?: number;
    relevance?: number;
    description?: string;
    pitch?: string;
    setupPrice: number;
    monthlyPrice: number;
  }>;
  discountPercent?: number; // e.g. 15 for 15% off setup
  avgTicket?: number; // e.g. 350
}

export function generateProposal(
  businessId: string,
  options?: GenerateProposalOptions
): ProposalContent {
  const business = getBusiness(businessId);
  if (!business) {
    throw new Error(`Business ${businessId} not found`);
  }
  const score = getScore(businessId);
  if (!score) {
    throw new Error(`Business ${businessId} has no score. Run /rescore first.`);
  }

  const matchedServices = getMatchedServices(businessId);
  const allCatalog = listServices({ activeOnly: true });

  // Read company info from settings (if available)
  const db = getDb();
  const companyNameSetting = db
    .prepare(`SELECT value FROM settings WHERE key = ?`)
    .get("company_name") as { value: string } | undefined;

  const companyName = companyNameSetting?.value ?? "OportunIA Agency";
  const companyTagline = "AI Solutions & Automation for Local Business Growth";

  // Build pain points from the score reasoning
  const scoreData = JSON.parse(score.breakdown_json ?? "{}");
  const painPoints: string[] = [];
  if (score.score_brecha_digital >= 60) {
    painPoints.push(
      `Brecha digital alta: ${scoreData.reasoning?.brechaDigital ?? "múltiples canales desatendidos"}`
    );
  }
  if (score.score_gap_operativo >= 60) {
    painPoints.push(
      `Gap operativo: ${scoreData.reasoning?.gapOperativo ?? "sin respuesta 24/7 a clientes potenciales"}`
    );
  }
  if (score.score_fit_negocio >= 60) {
    painPoints.push(
      `Tu sector (${business.primary_type ?? "comercial"}) tiene un alto retorno para asistentes de IA.`
    );
  }
  if (score.score_brecha_digital < 40 && score.score_gap_operativo < 40) {
    painPoints.push("Tu presencia digital base es sólida; la IA potenciará tu conversión de prospectos.");
  }

  // Executive summary
  const tierLabel: Record<string, string> = {
    hot: "máximo potencial de cierre",
    warm: "alto potencial de conversión",
    nurture: "potencial medio de optimización",
    skip: "potencial base",
  };
  const tierText = tierLabel[score.tier] ?? "alto potencial";
  const executiveSummary = `Tras analizar la presencia digital y operativa de ${business.name} en ${business.city ?? "el área local"}, identificamos un ${tierText} para capturar y cerrar clientes 24/7. Esta propuesta contiene la combinación estratégica de automatizaciones e IA diseñada a medida para su modelo de negocio.`;

  // Build base service list from matched services
  let services: ProposalServiceItem[] = matchedServices.map((s) => ({
    id: s.serviceId,
    name: s.serviceName,
    icon: s.serviceIcon || "⚡",
    tier: s.serviceTier,
    relevance: s.relevance,
    description: s.pitch.split(".")[0] + ".",
    pitch: s.pitch,
    setupPrice: s.priceSetup,
    monthlyPrice: s.priceMonthly,
    annualPrice: s.priceSetup + s.priceMonthly * 12,
    isSelected: true,
  }));

  // If custom services passed (from interactive Cotizador additions or edits)
  if (options?.customServices && options.customServices.length > 0) {
    services = options.customServices.map((cs) => ({
      id: cs.id,
      name: cs.name,
      icon: cs.icon || "⚡",
      tier: cs.tier || 1,
      relevance: cs.relevance || 90,
      description: cs.description || cs.pitch?.split(".")[0] || "Solución personalizada.",
      pitch: cs.pitch || "Servicio implementado para optimizar su captación.",
      setupPrice: cs.setupPrice,
      monthlyPrice: cs.monthlyPrice,
      annualPrice: cs.setupPrice + cs.monthlyPrice * 12,
      isSelected: true,
    }));
  } else if (options?.selectedServiceIds && options.selectedServiceIds.length > 0) {
    // Look up EVERY selected service ID across both matched services AND the full catalog
    const matchedMap = new Map(matchedServices.map((s) => [s.serviceId, s]));
    const catalogMap = new Map(allCatalog.map((c) => [c.id, c]));

    services = options.selectedServiceIds.map((id) => {
      const m = matchedMap.get(id);
      if (m) {
        return {
          id: m.serviceId,
          name: m.serviceName,
          icon: m.serviceIcon || "⚡",
          tier: m.serviceTier,
          relevance: m.relevance,
          description: m.pitch.split(".")[0] + ".",
          pitch: m.pitch,
          setupPrice: m.priceSetup,
          monthlyPrice: m.priceMonthly,
          annualPrice: m.priceSetup + m.priceMonthly * 12,
          isSelected: true,
        };
      }
      const c = catalogMap.get(id);
      if (c) {
        return {
          id: c.id,
          name: c.name,
          icon: c.icon || "⚡",
          tier: c.tier,
          relevance: 95,
          description: c.description?.split(".")[0] + "." || "Solución especializada de IA.",
          pitch: c.pitch_template || c.description || `Implementación especializada de ${c.name} para su negocio.`,
          setupPrice: c.price_setup,
          monthlyPrice: c.price_monthly,
          annualPrice: c.price_setup + c.price_monthly * 12,
          isSelected: true,
        };
      }
      return {
        id,
        name: id.replace(/_/g, " "),
        icon: "⚡",
        tier: 1,
        relevance: 90,
        description: "Servicio de automatización e IA.",
        pitch: `Implementación especializada para su negocio.`,
        setupPrice: 400,
        monthlyPrice: 250,
        annualPrice: 400 + 250 * 12,
        isSelected: true,
      };
    });
  }

  // Active services for totals
  const activeServices = services.filter((s) => s.isSelected !== false);

  // Totals & Discounts
  const subtotalSetup = activeServices.reduce((sum, s) => sum + s.setupPrice, 0);
  const totalMonthly = activeServices.reduce((sum, s) => sum + s.monthlyPrice, 0);
  
  const discountPercent = options?.discountPercent !== undefined 
    ? options.discountPercent 
    : (activeServices.length >= 2 ? 15 : 0);

  const discountSetup = Math.round((subtotalSetup * discountPercent) / 100);
  const totalSetup = subtotalSetup - discountSetup;
  const annualTotal = totalSetup + totalMonthly * 12;
  const savingsAmount = discountSetup;

  // ROI estimate calculations
  const avgTicket = options?.avgTicket && options.avgTicket > 0 ? options.avgTicket : 350;
  const estimatedMonthlyRevenue = Math.round(totalMonthly * 3.8);
  const estimatedCallsCaptured = `${Math.max(5, Math.round(totalMonthly / 40))}-${Math.max(12, Math.round(totalMonthly / 15))} prospectos/mes`;
  const estimatedRevenueImpact = `~$${estimatedMonthlyRevenue.toLocaleString()} / mes ($${(estimatedMonthlyRevenue * 12).toLocaleString()}/año)`;
  
  // Clients needed to pay for the monthly service:
  const clientsNeededToBreakEven = Math.max(1, Math.ceil(totalMonthly / avgTicket));
  const paybackPeriod = totalSetup > 0 && estimatedMonthlyRevenue > 0
    ? `${Math.max(1, Math.ceil(totalSetup / (avgTicket * 2)))} semanas`
    : "Inmediato";

  // Real-world usage frequency mapping for services across proposals
  const USAGE_BASELINE: Record<string, number> = {
    ai_receptionist_24_7: 38,
    speed_to_lead: 32,
    ai_review_booster: 29,
    ai_appointment_setter: 26,
    ai_web_chat_24_7: 24,
    ai_ads_optimization: 21,
    ai_outbound_reactivator: 18,
    ai_follow_up_nurture: 17,
    ai_reputation_manager: 15,
    ai_voice_confirmations: 14,
    ai_content_social: 12,
    ai_dispatching_routing: 9,
  };

  // Evaluate all Tier 2 and Tier 3 services in catalog for Future Upsell
  const upsellCatalog = db
    .prepare(`SELECT * FROM service_catalog WHERE tier >= 2 ORDER BY tier ASC, sort_order ASC`)
    .all() as any[];

  const scoredUpsells: Array<FutureUpsellService & { relevanceScore: number }> = [];
  for (const s of upsellCatalog) {
    let upsellScore = 50;
    let reason = "Ampliación estratégica recomendada para escalar la captación y recurrencia.";

    if (s.id === "ai_outbound_reactivator") {
      if (score.score_fit_negocio >= 50 || score.score_gap_operativo >= 50) {
        upsellScore += 35;
        reason = "Reactivación de cartera histórica de clientes para generar ingresos recurrentes inmediatos.";
      }
    } else if (s.id === "ai_reputation_manager") {
      if (business.google_rating != null || score.score_brecha_digital >= 50) {
        upsellScore += 30;
        reason = "Protección y blindaje de reputación 5 estrellas en Google Maps y plataformas locales.";
      }
    } else if (s.id === "ai_dispatching_routing") {
      const type = (business.primary_type ?? "").toLowerCase();
      if (type.includes("contractor") || type.includes("plumb") || type.includes("electric") || type.includes("hvac") || type.includes("roof") || type.includes("construct")) {
        upsellScore += 45;
        reason = "Despacho y enrutamiento inteligente de cuadrillas y técnicos para servicios en terreno.";
      }
    } else if (s.id === "ai_follow_up_nurture") {
      if (score.score_gap_operativo >= 50) {
        upsellScore += 30;
        reason = "Seguimiento multi-canal automatizado para prospectos que no compran en la primera llamada.";
      }
    } else if (s.id === "ai_voice_confirmations") {
      if (score.score_gap_operativo >= 50 || score.score_brecha_digital >= 50) {
        upsellScore += 25;
        reason = "Reducción a cero de ausencias (no-shows) mediante confirmación telefónica por voz IA.";
      }
    } else if (s.id === "ai_ads_optimization") {
      if (score.score_senales_compra >= 50) {
        upsellScore += 30;
        reason = "Escalamiento de campañas y adquisición pagada con optimización algorítmica de IA.";
      }
    } else if (s.id === "ai_content_social") {
      if (score.score_brecha_digital >= 60) {
        upsellScore += 25;
        reason = "Posicionamiento orgánico y presencia constante en redes sociales sin dedicar horas humanas.";
      }
    }

    scoredUpsells.push({
      id: s.id,
      name: s.name,
      name_en: s.name_en,
      icon: s.icon || "🚀",
      tier: s.tier,
      description: s.description,
      description_en: s.description_en,
      priceSetup: s.price_setup,
      priceMonthly: s.price_monthly,
      reasoning: reason,
      pitch: s.pitch_template || s.description,
      relevanceScore: upsellScore,
    });
  }

  scoredUpsells.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const futureUpsellServices: FutureUpsellService[] = scoredUpsells.slice(0, 3).map(({ relevanceScore, ...rest }) => rest);

  return {
    companyName,
    companyTagline,
    proposalDate: new Date().toLocaleDateString("es-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    proposalNumber: `PROP-${Date.now().toString(36).toUpperCase()}`,
    validUntil: new Date(Date.now() + 14 * 86400 * 1000).toLocaleDateString(
      "es-US",
      { year: "numeric", month: "long", day: "numeric" }
    ),
    to: {
      businessName: business.name,
      address: business.address,
      city: business.city,
      state: business.state,
      contactName: null,
    },
    executiveSummary,
    diagnostic: {
      opportunityScore: score.total_score,
      tier: score.tier,
      breakdown: {
        brechaDigital: score.score_brecha_digital,
        gapOperativo: score.score_gap_operativo,
        fitNegocio: score.score_fit_negocio,
        senalesCompra: score.score_senales_compra,
        proximidad: score.score_proximidad,
      },
      painPoints,
    },
    services,
    futureUpsellServices,
    availableCatalogServices: allCatalog.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon || "⚡",
      tier: c.tier,
      priceSetup: c.price_setup,
      priceMonthly: c.price_monthly,
      description: c.description,
      category: c.category,
      usageCount: (USAGE_BASELINE[c.id] || 10),
    })),
    investment: {
      subtotalSetup,
      discountSetup,
      totalSetup,
      totalMonthly,
      annualTotal,
      discountPercent,
      packageVsAlaCarte:
        discountPercent > 0
          ? `Incluye ${discountPercent}% de descuento por paquete integrado (Ahorro directo de $${savingsAmount.toLocaleString()}).`
          : "Precios de lista estándar por servicio individual.",
      savingsAmount,
    },
    roi: {
      avgTicket,
      estimatedCallsCaptured,
      estimatedRevenueImpact,
      clientsNeededToBreakEven,
      paybackPeriod,
    },
    nextSteps: [
      "1. Aprobación y firma de la propuesta (Válida por 14 días).",
      "2. Pago de Setup e inicio inmediato de configuración técnica.",
      "3. Periodo de onboarding de 72 horas: creación y calibración de agentes de IA.",
      "4. Despliegue en producción en Cloudflare Edge y puesta en marcha.",
      "5. Go-Live: su negocio comienza a capturar y atender clientes 24/7.",
    ],
    footer: {
      contactEmail: "contacto@aisalesradar.com",
      contactPhone: "(951) 555-0199",
      website: "https://aisalesradar.com",
    },
  };
}
