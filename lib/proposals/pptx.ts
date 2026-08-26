/**
 * Generador Dinámico de Pitch Deck PPTX (6 Slides Ejecutivos)
 *
 * Crea una presentación ejecutiva 100% personalizada por cliente y SERVICIOS SELECCIONADOS:
 *   Slide 1: Portada con nombre del negocio, ciudad, score y tier.
 *   Slide 2: Diagnóstico "HOY vs. CON IA" — Sintetizado dinámicamente según los servicios activos.
 *   Slide 3: Pérdida en $ (Costo Real de Inacción) — Métricas y fugas financieras según servicios activos.
 *   Slide 4: Soluciones Propuestas — Layout adaptativo (1 hero card, 2 columnas grandes, 3 columnas, grid).
 *   Slide 5: Inversión, Ahorro por Paquete y Retorno ROI (Punto de equilibrio en clientes/mes).
 *   Slide 6: Próximos Pasos & Roadmap de Implementación (Go-Live en 72h) con llamada a la acción.
 */

import PptxGenJS from "pptxgenjs";
import type { ProposalContent, ProposalServiceItem } from "./generator";

const THEME = {
  primary: "0F172A",     // slate-900
  secondary: "0EA5E9",   // sky-500
  accent: "F97316",      // orange-500
  success: "16A34A",     // emerald-600
  danger: "DC2626",      // red-600
  light: "F0F9FF",       // sky-50
  cardBorder: "BAE6FD",  // sky-200
  muted: "64748B",       // slate-500
  bg: "FFFFFF",
  darkBg: "0F172A",
};

// ── Perfiles Dinámicos de Dolor, Solución e Impacto por Servicio ──
interface ServiceProfile {
  pain: string;
  solution: string;
  kpiLabel: string;
  getKpiValue: (ticket: number) => string;
  monthlyLeakDollars: (ticket: number) => number;
}

