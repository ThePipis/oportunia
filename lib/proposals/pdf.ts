/**
 * PDF generator for proposals.
 * Uses jspdf to create a multi-page PDF from the proposal content.
 */

import { jsPDF } from "jspdf";
import type { ProposalContent } from "./generator";

const COLORS = {
  primary: [15, 23, 42] as [number, number, number],   // slate-900
  secondary: [14, 165, 233] as [number, number, number], // sky-500
  accent: [249, 115, 22] as [number, number, number],  // orange-500
  text: [15, 23, 42] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  success: [16, 185, 129] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

export function generateProposalPDF(proposal: ProposalContent): Blob {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ===== HEADER =====
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 90, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(proposal.companyName, margin, 45);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(proposal.companyTagline, margin, 65);
  doc.setFontSize(9);
  doc.text(`Propuesta: ${proposal.proposalNumber}`, pageWidth - margin, 45, {
    align: "right",
  });
  doc.text(`Fecha: ${proposal.proposalDate}`, pageWidth - margin, 60, {
    align: "right",
  });
  doc.text(`Válida hasta: ${proposal.validUntil}`, pageWidth - margin, 75, {
    align: "right",
  });
  y = 120;

  // ===== TO =====
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("PARA:", margin, y);
  y += 14;
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(14);
  doc.text(proposal.to.businessName, margin, y);
  y += 18;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (proposal.to.address) {
    doc.text(proposal.to.address, margin, y);
    y += 13;
  }
  if (proposal.to.city || proposal.to.state) {
    const cityLine = [proposal.to.city, proposal.to.state]
      .filter(Boolean)
      .join(", ");
    doc.text(cityLine, margin, y);
    y += 13;
  }
  y += 15;

  // ===== EXECUTIVE SUMMARY =====
  drawSectionHeader(doc, "Resumen Ejecutivo", margin, y);
  y += 22;
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const summaryLines = doc.splitTextToSize(proposal.executiveSummary, contentWidth);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 14 + 18;

  // ===== DIAGNOSTIC =====
  if (y > pageHeight - 200) {
    doc.addPage();
    y = margin;
  }
  drawSectionHeader(doc, "Diagnóstico", margin, y);
  y += 22;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Score de Oportunidad: ${proposal.diagnostic.opportunityScore}/100`, margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const tierText: Record<string, string> = {
    hot: "Alto potencial - Recomendado cerrar esta semana",
    warm: "Buen potencial - Lead caliente",
    nurture: "Potencial medio - Nurture 14 días",
    skip: "Potencial bajo - No prioritario",
  };
  doc.text(tierText[proposal.diagnostic.tier] ?? proposal.diagnostic.tier, margin, y);
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
    doc.setTextColor(...COLORS.text);
    doc.text(`${dim.name}: ${dim.value}/100`, margin, y);
    // Bar
    const barX = margin + 150;
    const barW = contentWidth - 150;
    doc.setFillColor(...COLORS.border);
    doc.rect(barX, y - 8, barW, 8, "F");
    doc.setFillColor(...dim.color);
    doc.rect(barX, y - 8, barW * (dim.value / 100), 8, "F");
    y += 18;
  }
  y += 10;

  // Pain points
  if (proposal.diagnostic.painPoints.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.text);
    doc.text("Puntos de dolor identificados:", margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    for (const p of proposal.diagnostic.painPoints) {
      if (y > pageHeight - 60) { doc.addPage(); y = margin; }
      const lines = doc.splitTextToSize(`• ${p}`, contentWidth - 10);
      doc.text(lines, margin + 10, y);
      y += lines.length * 12 + 2;
    }
    y += 10;
  }

  // ===== SERVICES =====
  if (y > pageHeight - 150) { doc.addPage(); y = margin; }
  drawSectionHeader(doc, "Servicios AI Recomendados", margin, y);
  y += 22;
  for (let i = 0; i < proposal.services.length; i++) {
    const svc = proposal.services[i];
    if (y > pageHeight - 120) { doc.addPage(); y = margin; }
    // Service card
    doc.setFillColor(...COLORS.border);
    doc.roundedRect(margin, y, contentWidth, 90, 4, 4, "F");
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`${i + 1}. ${svc.name}`, margin + 10, y + 20);
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.secondary);
    doc.text(`Tier ${svc.tier} · Match: ${svc.relevance}%`, pageWidth - margin - 10, y + 20, { align: "right" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.text);
    const pitchLines = doc.splitTextToSize(svc.pitch, contentWidth - 20);
    doc.text(pitchLines.slice(0, 3), margin + 10, y + 40);
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    doc.text(`Setup: $${svc.setupPrice}  ·  Mensual: $${svc.monthlyPrice}/mo  ·  Anual: $${svc.annualPrice.toLocaleString()}`, margin + 10, y + 80);
    y += 100;
  }

  // ===== INVESTMENT =====
  if (y > pageHeight - 150) { doc.addPage(); y = margin; }
  drawSectionHeader(doc, "Inversión Total", margin, y);
  y += 22;
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  doc.text(`Setup total:  $${proposal.investment.totalSetup.toLocaleString()} USD`, margin, y);
  y += 16;
  doc.text(`Mensual total:  $${proposal.investment.totalMonthly.toLocaleString()} USD/mes`, margin, y);
  y += 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.accent);
  doc.text(`Total año 1:  $${proposal.investment.annualTotal.toLocaleString()} USD`, margin, y);
  y += 22;
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...COLORS.muted);
  const pkgLines = doc.splitTextToSize(proposal.investment.packageVsAlaCarte, contentWidth);
  doc.text(pkgLines, margin, y);
  y += pkgLines.length * 11 + 15;

  // ===== ROI =====
  if (y > pageHeight - 100) { doc.addPage(); y = margin; }
  drawSectionHeader(doc, "ROI Estimado", margin, y);
  y += 22;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.text);
  doc.text(`Llamadas capturadas estimadas: ${proposal.roi.estimatedCallsCaptured}`, margin, y);
  y += 16;
  doc.text(`Impacto en revenue: ${proposal.roi.estimatedRevenueImpact}`, margin, y);
  y += 16;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.success);
  doc.text(`Payback period: ${proposal.roi.paybackPeriod}`, margin, y);
  y += 22;

  // ===== NEXT STEPS =====
  if (y > pageHeight - 100) { doc.addPage(); y = margin; }
  drawSectionHeader(doc, "Próximos Pasos", margin, y);
  y += 22;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.text);
  for (const step of proposal.nextSteps) {
    if (y > pageHeight - 40) { doc.addPage(); y = margin; }
    const lines = doc.splitTextToSize(step, contentWidth - 10);
    doc.text(lines, margin, y);
    y += lines.length * 14 + 4;
  }

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

function drawSectionHeader(
  doc: jsPDF,
  title: string,
  x: number,
  y: number
) {
  doc.setFillColor(...COLORS.secondary);
  doc.rect(x, y - 14, 4, 22, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text);
  doc.text(title, x + 12, y);
}
