/**
 * PDF generator for proposals.
 * Uses jsPDF to create a multi-page professional PDF with dynamic service selection,
 * clean spacing, ROI breakdown, and formal acceptance / signature lines.
 */

import { jsPDF } from "jspdf";
import type { ProposalContent } from "./generator";

const COLORS = {
  primary: [15, 23, 42] as [number, number, number],     // slate-900
  secondary: [14, 165, 233] as [number, number, number],  // sky-500
  accent: [249, 115, 22] as [number, number, number],    // orange-500
  text: [15, 23, 42] as [number, number, number],        // slate-900
  textSecondary: [51, 65, 85] as [number, number, number], // slate-700
  muted: [100, 116, 139] as [number, number, number],    // slate-500
  border: [226, 232, 240] as [number, number, number],   // slate-200
  cardBg: [248, 250, 252] as [number, number, number],   // slate-50
  success: [16, 185, 129] as [number, number, number],   // emerald-500
  white: [255, 255, 255] as [number, number, number],
};

function drawSectionHeader(
  doc: jsPDF,
  title: string,
  x: number,
  y: number
) {
  // Small accent indicator bar
  doc.setFillColor(...COLORS.secondary);
  doc.rect(x, y - 10, 4, 15, "F");
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text(title, x + 12, y + 2);
}