const SERVICE_PROFILES: Record<string, ServiceProfile> = {
  ai_receptionist_24_7: {
    pain: "Llamadas fuera de horario sin atender: 30-60% de prospectos de emergencia llaman a la competencia al no recibir respuesta inmediata.",
    solution: "Recepcionista de Voz IA 24/7 en inglés y español: contesta en <3s, califica el caso, agenda la visita y transfiere urgencias.",
    kpiLabel: "Llamadas Perdidas\nFuera de Horario",
    getKpiValue: () => "12-25 / mes",
    monthlyLeakDollars: (ticket) => Math.round(15 * ticket * 0.5),
  },
  speed_to_lead: {
    pain: "Respuesta tardía a leads web (4+ horas): el 78% de los clientes contratan al primer negocio que les responde.",
    solution: "Sistema Speed-to-Lead con respuesta SMS/WhatsApp en <60 segundos: califica intención y agenda directo en el calendario.",
    kpiLabel: "Leads Web Que Se\nEnfrían por Demora",
    getKpiValue: () => "15-30 / mes",
    monthlyLeakDollars: (ticket) => Math.round(12 * ticket * 0.4),
  },
  ai_appointment_setter: {
    pain: "Sin agendamiento digital directo 24/7: el 40% de visitas que buscan reservar en la noche o fin de semana abandonan.",
    solution: "Asistente de citas web + WhatsApp 24/7 sincronizado a su calendario en tiempo real sin intervención humana.",
    kpiLabel: "Citas No Concretadas\npor Falta de Booking",
    getKpiValue: () => "8-18 / mes",
    monthlyLeakDollars: (ticket) => Math.round(10 * ticket * 0.6),
  },
  ai_review_booster: {
    pain: "80% de clientes satisfechos nunca dejan reseña; una sola queja aislada sin balancear daña la reputación y aleja prospectos.",
    solution: "Solicitud automatizada post-servicio por SMS: maximiza reseñas de 5 estrellas en Google y desvía quejas al dueño en privado.",
    kpiLabel: "Reseñas 5-Estrellas\nNo Capturadas",
    getKpiValue: () => "+15-25 / mes",
    monthlyLeakDollars: (ticket) => Math.round(6 * ticket * 0.5),
  },
  ai_reputation_manager: {
    pain: "Reseñas en Google/Yelp sin respuesta rápida, proyectando imagen de abandono y desinterés frente a nuevos clientes.",
    solution: "Monitoreo 24/7 multicanal con generación automática de respuestas ejecutivas y aprobación en 1 solo clic.",
    kpiLabel: "Reseñas Sin Responder\no Desatendidas",
    getKpiValue: () => "100% cubierto",
    monthlyLeakDollars: (ticket) => Math.round(4 * ticket * 0.4),
  },
  ai_outbound_reactivator: {
    pain: "Base de datos de clientes antiguos inactiva y sin seguimiento: miles de dólares en mantenimientos estacionales retenidos.",
    solution: "Llamadas salientes con Agente de Voz IA para reactivar clientes pasados, ofrecer tune-ups y agendar revisiones.",
    kpiLabel: "Revenue Retenido en\nBase de Clientes",
    getKpiValue: (ticket) => `$${(ticket * 40).toLocaleString()}+`,
    monthlyLeakDollars: (ticket) => Math.round(ticket * 8),
  },
  ai_follow_up_nurture: {
    pain: "El 80% de presupuestos enviados se pierden por falta de seguimiento comercial estructurado en los primeros 14 días.",
    solution: "Secuencia inteligente multicanal (5-7 contactos por SMS/Email/Voz) en 14 días aumentando la tasa de cierre 3x.",
    kpiLabel: "Presupuestos Caídos\npor Falta de Nurture",
    getKpiValue: () => "3x conversión",
    monthlyLeakDollars: (ticket) => Math.round(ticket * 6),
  },
  ai_web_chat_24_7: {
    pain: "El 97% del tráfico de su sitio web se retira sin dejar datos ni comunicarse por falta de atención interactiva en vivo.",
    solution: "Chatbot IA conversacional 24/7 que aclara dudas de servicios, precios y captura el teléfono del prospecto.",
    kpiLabel: "Visitas Web Que Se Van\nSin Dejar Contacto",
    getKpiValue: () => "97% del tráfico",
    monthlyLeakDollars: (ticket) => Math.round(8 * ticket * 0.35),
  },
  ai_dispatching_routing: {
    pain: "Rutas ineficientes y desplazamientos cruzados: hasta 30% de horas-hombre y combustible desperdiciados en traslados.",
    solution: "Despacho inteligente con optimización geográfica de rutas, avisos de llegada por SMS y reasignación en vivo.",
    kpiLabel: "Gasto en Combustible\ny Rutas Ineficientes",
    getKpiValue: () => "30% exceso",
    monthlyLeakDollars: () => 2400,
  },
  ai_content_social: {
    pain: "Presencia digital y redes sociales estancadas por falta de tiempo, cediendo visibilidad y autoridad al competidor local.",
    solution: "Generación mensual automatizada de 12 contenidos para redes + 2 artículos SEO locales con revisión en 5 minutos.",
    kpiLabel: "Publicaciones / Mes\npara Ganar Autoridad",
    getKpiValue: () => "14 piezas/mes",
    monthlyLeakDollars: (ticket) => Math.round(ticket * 3),
  },
  ai_voice_confirmations: {
    pain: "Tasa de inasistencia (no-shows) del 20%: huecos vacíos en la agenda que generan pérdidas directas por tiempo improductivo.",
    solution: "Llamadas y SMS automatizados de confirmación 24h antes con reprogramación autónoma si el cliente cancela.",
    kpiLabel: "Pérdida por Citas No\nAsistidas (No-Show)",
    getKpiValue: () => "20% no-shows",
    monthlyLeakDollars: (ticket) => Math.round(8 * ticket * 0.8),
  },
  ai_ads_optimization: {
    pain: "Gasto en Google Ads con costo por clic (CPC) inflado y copys genéricos que no convierten leads calificados.",
    solution: "A/B testing continuo con 20 variaciones de copy, exclusión de términos negativos y rotación de anuncios ganadores.",
    kpiLabel: "Ahorro Estimado en\nCosto por Clic (CPC)",
    getKpiValue: () => "30% - 50%",
    monthlyLeakDollars: () => 1800,
  },
};

function getProfileForService(svc: ProposalServiceItem): ServiceProfile {
  if (SERVICE_PROFILES[svc.id]) {
    return SERVICE_PROFILES[svc.id];
  }
  return {
    pain: `Procesos manuales en ${svc.name}: pérdida de oportunidades por falta de automatización continua.`,
    solution: `Implementación especializada de ${svc.name} operando 24/7 con integración a su flujo de trabajo.`,
    kpiLabel: `Optimización con\n${svc.name}`,
    getKpiValue: () => "100% activo",
    monthlyLeakDollars: (ticket) => Math.round(ticket * 4),
  };
}

function addPageNumber(slide: any, pres: any, num: number) {
  slide.addShape(pres.ShapeType.ellipse, {
    x: 9.3, y: 5.1, w: 0.4, h: 0.4,
    fill: { color: THEME.accent }, line: { color: THEME.accent, width: 0 },
  });
  slide.addText(String(num), {
    x: 9.3, y: 5.1, w: 0.4, h: 0.4,
    fontSize: 12, fontFace: "Arial",
    color: "FFFFFF", bold: true, align: "center", valign: "middle",
  });
}

function addFooterBar(slide: any, pres: any, companyName: string) {
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 5.35, w: 10, h: 0.28,
    fill: { color: THEME.primary }, line: { width: 0 },
  });
  slide.addText(companyName, {
    x: 0.3, y: 5.35, w: 5, h: 0.28,
    fontSize: 8, fontFace: "Arial", color: THEME.muted, valign: "middle",
  });
}

