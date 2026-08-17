// D:\NEGOCIOIA\slides\slide-12.js
// Simulación Financiera - Tier 1 (12 meses, escenario conservador)
const pptxgen = require("pptxgenjs");

const slideConfig = {
  type: "content",
  index: 12,
  title: "Simulación Financiera"
};

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  // Header
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.15, h: 5.625,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 }
  });

  slide.addText("Simulación Financiera · Tier 1 (12 meses)", {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 24, fontFace: "Arial",
    color: theme.primary, bold: true
  });

  slide.addText("Escenario conservador: 3 clientes nuevos/mes, paquete promedio $700 setup + $500/mes.", {
    x: 0.5, y: 0.78, w: 9, h: 0.3,
    fontSize: 11, fontFace: "Arial",
    color: theme.secondary, italic: true
  });

  // Chart: MRR growth over 12 months
  const months = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11", "M12"];
  const mrrData = [1500, 3000, 4500, 6000, 7500, 9000, 10500, 12000, 13500, 15000, 16500, 18000];

  slide.addChart(pres.charts.LINE, [
    {
      name: "MRR (Monthly Recurring Revenue)",
      labels: months,
      values: mrrData
    }
  ], {
    x: 0.5, y: 1.25, w: 5.5, h: 3.0,
    chartColors: [theme.accent],
    showLegend: false,
    showTitle: true,
    title: "MRR - Revenue Recurrente Mensual",
    titleFontSize: 12,
    titleColor: theme.primary,
    titleFontFace: "Arial",
    catAxisLabelFontSize: 9,
    valAxisLabelFontSize: 9,
    valAxisLabelColor: theme.secondary,
    catAxisLabelColor: theme.secondary,
    lineDataSymbol: "circle",
    lineDataSymbolSize: 6,
    lineSize: 3,
    valGridLine: { color: theme.light, style: "solid" },
    catGridLine: { color: theme.bg, style: "none" },
    valAxisTitle: "USD/mes",
    showValAxisTitle: true,
    valAxisTitleFontSize: 9,
    valAxisTitleColor: theme.primary
  });

  // Resumen lateral (derecha)
  const statsX = 6.2;
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: statsX, y: 1.25, w: 3.3, h: 3.0,
    fill: { color: theme.light }, line: { color: theme.accent, width: 1 },
    rectRadius: 0.08
  });
  slide.addText("📊 Resumen Año 1", {
    x: statsX + 0.15, y: 1.32, w: 3.0, h: 0.3,
    fontSize: 14, fontFace: "Arial",
    color: theme.primary, bold: true
  });

  const stats = [
    { label: "Clientes al cierre del año", value: "36" },
    { label: "MRR final (mes 12)", value: "$18,000" },
    { label: "ARR (annual run rate)", value: "$216,000" },
    { label: "Revenue total YTD", value: "$133,200" },
    { label: "Costos totales YTD", value: "$14,400" },
    { label: "Utilidad neta YTD", value: "$118,800" },
    { label: "Margen neto", value: "89%" }
  ];

  stats.forEach((s, i) => {
    const sy = 1.7 + (i * 0.34);
    slide.addText(s.label, {
      x: statsX + 0.15, y: sy, w: 1.9, h: 0.3,
      fontSize: 10, fontFace: "Arial",
      color: theme.primary
    });
    slide.addText(s.value, {
      x: statsX + 2.0, y: sy, w: 1.2, h: 0.3,
      fontSize: 11, fontFace: "Arial",
      color: theme.accent, bold: true, align: "right"
    });
  });

  // Footer: supuestos
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 4.4, w: 9.0, h: 1.0,
    fill: { color: theme.primary }, line: { color: theme.primary, width: 0 },
    rectRadius: 0.05
  });
  slide.addText("📋 Supuestos:", {
    x: 0.7, y: 4.45, w: 8.6, h: 0.25,
    fontSize: 10, fontFace: "Arial",
    color: theme.bg, bold: true
  });
  slide.addText("• 3 clientes nuevos/mes (conservador) · Churn 0% primer año · Costo variable $50/cliente/mes (Twilio, LLM) · Costos fijos $36/mes (Firecrawl + misc) · Ingresos por setup + recurring · NO incluye costos de adquisición (CAC) ni horas de tu tiempo de venta", {
    x: 0.7, y: 4.7, w: 8.6, h: 0.65,
    fontSize: 9, fontFace: "Arial",
    color: theme.light
  });

  // Page number
  slide.addShape(pres.shapes.OVAL, {
    x: 9.3, y: 5.1, w: 0.4, h: 0.4,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 }
  });
  slide.addText("12", {
    x: 9.3, y: 5.1, w: 0.4, h: 0.4,
    fontSize: 12, fontFace: "Arial",
    color: theme.bg, bold: true, align: "center", valign: "middle"
  });

  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  createSlide(pres, { primary: "0F172A", secondary: "0EA5E9", accent: "F97316", light: "E0F2FE", bg: "FFFFFF" });
  pres.writeFile({ fileName: "slide-12-preview.pptx" });
}

module.exports = { createSlide, slideConfig };
