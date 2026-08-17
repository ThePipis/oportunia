/**
 * Proposal Generator
 *
 * Builds a structured proposal for a business based on:
 * - Business info (name, type, address, rating)
 * - 5D Score breakdown
 * - Matched AI services
 * - User's company info (from settings, optional)
 *
 * Output is a JSON structure that can be:
 * - Rendered as HTML for in-app editing
 * - Converted to PDF
 * - Sent via email (future)
 */

import { getBusiness } from "@/lib/db/repositories/businesses";
import { getScore } from "@/lib/db/repositories/scores";
import { getMatchedServices } from "@/lib/scoring/service-matcher";
import { getDb } from "@/lib/db/client";

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
  // Recommended services
  services: Array<{
    name: string;
    icon: string;
    tier: number;
    relevance: number;
    description: string;
    pitch: string;
    setupPrice: number;
    monthlyPrice: number;
    annualPrice: number;
  }>;
  // Investment
  investment: {
    totalSetup: number;
    totalMonthly: number;
    annualTotal: number;
    packageVsAlaCarte: string;
  };
  // ROI estimate
  roi: {
    estimatedCallsCaptured: string;
    estimatedRevenueImpact: string;
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

export function generateProposal(businessId: string): ProposalContent {
  const business = getBusiness(businessId);
  if (!business) {
    throw new Error(`Business ${businessId} not found`);
  }
  const score = getScore(businessId);
  if (!score) {
    throw new Error(
      `Business ${businessId} has no score. Run /rescore first.`
    );
  }
  const matchedServices = getMatchedServices(businessId);

  // Read company info from settings (if available)
  const db = getDb();
  const companyNameSetting = db
    .prepare(`SELECT value FROM settings WHERE key = ?`)
    .get("company_name") as { value: string } | undefined;

  const companyName = companyNameSetting?.value ?? "OportunIA Agency";
  const companyTagline = "AI services for local businesses";

  // Build pain points from the score reasoning
  const scoreData = JSON.parse(score.breakdown_json ?? "{}");
  const painPoints: string[] = [];
  if (score.score_brecha_digital >= 60) {
    painPoints.push(
      `Brecha digital alta: ${scoreData.reasoning?.brechaDigital ?? "múltiples gaps"}`
    );
  }
  if (score.score_gap_operativo >= 60) {
    painPoints.push(
      `Gap operativo: ${scoreData.reasoning?.gapOperativo ?? "responde tarde, sin 24/7"}`
    );
  }
  if (score.score_fit_negocio >= 60) {
    painPoints.push(
      `Tu sector (${business.primary_type ?? "tu industria"}) tiene alto fit con AI services`
    );
  }
  if (score.score_brecha_digital < 40 && score.score_gap_operativo < 40) {
    painPoints.push(
      "Tu presencia digital ya está bien optimizada — esta propuesta es opcional."
    );
  }

  // Executive summary
  const tierLabel: Record<string, string> = {
    hot: "alto potencial",
    warm: "buen potencial",
    nurture: "potencial medio",
    skip: "potencial bajo",
  };
  const tierText = tierLabel[score.tier] ?? "potencial variable";
  const executiveSummary = `Después de analizar tu negocio en ${business.city ?? "tu zona"}, identificamos un ${tierText} de capturar clientes que hoy se te escapan. Esta propuesta incluye los servicios de AI que mejor encajan con tu operación, con un ROI estimado de recuperar ${score.score_gap_operativo * 50 + score.score_brecha_digital * 30} USD/mes en oportunidades perdidas.`;

  // Build services
  const services = matchedServices.map((s) => ({
    name: s.serviceName,
    icon: s.serviceIcon,
    tier: s.serviceTier,
    relevance: s.relevance,
    description: s.pitch.split(".")[0] + ".",
    pitch: s.pitch,
    setupPrice: s.priceSetup,
    monthlyPrice: s.priceMonthly,
    annualPrice: s.priceSetup + s.priceMonthly * 12,
  }));

  // Totals
  const totalSetup = services.reduce((sum, s) => sum + s.setupPrice, 0);
  const totalMonthly = services.reduce((sum, s) => sum + s.monthlyPrice, 0);
  const annualTotal = totalSetup + totalMonthly * 12;

  // ROI estimate (heuristic: 3-5x monthly fee in captured revenue)
  const roiMultiplier = 3.5;
  const estimatedMonthlyRevenue = Math.round(totalMonthly * roiMultiplier);
  const estimatedCallsCaptured = `${Math.round(totalMonthly / 50)}-${Math.round(totalMonthly / 20)} llamadas/mes`;
  const estimatedRevenueImpact = `~$${estimatedMonthlyRevenue.toLocaleString()}/mes ($${(estimatedMonthlyRevenue * 12).toLocaleString()}/año)`;
  const paybackPeriod =
    totalSetup > 0 && estimatedMonthlyRevenue > 0
      ? `${Math.ceil(totalSetup / estimatedMonthlyRevenue)} meses`
      : "N/A";

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
    investment: {
      totalSetup,
      totalMonthly,
      annualTotal,
      packageVsAlaCarte:
        "Este paquete ya tiene descuento por bundle vs. contratar cada servicio por separado.",
    },
    roi: {
      estimatedCallsCaptured,
      estimatedRevenueImpact,
      paybackPeriod,
    },
    nextSteps: [
      "1. Revisar la propuesta (válida por 14 días)",
      "2. Agendar una llamada de 30 min para discutir detalles y resolver dudas",
      "3. Firmar contrato + pago de setup",
      "4. Onboarding de 1 semana: configuramos tus herramientas",
      "5. Go-live: empiezas a recibir el ROI desde el día 1",
    ],
    footer: {
      contactEmail: "ventas@oportunia.agency",
      contactPhone: "(951) 555-0123",
      website: "https://oportunia.agency",
    },
  };
}