// ============================
// SLIDE 1: PORTADA
// ============================
function createCoverSlide(pres: PptxGenJS, data: ProposalContent) {
  const slide = pres.addSlide();
  slide.background = { color: THEME.darkBg };

  // Decorative bands
  slide.addShape(pres.ShapeType.rect, {
    x: 6.5, y: 0, w: 3.5, h: 0.12,
    fill: { color: THEME.accent }, line: { width: 0 },
  });
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 5.5, w: 3.5, h: 0.12,
    fill: { color: THEME.secondary }, line: { width: 0 },
  });

  // Radar icon circle
  slide.addShape(pres.ShapeType.ellipse, {
    x: 4.25, y: 0.6, w: 1.5, h: 1.5,
    fill: { color: THEME.accent }, line: { color: "FFFFFF", width: 3 },
  });
  slide.addText("◎", {
    x: 4.25, y: 0.6, w: 1.5, h: 1.5,
    fontSize: 60, fontFace: "Arial",
    color: "FFFFFF", bold: true, align: "center", valign: "middle",
  });

  slide.addText("Propuesta Ejecutiva de Automatización & IA para", {
    x: 0.5, y: 2.3, w: 9, h: 0.5,
    fontSize: 16, fontFace: "Arial",
    color: THEME.secondary, align: "center",
  });

  slide.addText(data.to.businessName, {
    x: 0.5, y: 2.8, w: 9, h: 0.9,
    fontSize: 38, fontFace: "Arial",
    color: "FFFFFF", bold: true, align: "center",
  });

  slide.addText(`${data.to.city || "Inland Empire"}, ${data.to.state || "CA"}`, {
    x: 0.5, y: 3.7, w: 9, h: 0.4,
    fontSize: 16, fontFace: "Arial",
    color: THEME.muted, align: "center",
  });

  const tier = data.diagnostic.tier;
  const tierLabel = tier === "hot" ? "🔥 Alto Potencial de Cierre" : tier === "warm" ? "⚡ Lead Caliente" : "🌱 Oportunidad Detectada";
  slide.addText(`Diagnóstico de Oportunidad: ${data.diagnostic.opportunityScore}/100  ·  ${tierLabel}`, {
    x: 1.5, y: 4.3, w: 7, h: 0.4,
    fontSize: 13, fontFace: "Arial",
    color: THEME.accent, bold: true, align: "center",
  });

  slide.addText(`${data.companyName}  ·  ${data.proposalDate}  ·  ${data.proposalNumber}`, {
    x: 0.5, y: 5.05, w: 9, h: 0.3,
    fontSize: 10, fontFace: "Arial",
    color: THEME.muted, align: "center",
  });

  addPageNumber(slide, pres, 1);
}

