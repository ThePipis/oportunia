// D:\NEGOCIOIA\slides\slide-01.js
// Cover slide
const pptxgen = require("pptxgenjs");

const slideConfig = {
  type: "cover",
  index: 1,
  title: "AI Sales Radar"
};

function createSlide(pres, theme) {
  const slide = pres.addSlide();

  // Fondo con gradiente oscuro
  slide.background = { color: theme.primary };

  // Banda diagonal naranja decorativa (esquina superior derecha)
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 7.5, y: 0, w: 2.5, h: 0.15,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 }
  });

  // Banda azul decorativa (esquina inferior izquierda)
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.45, w: 2.5, h: 0.15,
    fill: { color: theme.secondary }, line: { color: theme.secondary, width: 0 }
  });

  // Logo ficticio (círculo grande con icono radar)
  slide.addShape(pres.shapes.OVAL, {
    x: 4.25, y: 0.7, w: 1.5, h: 1.5,
    fill: { color: theme.accent }, line: { color: theme.bg, width: 3 }
  });
  slide.addText("◎", {
    x: 4.25, y: 0.7, w: 1.5, h: 1.5,
    fontSize: 60, fontFace: "Arial",
    color: theme.bg, bold: true, align: "center", valign: "middle"
  });

  // Título principal
  slide.addText("AI Sales Radar", {
    x: 0.5, y: 2.4, w: 9, h: 1,
    fontSize: 54, fontFace: "Arial",
    color: theme.bg, bold: true, align: "center",
    charSpacing: 2
  });

  // Subtítulo
  slide.addText("Kit completo para vender servicios de AI a negocios locales", {
    x: 0.5, y: 3.4, w: 9, h: 0.5,
    fontSize: 20, fontFace: "Arial",
    color: theme.light, align: "center"
  });

  // Tagline
  slide.addText("De prospecto a cliente, en una sola herramienta", {
    x: 0.5, y: 3.95, w: 9, h: 0.4,
    fontSize: 14, fontFace: "Arial",
    color: theme.secondary, italic: true, align: "center"
  });

  // Footer info
  slide.addText("Plan de Implementación · v1.0 · Agosto 2026", {
    x: 0.5, y: 5.0, w: 9, h: 0.3,
    fontSize: 11, fontFace: "Arial",
    color: theme.secondary, align: "center"
  });

  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  createSlide(pres, { primary: "0F172A", secondary: "0EA5E9", accent: "F97316", light: "E0F2FE", bg: "FFFFFF" });
  pres.writeFile({ fileName: "slide-01-preview.pptx" });
}

module.exports = { createSlide, slideConfig };
