// D:\NEGOCIOIA\slides\slide-02.js
// Business Summary - Qué / A quién / Cómo ganamos
const pptxgen = require("pptxgenjs");

const slideConfig = {
  type: "content",
  index: 2,
  title: "Resumen del Negocio"
};

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  // Header con título y línea accent
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.15, h: 5.625,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 }
  });

  slide.addText("Resumen del Negocio", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 30, fontFace: "Arial",
    color: theme.primary, bold: true
  });

  slide.addText("Qué vendemos, a quién, y cómo ganamos dinero", {
    x: 0.5, y: 0.85, w: 9, h: 0.3,
    fontSize: 14, fontFace: "Arial",
    color: theme.secondary, italic: true
  });

  // 3 columnas: Qué / A quién / Cómo
  const columns = [
    {
      x: 0.5, icon: "◎", iconColor: theme.accent,
      title: "QUÉ VENDEMOS",
      titleColor: theme.primary,
      content: "12 servicios de AI que las PyMEs locales necesitan pero no saben cómo implementar: contestadores IA, captura de leads, agendamiento, gestión de reseñas, marketing automatizado, y más.",
      example: "Paquete típico: AI Receptionist + Speed-to-Lead + Review Booster = $800 setup + $650/mes"
    },
    {
      x: 3.67, icon: "◉", iconColor: theme.secondary,
      title: "A QUIÉN",
      titleColor: theme.primary,
      content: "Dueños de negocios locales en Inland Empire y SoCal: técnicos HVAC, plomeros, dentistas, talleres de detailing, eléctricos, restauranteros.",
      example: "Negocios con ticket promedio >$500 y que reciben llamadas/visitas web que no capturan."
    },
    {
      x: 6.83, icon: "▶", iconColor: theme.accent,
      title: "CÓMO GANAMOS",
      titleColor: theme.primary,
      content: "Diagnóstico gratuito → Propuesta personalizada → Contrato recurrente mensual. Sin necesidad de que el cliente entienda tecnología.",
      example: "Un cliente típico = $7,800/año en revenue. Costo de servirlo ≈ $600/año. Margen 92%."
    }
  ];

  columns.forEach((col, i) => {
    // Card background
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: col.x, y: 1.4, w: 2.84, h: 3.5,
      fill: { color: theme.light },
      line: { color: theme.light, width: 0 },
      rectRadius: 0.12
    });

    // Icon circle
    slide.addShape(pres.shapes.OVAL, {
      x: col.x + 1.17, y: 1.7, w: 0.5, h: 0.5,
      fill: { color: col.iconColor },
      line: { color: col.iconColor, width: 0 }
    });
    slide.addText(col.icon, {
      x: col.x + 1.17, y: 1.7, w: 0.5, h: 0.5,
      fontSize: 18, fontFace: "Arial",
      color: theme.bg, bold: true, align: "center", valign: "middle"
    });

    // Title
    slide.addText(col.title, {
      x: col.x + 0.15, y: 2.35, w: 2.54, h: 0.4,
      fontSize: 14, fontFace: "Arial",
      color: col.titleColor, bold: true, align: "center",
      charSpacing: 1.5
    });

    // Content
    slide.addText(col.content, {
      x: col.x + 0.2, y: 2.85, w: 2.44, h: 1.2,
      fontSize: 11, fontFace: "Arial",
      color: theme.primary, align: "left",
      paraSpaceAfter: 4
    });

    // Example box
    slide.addShape(pres.shapes.RECTANGLE, {
      x: col.x + 0.15, y: 4.15, w: 2.54, h: 0.65,
      fill: { color: theme.bg },
      line: { color: theme.secondary, width: 0.75 }
    });
    slide.addText(col.example, {
      x: col.x + 0.2, y: 4.18, w: 2.44, h: 0.6,
      fontSize: 9, fontFace: "Arial",
      color: theme.secondary, italic: true, align: "left", valign: "middle"
    });
  });

  // Page number badge
  slide.addShape(pres.shapes.OVAL, {
    x: 9.3, y: 5.1, w: 0.4, h: 0.4,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 }
  });
  slide.addText("2", {
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
  pres.writeFile({ fileName: "slide-02-preview.pptx" });
}

module.exports = { createSlide, slideConfig };