// ============================
// SLIDE 2: DIAGNÓSTICO "HOY vs CON IA" (100% DINÁMICO)
// ============================
function createDiagnosticSlide(pres: PptxGenJS, data: ProposalContent) {
  const slide = pres.addSlide();
  slide.background = { color: THEME.bg };

  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 0.12, h: 5.625,
    fill: { color: THEME.accent }, line: { width: 0 },
  });

  slide.addText("Diagnóstico Operativo: Hoy vs. Con IA", {
    x: 0.4, y: 0.22, w: 9, h: 0.5,
    fontSize: 26, fontFace: "Arial",
    color: THEME.primary, bold: true,
  });

  const activeServices = data.services.filter((s) => s.isSelected !== false);
  const svcCount = activeServices.length;

  slide.addText(`Análisis específico para ${data.to.businessName} basado en las ${svcCount} área(s) a transformar`, {
    x: 0.4, y: 0.72, w: 9, h: 0.3,
    fontSize: 12, fontFace: "Arial",
    color: THEME.secondary, italic: true,
  });

  // Extract service-specific pairs
  const pairs = activeServices.map((svc) => {
    const prof = getProfileForService(svc);
    return {
      svcName: svc.name,
      svcIcon: svc.icon,
      pain: prof.pain,
      solution: prof.solution,
    };
  });

  // Left Box: HOY (Pain)
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.4, y: 1.15, w: 4.4, h: 4.0,
    fill: { color: "FEF2F2" }, line: { color: THEME.danger, width: 1 },
    rectRadius: 0.1,
  });
  slide.addText("❌  HOY (Sin Automatización)", {
    x: 0.6, y: 1.25, w: 4.0, h: 0.35,
    fontSize: 14, fontFace: "Arial",
    color: THEME.danger, bold: true,
  });

  // Right Box: CON IA (Solution)
  slide.addShape(pres.ShapeType.roundRect, {
    x: 5.2, y: 1.15, w: 4.4, h: 4.0,
    fill: { color: "F0FDF4" }, line: { color: THEME.success, width: 1 },
    rectRadius: 0.1,
  });
  slide.addText("✅  CON NUESTRO SISTEMA IA (24/7)", {
    x: 5.4, y: 1.25, w: 4.0, h: 0.35,
    fontSize: 14, fontFace: "Arial",
    color: THEME.success, bold: true,
  });

  if (svcCount === 1) {
    // ── 1 Solo Servicio: Desglose profundo de 3 fases ──
    const pair = pairs[0];
    const leftPoints = [
      `Cuello de botella en ${pair.svcName}: ${pair.pain}`,
      "Dependencia de atención manual sujeta a horarios limitados y fatiga.",
      "Pérdida de ventaja comercial frente a competidores con respuesta inmediata.",
    ];
    const rightPoints = [
      `Implementación de ${pair.svcName}: ${pair.solution}`,
      "Disponibilidad absoluta 24/7/365 en tiempo real sin requerir personal extra.",
      "Registro, trazabilidad y sincronización inmediata con el equipo de trabajo.",
    ];

    leftPoints.forEach((p, i) => {
      slide.addText(`✗  ${p}`, {
        x: 0.6, y: 1.75 + i * 1.05, w: 4.0, h: 0.95,
        fontSize: 11, fontFace: "Arial", color: THEME.primary,
      });
    });

    rightPoints.forEach((p, i) => {
      slide.addText(`✓  ${p}`, {
        x: 5.4, y: 1.75 + i * 1.05, w: 4.0, h: 0.95,
        fontSize: 11, fontFace: "Arial", color: THEME.primary,
      });
    });

  } else if (svcCount === 2) {
    // ── 2 Servicios Seleccionados: 2 Bloques Amplios ──
    pairs.forEach((pair, i) => {
      const itemY = 1.75 + i * 1.6;

      // Left Item
      slide.addText(`${pair.svcIcon} ${pair.svcName}:`, {
        x: 0.6, y: itemY, w: 4.0, h: 0.3,
        fontSize: 12, fontFace: "Arial", color: THEME.danger, bold: true,
      });
      slide.addText(`✗ ${pair.pain}`, {
        x: 0.6, y: itemY + 0.32, w: 4.0, h: 1.2,
        fontSize: 10.5, fontFace: "Arial", color: THEME.primary,
      });

      // Right Item
      slide.addText(`${pair.svcIcon} ${pair.svcName}:`, {
        x: 5.4, y: itemY, w: 4.0, h: 0.3,
        fontSize: 12, fontFace: "Arial", color: THEME.success, bold: true,
      });
      slide.addText(`✓ ${pair.solution}`, {
        x: 5.4, y: itemY + 0.32, w: 4.0, h: 1.2,
        fontSize: 10.5, fontFace: "Arial", color: THEME.primary,
      });
    });

  } else {
    // ── 3 a 5 Servicios: Lista Concisa ──
    const maxShow = Math.min(pairs.length, 4);
    const itemHeight = 3.4 / maxShow;

    pairs.slice(0, maxShow).forEach((pair, i) => {
      const itemY = 1.7 + i * itemHeight;

      slide.addText(`✗ ${pair.svcName}: ${pair.pain}`, {
        x: 0.6, y: itemY, w: 4.0, h: itemHeight - 0.1,
        fontSize: maxShow === 3 ? 10 : 9, fontFace: "Arial", color: THEME.primary,
      });

      slide.addText(`✓ ${pair.svcName}: ${pair.solution}`, {
        x: 5.4, y: itemY, w: 4.0, h: itemHeight - 0.1,
        fontSize: maxShow === 3 ? 10 : 9, fontFace: "Arial", color: THEME.primary,
      });
    });
  }

  addFooterBar(slide, pres, data.companyName);
  addPageNumber(slide, pres, 2);
}