export function generateProposalPDF(proposal: ProposalContent): Blob {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ===== HEADER =====
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 90, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(proposal.companyName, margin, 42);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(proposal.companyTagline, margin, 62);
  
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.white);
  doc.text(`Propuesta: ${proposal.proposalNumber}`, pageWidth - margin, 42, { align: "right" });
  doc.text(`Fecha: ${proposal.proposalDate}`, pageWidth - margin, 58, { align: "right" });
  doc.setTextColor(251, 146, 60); // orange-400
  doc.text(`Válida hasta: ${proposal.validUntil}`, pageWidth - margin, 74, { align: "right" });
  
  y = 115;

  // ===== TO (CLIENT DETAILS) =====
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("PREPARADO PARA:", margin, y);
  y += 15;
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text(proposal.to.businessName, margin, y);
  y += 17;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textSecondary);
  if (proposal.to.address) {
    doc.text(proposal.to.address, margin, y);
    y += 14;
  }
  if (proposal.to.city || proposal.to.state) {
    const cityLine = [proposal.to.city, proposal.to.state].filter(Boolean).join(", ");
    doc.text(cityLine, margin, y);
    y += 14;
  }
  y += 12;

  // ===== EXECUTIVE SUMMARY =====
  drawSectionHeader(doc, "Resumen Ejecutivo", margin, y);
  y += 24;
  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const summaryLines = doc.splitTextToSize(proposal.executiveSummary, contentWidth);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 14 + 18;

  // ===== DIAGNOSTIC =====
  if (y > pageHeight - 200) {
    doc.addPage();
    y = margin;
  }
  drawSectionHeader(doc, "Diagnóstico de Oportunidad (Score 5D)", margin, y);
  y += 24;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text(`Score de Oportunidad: ${proposal.diagnostic.opportunityScore}/100`, margin, y);
  
  const tierText: Record<string, string> = {
    hot: "🔥 Alto Potencial - Prioridad de Cierre",
    warm: "⚡ Buen Potencial - Lead Caliente",
    nurture: "🌱 Potencial Medio - Plan Nurture",
    skip: "❌ Potencial Base",
  };
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.accent);
  doc.text(`[ ${tierText[proposal.diagnostic.tier] ?? proposal.diagnostic.tier} ]`, margin + 210, y);
  y += 18;

  // Breakdown bars
  const dims = [
    { name: "Brecha Digital", value: proposal.diagnostic.breakdown.brechaDigital, color: COLORS.accent },
    { name: "Gap Operativo", value: proposal.diagnostic.breakdown.gapOperativo, color: [245, 158, 11] as [number, number, number] },
    { name: "Fit del Negocio", value: proposal.diagnostic.breakdown.fitNegocio, color: COLORS.secondary },
    { name: "Señales de Compra", value: proposal.diagnostic.breakdown.senalesCompra, color: COLORS.success },
    { name: "Proximidad", value: proposal.diagnostic.breakdown.proximidad, color: [139, 92, 246] as [number, number, number] },
  ];
  for (const dim of dims) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.textSecondary);
    doc.text(`${dim.name}: ${dim.value}/100`, margin, y);
    // Bar
    const barX = margin + 140;
    const barW = contentWidth - 140;
    doc.setFillColor(...COLORS.border);
    doc.rect(barX, y - 8, barW, 7, "F");
    doc.setFillColor(...dim.color);
    doc.rect(barX, y - 8, barW * (dim.value / 100), 7, "F");
    y += 16;
  }
  y += 8;

  // Pain points
  if (proposal.diagnostic.painPoints.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text("Puntos de dolor identificados:", margin, y);
    y += 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.textSecondary);
    for (const p of proposal.diagnostic.painPoints) {
      if (y > pageHeight - 60) { doc.addPage(); y = margin; }
      const lines = doc.splitTextToSize(`• ${p}`, contentWidth - 10);
      doc.text(lines, margin + 8, y);
      y += lines.length * 13 + 2;
    }
    y += 12;
  }

  // ===== SERVICES (ONLY ACTIVE / SELECTED SERVICES) =====
  const activeServices = proposal.services.filter((s) => s.isSelected !== false);
  
  if (y > pageHeight - 160) { doc.addPage(); y = margin; }
  drawSectionHeader(doc, `Servicios AI Incluidos (${activeServices.length})`, margin, y);
  y += 24;

  for (let i = 0; i < activeServices.length; i++) {
    const svc = activeServices[i];
    const pitchText = svc.pitch || svc.description || "";
    const pitchLines = doc.splitTextToSize(pitchText, contentWidth - 24);
    const visibleLines = pitchLines.slice(0, 3);
    const cardHeight = Math.max(78, 44 + visibleLines.length * 13 + 22);

    if (y + cardHeight > pageHeight - 60) {
      doc.addPage();
      y = margin;
    }

    // Service Card Container
    doc.setFillColor(...COLORS.cardBg);
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 4, 4, "FD");

    // Service Header line
    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${i + 1}. ${svc.name}`, margin + 12, y + 18);

    doc.setFontSize(9);
    doc.setTextColor(...COLORS.secondary);
    doc.setFont("helvetica", "bold");
    doc.text(`Tier ${svc.tier} · Match: ${svc.relevance}%`, pageWidth - margin - 12, y + 18, { align: "right" });

    // Pitch / Description
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.textSecondary);
    doc.text(visibleLines, margin + 12, y + 34);

    // Pricing footer inside card
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.muted);
    const priceLine = `Setup: $${svc.setupPrice.toLocaleString()} USD   ·   Mensual: $${svc.monthlyPrice.toLocaleString()} USD/mes   ·   Anual: $${svc.annualPrice.toLocaleString()} USD`;
    doc.text(priceLine, margin + 12, y + cardHeight - 10);

    y += cardHeight + 14; // Clean space between cards
  }

  // ===== INVESTMENT (SPACING FIXED) =====
  y += 14; // Breathing room before Inversión Total header
  if (y > pageHeight - 170) { doc.addPage(); y = margin; }
  
  drawSectionHeader(doc, "Inversión Total & Retainer", margin, y);
  y += 24;

  // Investment Box
  const invBoxHeight = proposal.investment.discountPercent > 0 ? 98 : 82;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(margin, y, contentWidth, invBoxHeight, 4, 4, "FD");

  let invY = y + 18;
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.primary);
  doc.text("Pago único de Setup (Instalación):", margin + 14, invY);
  doc.setFont("helvetica", "bold");
  doc.text(`$${proposal.investment.totalSetup.toLocaleString()} USD`, margin + 260, invY);
  invY += 18;

  doc.setFont("helvetica", "normal");
  doc.text("Retainer Mensual (MRR):", margin + 14, invY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondary);
  doc.text(`$${proposal.investment.totalMonthly.toLocaleString()} USD / mes`, margin + 260, invY);
  invY += 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.accent);
  doc.text("Inversión Total Año 1:", margin + 14, invY);
  doc.text(`$${proposal.investment.annualTotal.toLocaleString()} USD`, margin + 260, invY);

  if (proposal.investment.discountPercent > 0) {
    invY += 18;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...COLORS.success);
    doc.text(`✓ Incluye ${proposal.investment.discountPercent}% de ahorro por paquete integrado ($${proposal.investment.savingsAmount.toLocaleString()} USD descontados).`, margin + 14, invY);
  }

  y += invBoxHeight + 20;

  // ===== ROI =====
  if (y > pageHeight - 130) { doc.addPage(); y = margin; }
  drawSectionHeader(doc, "Retorno de Inversión Estimado (ROI)", margin, y);
  y += 24;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textSecondary);
  doc.text(`Llamadas y leads capturados:`, margin, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text(proposal.roi.estimatedCallsCaptured, margin + 180, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textSecondary);
  doc.text(`Impacto estimado en facturación:`, margin, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text(proposal.roi.estimatedRevenueImpact, margin + 180, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textSecondary);
  doc.text(`Punto de equilibrio mensual:`, margin, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.success);
  doc.text(`${proposal.roi.clientsNeededToBreakEven} cliente(s) al mes (con ticket promedio de $${proposal.roi.avgTicket} USD)`, margin + 180, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textSecondary);
  doc.text(`Periodo de recuperación (Payback):`, margin, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.success);
  doc.text(proposal.roi.paybackPeriod, margin + 180, y);
  y += 24;

  // ===== NEXT STEPS & SIGNATURE (PASO 3 CONTRATO FORMAL) =====
  if (y > pageHeight - 220) { doc.addPage(); y = margin; }
  drawSectionHeader(doc, "Próximos Pasos & Aceptación del Acuerdo", margin, y);
  y += 22;

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textSecondary);
  for (const step of proposal.nextSteps) {
    if (y > pageHeight - 80) { doc.addPage(); y = margin; }
    const lines = doc.splitTextToSize(step, contentWidth - 10);
    doc.text(lines, margin, y);
    y += lines.length * 13 + 3;
  }
  y += 18;

  // Signature Block
  if (y > pageHeight - 120) { doc.addPage(); y = margin; }
  doc.setDrawColor(...COLORS.border);
  doc.line(margin, y, margin + 220, y);
  doc.line(pageWidth - margin - 220, y, pageWidth - margin, y);
  y += 14;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Por el Cliente (Aceptación):", margin, y);
  doc.text(`Por ${proposal.companyName}:`, pageWidth - margin - 220, y);
  y += 14;

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.muted);
  doc.text(`Nombre: ${proposal.to.businessName}`, margin, y);
  doc.text(`Representante: Dirección Comercial`, pageWidth - margin - 220, y);
  y += 13;
  doc.text("Firma: ___________________________", margin, y);
  doc.text("Firma: ___________________________", pageWidth - margin - 220, y);
  y += 13;
  doc.text("Fecha: ___________________________", margin, y);
  doc.text(`Fecha: ${proposal.proposalDate}`, pageWidth - margin - 220, y);

  // ===== FOOTER (on every page) =====
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor(...COLORS.border);
    doc.line(margin, pageHeight - 35, pageWidth - margin, pageHeight - 35);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      `${proposal.companyName} · ${proposal.footer.contactEmail} · ${proposal.footer.contactPhone}`,
      margin,
      pageHeight - 22
    );
    doc.text(
      `Página ${p} de ${pageCount} · ${proposal.proposalNumber}`,
      pageWidth - margin,
      pageHeight - 22,
      { align: "right" }
    );
  }

  return doc.output("blob");
}
