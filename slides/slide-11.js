// D:\NEGOCIOIA\slides\slide-11.js
// Bilingüe i18n - ES/EN toggle
const pptxgen = require("pptxgenjs");

const slideConfig = {
  type: "content",
  index: 11,
  title: "Bilingüe i18n"
};

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  // Header
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.15, h: 5.625,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 }
  });

  slide.addText("Sistema 100% Bilingüe · ES / EN", {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 26, fontFace: "Arial",
    color: theme.primary, bold: true
  });

  slide.addText("Todo el sistema traducido. Toggle global. El default es español. Persiste la preferencia.", {
    x: 0.5, y: 0.78, w: 9, h: 0.3,
    fontSize: 12, fontFace: "Arial",
    color: theme.secondary, italic: true
  });

  // Toggle visual en el centro
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 3.7, y: 1.25, w: 2.6, h: 0.55,
    fill: { color: theme.light }, line: { color: theme.secondary, width: 1 },
    rectRadius: 0.27
  });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 3.8, y: 1.32, w: 1.25, h: 0.41,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 },
    rectRadius: 0.2
  });
  slide.addText("ES", {
    x: 3.8, y: 1.32, w: 1.25, h: 0.41,
    fontSize: 12, fontFace: "Arial",
    color: theme.bg, bold: true, align: "center", valign: "middle"
  });
  slide.addText("EN", {
    x: 5.05, y: 1.32, w: 1.25, h: 0.41,
    fontSize: 12, fontFace: "Arial",
    color: theme.primary, bold: true, align: "center", valign: "middle"
  });

  // Side-by-side mockups (ES vs EN)
  const mockupY = 2.05;
  const mockupH = 2.5;

  // ES Mockup
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: mockupY, w: 4.5, h: mockupH,
    fill: { color: theme.light }, line: { color: theme.secondary, width: 0.5 },
    rectRadius: 0.08
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: mockupY, w: 4.5, h: 0.4,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 }
  });
  slide.addText("🇪🇸 ESPAÑOL (default)", {
    x: 0.5, y: mockupY, w: 4.5, h: 0.4,
    fontSize: 11, fontFace: "Arial",
    color: theme.bg, bold: true, align: "center", valign: "middle"
  });
  const esText = [
    "📍 Ciudad base: Eastvale, CA",
    "🛠️ Selecciona nicho de alto ticket",
    "🎯 Oportunidad de venta: 87/100",
    "💸 Dinero que pierdes al mes: ~$2,800",
    "📋 Servicios recomendados:",
    "   • AI Receptionist 24/7",
    "   • Speed-to-Lead",
    "🚀 Generar Propuesta"
  ];
  esText.forEach((t, i) => {
    slide.addText(t, {
      x: 0.7, y: mockupY + 0.5 + (i * 0.26), w: 4.1, h: 0.24,
      fontSize: 10, fontFace: "Arial",
      color: theme.primary
    });
  });

  // EN Mockup
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.0, y: mockupY, w: 4.5, h: mockupH,
    fill: { color: theme.light }, line: { color: theme.secondary, width: 0.5 },
    rectRadius: 0.08
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.0, y: mockupY, w: 4.5, h: 0.4,
    fill: { color: theme.secondary }, line: { color: theme.secondary, width: 0 }
  });
  slide.addText("🇺🇸 ENGLISH", {
    x: 5.0, y: mockupY, w: 4.5, h: 0.4,
    fontSize: 11, fontFace: "Arial",
    color: theme.bg, bold: true, align: "center", valign: "middle"
  });
  const enText = [
    "📍 Base city: Eastvale, CA",
    "🛠️ Select your high-ticket niche",
    "🎯 Sales opportunity: 87/100",
    "💸 Money you're losing monthly: ~$2,800",
    "📋 Recommended services:",
    "   • 24/7 AI Receptionist",
    "   • Speed-to-Lead",
    "🚀 Generate Proposal"
  ];
  enText.forEach((t, i) => {
    slide.addText(t, {
      x: 5.2, y: mockupY + 0.5 + (i * 0.26), w: 4.1, h: 0.24,
      fontSize: 10, fontFace: "Arial",
      color: theme.primary
    });
  });

  // Footer note
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 4.75, w: 9.0, h: 0.55,
    fill: { color: theme.primary }, line: { color: theme.primary, width: 0 },
    rectRadius: 0.05
  });
  slide.addText("📁 Implementación: archivos es.json + en.json cargan al inicio. Cada texto en la UI se referencia por key. Nunca hard-coded strings.", {
    x: 0.5, y: 4.75, w: 9.0, h: 0.55,
    fontSize: 10, fontFace: "Arial",
    color: theme.bg, align: "center", valign: "middle"
  });

  // Page number
  slide.addShape(pres.shapes.OVAL, {
    x: 9.3, y: 5.1, w: 0.4, h: 0.4,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 }
  });
  slide.addText("11", {
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
  pres.writeFile({ fileName: "slide-11-preview.pptx" });
}

module.exports = { createSlide, slideConfig };