// ============================
// SLIDE 3: PÉRDIDA EN $ (100% DINÁMICO POR SERVICIO)
// ============================
function createLossSlide(pres: PptxGenJS, data: ProposalContent) {
  const slide = pres.addSlide();
  slide.background = { color: THEME.bg };

  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 0.12, h: 5.625,
    fill: { color: THEME.danger }, line: { width: 0 },
  });

  slide.addText("¿Cuánto le cuesta la inacción a su negocio?", {
    x: 0.4, y: 0.22, w: 9, h: 0.5,
    fontSize: 26, fontFace: "Arial",
    color: THEME.primary, bold: true,
  });
  slide.addText("Fuga financiera estimada en los canales desatendidos", {
    x: 0.4, y: 0.72, w: 9, h: 0.3,
    fontSize: 12, fontFace: "Arial",
    color: THEME.danger, italic: true,
  });

  const avgTicket = data.roi.avgTicket || 350;
  const activeServices = data.services.filter((s) => s.isSelected !== false);

  // Calculate sum of specific monthly leaks from selected services
  const specificLeaks = activeServices.map((s) => {
    const prof = getProfileForService(s);
    return prof.monthlyLeakDollars(avgTicket);
  });
  
  const totalMonthlyLoss = specificLeaks.reduce((a, b) => a + b, 0) || (avgTicket * 6);
  const yearlyLoss = totalMonthlyLoss * 12;

  // Big red loss highlight card
  slide.addShape(pres.ShapeType.roundRect, {
    x: 1.5, y: 1.2, w: 7.0, h: 1.9,
    fill: { color: "FEF2F2" }, line: { color: THEME.danger, width: 2 },
    rectRadius: 0.12,
  });
  slide.addText(`-$${totalMonthlyLoss.toLocaleString()} USD / mes`, {
    x: 1.5, y: 1.3, w: 7.0, h: 0.9,
    fontSize: 44, fontFace: "Arial",
    color: THEME.danger, bold: true, align: "center",
  });
  slide.addText(`= -$${yearlyLoss.toLocaleString()} USD / año en ingresos que se van a la competencia`, {
    x: 1.5, y: 2.2, w: 7.0, h: 0.7,
    fontSize: 16, fontFace: "Arial",
    color: THEME.primary, bold: true, align: "center",
  });

  // Dynamic 4 KPI Metric Cards tailored to the selected services
  const dynamicKpis: Array<{ label: string; value: string; color: string }> = [];

  activeServices.forEach((svc) => {
    const prof = getProfileForService(svc);
    dynamicKpis.push({
      label: prof.kpiLabel,
      value: prof.getKpiValue(avgTicket),
      color: THEME.danger,
    });
  });

  // Fill up to 4 cards if fewer services selected
  if (dynamicKpis.length < 4) {
    dynamicKpis.push({
      label: "Ticket Promedio\nEstimado",
      value: `$${avgTicket}`,
      color: THEME.secondary,
    });
  }
  if (dynamicKpis.length < 4) {
    const clientsLost = Math.max(2, Math.round(totalMonthlyLoss / avgTicket));
    dynamicKpis.push({
      label: "Clientes No Captados\npor Mes",
      value: `~${clientsLost} clientes`,
      color: THEME.accent,
    });
  }
  if (dynamicKpis.length < 4) {
    dynamicKpis.push({
      label: "Tiempo de Respuesta\nActual",
      value: "> 4 horas",
      color: THEME.danger,
    });
  }

  const kpisToShow = dynamicKpis.slice(0, 4);
  const cardW = 2.15;
  const gapX = 0.2;
  const startX = 0.45;

  kpisToShow.forEach((m, i) => {
    const x = startX + i * (cardW + gapX);
    slide.addShape(pres.ShapeType.roundRect, {
      x, y: 3.35, w: cardW, h: 1.7,
      fill: { color: THEME.light }, line: { color: THEME.cardBorder, width: 0.75 },
      rectRadius: 0.08,
    });
    slide.addText(m.value, {
      x, y: 3.45, w: cardW, h: 0.75,
      fontSize: 24, fontFace: "Arial",
      color: m.color, bold: true, align: "center", valign: "middle",
    });
    slide.addText(m.label, {
      x: x + 0.1, y: 4.25, w: cardW - 0.2, h: 0.7,
      fontSize: 10, fontFace: "Arial",
      color: THEME.muted, align: "center", valign: "top",
    });
  });

  addFooterBar(slide, pres, data.companyName);
  addPageNumber(slide, pres, 3);
}

// ============================
// SLIDE 4: SOLUCIONES PROPUESTAS (ADAPTATIVO)
// ============================
function createServicesSlide(pres: PptxGenJS, data: ProposalContent) {
  const slide = pres.addSlide();
  slide.background = { color: THEME.bg };

  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 0.12, h: 5.625,
    fill: { color: THEME.secondary }, line: { width: 0 },
  });

  slide.addText("Soluciones Propuestas para Su Negocio", {
    x: 0.4, y: 0.25, w: 9, h: 0.6,
    fontSize: 26, fontFace: "Arial",
    color: THEME.primary, bold: true,
  });

  const activeServices = data.services.filter((s) => s.isSelected !== false);
  const svcCount = Math.min(activeServices.length, 6);

  if (svcCount === 1) {
    // ── 1 Solo Servicio: Tarjeta Hero Ancha ──
    const svc = activeServices[0];
    const x = 0.5;
    const y = 1.25;
    const w = 9.0;
    const h = 3.6;

    slide.addShape(pres.ShapeType.roundRect, {
      x, y, w, h,
      fill: { color: THEME.light },
      line: { color: THEME.secondary, width: 1 },
      rectRadius: 0.12,
    });

    slide.addText(`${svc.icon}  ${svc.name}`, {
      x: x + 0.3, y: y + 0.25, w: w - 0.6, h: 0.6,
      fontSize: 22, fontFace: "Arial",
      color: THEME.primary, bold: true,
    });

    slide.addText(`Tier ${svc.tier}   ·   Relevancia: ${svc.relevance}% Match con su modelo de negocio`, {
      x: x + 0.3, y: y + 0.85, w: w - 0.6, h: 0.35,
      fontSize: 12, fontFace: "Arial",
      color: THEME.accent, bold: true,
    });

    slide.addText(svc.pitch || svc.description, {
      x: x + 0.3, y: y + 1.35, w: w - 0.6, h: 1.2,
      fontSize: 14, fontFace: "Arial",
      color: THEME.primary,
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: x + 0.3, y: y + 2.65, w: w - 0.6, h: 0.65,
      fill: { color: "FFFFFF" },
      line: { color: THEME.secondary, width: 0.75 },
      rectRadius: 0.08,
    });
    slide.addText(`Inversión Setup: $${svc.setupPrice.toLocaleString()} USD    |    Retainer Mensual: $${svc.monthlyPrice.toLocaleString()} USD/mo    |    Total Año 1: $${svc.annualPrice.toLocaleString()} USD`, {
      x: x + 0.4, y: y + 2.65, w: w - 0.8, h: 0.65,
      fontSize: 13, fontFace: "Arial",
      color: THEME.secondary, bold: true, align: "center", valign: "middle",
    });

  } else if (svcCount === 2) {
    // ── 2 Servicios: 2 Columnas Grandes ──
    const cardW = 4.35;
    const cardH = 3.6;
    const startY = 1.25;
    const gapX = 0.3;

    activeServices.forEach((svc, i) => {
      const x = 0.5 + i * (cardW + gapX);
      const y = startY;

      slide.addShape(pres.ShapeType.roundRect, {
        x, y, w: cardW, h: cardH,
        fill: { color: THEME.light },
        line: { color: THEME.secondary, width: 0.75 },
        rectRadius: 0.1,
      });

      slide.addText(`${svc.icon}  ${svc.name}`, {
        x: x + 0.2, y: y + 0.2, w: cardW - 0.4, h: 0.5,
        fontSize: 16, fontFace: "Arial",
        color: THEME.primary, bold: true,
      });

      slide.addText(`Tier ${svc.tier}  ·  Match: ${svc.relevance}%`, {
        x: x + 0.2, y: y + 0.7, w: cardW - 0.4, h: 0.3,
        fontSize: 11, fontFace: "Arial",
        color: THEME.accent, bold: true,
      });

      slide.addText(svc.pitch || svc.description, {
        x: x + 0.2, y: y + 1.1, w: cardW - 0.4, h: 1.4,
        fontSize: 11, fontFace: "Arial",
        color: THEME.primary,
      });

      slide.addShape(pres.ShapeType.roundRect, {
        x: x + 0.2, y: y + 2.7, w: cardW - 0.4, h: 0.65,
        fill: { color: "FFFFFF" },
        line: { color: THEME.secondary, width: 0.5 },
        rectRadius: 0.06,
      });
      slide.addText(`Setup: $${svc.setupPrice.toLocaleString()}  ·  Mensual: $${svc.monthlyPrice.toLocaleString()}/mo\nTotal Año 1: $${svc.annualPrice.toLocaleString()} USD`, {
        x: x + 0.2, y: y + 2.7, w: cardW - 0.4, h: 0.65,
        fontSize: 10, fontFace: "Arial",
        color: THEME.secondary, bold: true, align: "center", valign: "middle",
      });
    });

  } else {
    // ── 3 a 6 Servicios: Grid Multicolumna ──
    const cols = 3;
    const rows = Math.ceil(svcCount / cols);
    const cardW = 2.85;
    const cardH = rows === 1 ? 3.6 : 1.7;
    const startY = 1.2;
    const gapX = 0.22;
    const gapY = 0.18;

    activeServices.slice(0, 6).forEach((svc, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 0.4 + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);

      slide.addShape(pres.ShapeType.roundRect, {
        x, y, w: cardW, h: cardH,
        fill: { color: THEME.light },
        line: { color: THEME.secondary, width: 0.5 },
        rectRadius: 0.08,
      });

      slide.addText(`${svc.icon}  ${svc.name}`, {
        x: x + 0.12, y: y + 0.1, w: cardW - 0.24, h: 0.4,
        fontSize: 13, fontFace: "Arial",
        color: THEME.primary, bold: true,
      });

      if (cardH > 2.5) {
        slide.addText(`Match: ${svc.relevance}%  ·  Tier ${svc.tier}`, {
          x: x + 0.12, y: y + 0.5, w: cardW - 0.24, h: 0.25,
          fontSize: 9.5, fontFace: "Arial",
          color: THEME.accent, bold: true,
        });

        slide.addText(svc.pitch || svc.description, {
          x: x + 0.12, y: y + 0.8, w: cardW - 0.24, h: 1.8,
          fontSize: 10, fontFace: "Arial",
          color: THEME.muted,
        });

        slide.addText(`Setup: $${svc.setupPrice.toLocaleString()}  ·  Mensual: $${svc.monthlyPrice.toLocaleString()}/mo\nTotal Año: $${svc.annualPrice.toLocaleString()} USD`, {
          x: x + 0.12, y: y + cardH - 0.8, w: cardW - 0.24, h: 0.65,
          fontSize: 9.5, fontFace: "Arial",
          color: THEME.secondary, bold: true, align: "center",
        });
      } else {
        slide.addText(`Setup: $${svc.setupPrice} · $${svc.monthlyPrice}/mo (Match ${svc.relevance}%)`, {
          x: x + 0.12, y: y + 0.5, w: cardW - 0.24, h: 0.3,
          fontSize: 9, fontFace: "Arial",
          color: THEME.secondary, bold: true,
        });
        slide.addText(svc.description, {
          x: x + 0.12, y: y + 0.8, w: cardW - 0.24, h: 0.75,
          fontSize: 8.5, fontFace: "Arial",
          color: THEME.muted,
        });
      }
    });
  }

  addFooterBar(slide, pres, data.companyName);
  addPageNumber(slide, pres, 4);
}

// ============================
// SLIDE 5: INVERSIÓN & ROI
// ============================
function createInvestmentSlide(pres: PptxGenJS, data: ProposalContent) {
  const slide = pres.addSlide();
  slide.background = { color: THEME.bg };

  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 0.12, h: 5.625,
    fill: { color: THEME.success }, line: { width: 0 },
  });

  slide.addText("Inversión, Ahorro & Retorno", {
    x: 0.4, y: 0.22, w: 9, h: 0.5,
    fontSize: 26, fontFace: "Arial",
    color: THEME.primary, bold: true,
  });

  // Investment card (Left)
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.4, y: 0.95, w: 4.4, h: 4.1,
    fill: { color: THEME.light }, line: { color: THEME.secondary, width: 1 },
    rectRadius: 0.1,
  });

  slide.addText("💰 Desglose de Inversión", {
    x: 0.6, y: 1.1, w: 4.0, h: 0.4,
    fontSize: 18, fontFace: "Arial",
    color: THEME.primary, bold: true,
  });

  const invItems = [
    { label: "Pago Único de Setup:", value: `$${data.investment.totalSetup.toLocaleString()} USD`, color: THEME.primary },
    { label: "Retainer Mensual (MRR):", value: `$${data.investment.totalMonthly.toLocaleString()} USD/mo`, color: THEME.secondary },
    { label: "Inversión Total Año 1:", value: `$${data.investment.annualTotal.toLocaleString()} USD`, color: THEME.accent },
  ];

  invItems.forEach((item, i) => {
    slide.addText(item.label, {
      x: 0.65, y: 1.65 + i * 0.7, w: 2.2, h: 0.35,
      fontSize: 11, fontFace: "Arial", color: THEME.muted,
    });
    slide.addText(item.value, {
      x: 2.75, y: 1.65 + i * 0.7, w: 1.9, h: 0.35,
      fontSize: 14, fontFace: "Arial", color: item.color, bold: true, align: "right",
    });
  });

  if (data.investment.discountPercent > 0) {
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.65, y: 3.8, w: 3.9, h: 0.95,
      fill: { color: "DCFCE7" }, line: { color: THEME.success, width: 0.75 },
      rectRadius: 0.08,
    });
    slide.addText(`✓ Descuento de Paquete (${data.investment.discountPercent}% OFF)\nAhorro directo de $${data.investment.savingsAmount.toLocaleString()} USD en el setup de los servicios seleccionados.`, {
      x: 0.75, y: 3.85, w: 3.7, h: 0.85,
      fontSize: 10, fontFace: "Arial", color: THEME.success, bold: true, align: "center", valign: "middle",
    });
  }

  // ROI card (Right)
  slide.addShape(pres.ShapeType.roundRect, {
    x: 5.2, y: 0.95, w: 4.4, h: 4.1,
    fill: { color: "F0FDF4" }, line: { color: THEME.success, width: 1 },
    rectRadius: 0.1,
  });

  slide.addText("📈 Retorno de Inversión (ROI)", {
    x: 5.4, y: 1.1, w: 4.0, h: 0.4,
    fontSize: 18, fontFace: "Arial",
    color: THEME.primary, bold: true,
  });

  // Break-even highlight box
  slide.addShape(pres.ShapeType.roundRect, {
    x: 5.5, y: 1.65, w: 3.8, h: 1.3,
    fill: { color: THEME.success }, line: { width: 0 },
    rectRadius: 0.1,
  });
  slide.addText(`${data.roi.clientsNeededToBreakEven}`, {
    x: 5.5, y: 1.7, w: 3.8, h: 0.75,
    fontSize: 44, fontFace: "Arial",
    color: "FFFFFF", bold: true, align: "center",
  });
  slide.addText(`cliente(s) al mes cubre el 100% de la cuota`, {
    x: 5.5, y: 2.45, w: 3.8, h: 0.4,
    fontSize: 12, fontFace: "Arial",
    color: "FFFFFF", align: "center",
  });

  const roiItems = [
    { label: "Impacto Estimado:", value: data.roi.estimatedRevenueImpact },
    { label: "Prospectos Capturados:", value: data.roi.estimatedCallsCaptured },
    { label: "Payback del Setup:", value: data.roi.paybackPeriod },
  ];
  roiItems.forEach((item, i) => {
    slide.addText(item.label, {
      x: 5.5, y: 3.15 + i * 0.55, w: 2.1, h: 0.4,
      fontSize: 10.5, fontFace: "Arial", color: THEME.muted,
    });
    slide.addText(item.value, {
      x: 7.3, y: 3.15 + i * 0.55, w: 2.1, h: 0.4,
      fontSize: 11, fontFace: "Arial", color: THEME.primary, bold: true, align: "right",
    });
  });

  addFooterBar(slide, pres, data.companyName);
  addPageNumber(slide, pres, 5);
}

// ============================
// SLIDE 6: PRÓXIMOS PASOS & CIERRE
// ============================
function createCloseSlide(pres: PptxGenJS, data: ProposalContent) {
  const slide = pres.addSlide();
  slide.background = { color: THEME.darkBg };

  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 10, h: 0.12,
    fill: { color: THEME.accent }, line: { width: 0 },
  });

  slide.addText("Plan de Puesta en Marcha (Go-Live en 72 Horas)", {
    x: 0.5, y: 0.35, w: 9, h: 0.6,
    fontSize: 28, fontFace: "Arial",
    color: "FFFFFF", bold: true, align: "center",
  });
  slide.addText("Proceso ágil de implementación sin interrumpir sus operaciones actuales", {
    x: 0.5, y: 0.95, w: 9, h: 0.35,
    fontSize: 13, fontFace: "Arial",
    color: THEME.secondary, italic: true, align: "center",
  });

  const steps = [
    { num: "1", title: "Aprobación", desc: "Aceptación de la propuesta y firma del acuerdo de servicio.", icon: "✍️" },
    { num: "2", title: "Setup & Config", desc: "Pago de instalación e inicio de calibración con su catálogo y datos.", icon: "⚙️" },
    { num: "3", title: "Pruebas 72h", desc: "Testeo en vivo de agentes IA y aprobación de flujos.", icon: "🧪" },
    { num: "4", title: "Go-Live 🚀", desc: "Activación en producción: captura y cierre de clientes 24/7.", icon: "🎯" },
  ];

  steps.forEach((step, i) => {
    const x = 0.5 + i * 2.35;
    slide.addShape(pres.ShapeType.roundRect, {
      x, y: 1.6, w: 2.15, h: 2.3,
      fill: { color: "1E293B" }, line: { color: i === 3 ? THEME.accent : THEME.secondary, width: i === 3 ? 2 : 0.75 },
      rectRadius: 0.1,
    });
    slide.addShape(pres.ShapeType.ellipse, {
      x: x + 0.77, y: 1.75, w: 0.6, h: 0.6,
      fill: { color: i === 3 ? THEME.accent : THEME.secondary }, line: { width: 0 },
    });
    slide.addText(step.num, {
      x: x + 0.77, y: 1.75, w: 0.6, h: 0.6,
      fontSize: 20, fontFace: "Arial",
      color: "FFFFFF", bold: true, align: "center", valign: "middle",
    });
    slide.addText(`${step.icon} ${step.title}`, {
      x: x + 0.1, y: 2.5, w: 1.95, h: 0.4,
      fontSize: 13, fontFace: "Arial",
      color: "FFFFFF", bold: true, align: "center",
    });
    slide.addText(step.desc, {
      x: x + 0.15, y: 2.95, w: 1.85, h: 0.85,
      fontSize: 9.5, fontFace: "Arial",
      color: THEME.muted, align: "center",
    });
  });

  // Contact CTA Banner
  slide.addShape(pres.ShapeType.roundRect, {
    x: 1.5, y: 4.15, w: 7.0, h: 0.9,
    fill: { color: THEME.accent }, line: { width: 0 },
    rectRadius: 0.1,
  });
  slide.addText(`¿Comenzamos hoy?  ·  ${data.footer.contactPhone}  ·  ${data.footer.contactEmail}`, {
    x: 1.5, y: 4.15, w: 7.0, h: 0.9,
    fontSize: 16, fontFace: "Arial",
    color: "FFFFFF", bold: true, align: "center", valign: "middle",
  });

  slide.addText(`Propuesta ${data.proposalNumber} válida hasta el ${data.validUntil}`, {
    x: 0.5, y: 5.15, w: 9, h: 0.3,
    fontSize: 9.5, fontFace: "Arial",
    color: THEME.muted, align: "center",
  });

  addPageNumber(slide, pres, 6);
}

// ============================
// EXPORT: Generar PPTX Buffer
// ============================
export async function generateProposalPPTX(data: ProposalContent): Promise<Buffer> {
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_16x9";
  pres.title = `Propuesta Ejecutiva - ${data.to.businessName}`;
  pres.author = data.companyName;
  pres.subject = `Pitch Deck Automatización IA - ${data.to.businessName}`;

  createCoverSlide(pres, data);
  createDiagnosticSlide(pres, data);
  createLossSlide(pres, data);
  createServicesSlide(pres, data);
  createInvestmentSlide(pres, data);
  createCloseSlide(pres, data);

  const output = await pres.write({ outputType: "nodebuffer" });
  return output as Buffer;
}
