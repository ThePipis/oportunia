// D:\NEGOCIOIA\slides\slide-07.js
// Lista de Cuentas a Crear - Tier 1 (signup checklist)
const pptxgen = require("pptxgenjs");

const slideConfig = {
  type: "content",
  index: 7,
  title: "Cuentas Tier 1"
};

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  // Header
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.15, h: 5.625,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 }
  });

  slide.addText("Cuentas a Crear · Tier 1 (MVP)", {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 26, fontFace: "Arial",
    color: theme.primary, bold: true
  });

  slide.addText("Checklist de signups para tener el sistema funcionando. Costo total: ~$16/mes.", {
    x: 0.5, y: 0.78, w: 9, h: 0.3,
    fontSize: 12, fontFace: "Arial",
    color: theme.secondary, italic: true
  });

  // Tabla de cuentas
  const headers = ["Servicio", "Costo", "Free Tier", "Para Qué Lo Usamos"];
  const colWidths = [2.5, 1.3, 2.2, 3.5];
  const startX = 0.5;
  let y = 1.3;

  // Header row
  slide.addShape(pres.shapes.RECTANGLE, {
    x: startX, y: y, w: 9.5, h: 0.4,
    fill: { color: theme.primary }, line: { color: theme.primary, width: 0 }
  });
  let xPos = startX;
  headers.forEach((h, i) => {
    slide.addText(h, {
      x: xPos + 0.1, y: y, w: colWidths[i] - 0.2, h: 0.4,
      fontSize: 11, fontFace: "Arial",
      color: theme.bg, bold: true, valign: "middle"
    });
    xPos += colWidths[i];
  });

  // Data rows
  const accounts = [
    {
      name: "Google Places API (New)",
      cost: "$0 (free tier)",
      free: "5K-10K requests/mes",
      use: "Encontrar negocios locales, ratings, horarios, webs."
    },
    {
      name: "Yelp Fusion",
      cost: "$0 (free)",
      free: "5,000 calls/día",
      use: "Reseñas adicionales, calificaciones, categorías."
    },
    {
      name: "Tavily",
      cost: "$0 (free tier)",
      free: "1,000 searches/mes",
      use: "Búsqueda web + extracción de contenido de sitios."
    },
    {
      name: "Firecrawl",
      cost: "$16/mes",
      free: "500 créditos gratis",
      use: "Leer sitios web de prospectos y extraer señales (chat, booking, 24/7)."
    },
    {
      name: "Brave Search API",
      cost: "$0 (free tier)",
      free: "2,000 queries/mes",
      use: "Búsqueda alternativa a Tavily. Menciona al negocio en otras webs."
    },
    {
      name: "Gemini Pro API",
      cost: "$0 (cuenta Pro)",
      free: "Generoso (4 cuentas)",
      use: "Análisis complejo de muchas reseñas, generación de propuestas, fallback del LLM local."
    }
  ];

  accounts.forEach((acc, i) => {
    const rowY = y + 0.4 + (i * 0.42);
    const bgColor = i % 2 === 0 ? theme.light : theme.bg;

    slide.addShape(pres.shapes.RECTANGLE, {
      x: startX, y: rowY, w: 9.5, h: 0.42,
      fill: { color: bgColor }, line: { color: bgColor, width: 0 }
    });

    xPos = startX;
    const cells = [acc.name, acc.cost, acc.free, acc.use];
    cells.forEach((cell, j) => {
      slide.addText(cell, {
        x: xPos + 0.1, y: rowY, w: colWidths[j] - 0.2, h: 0.42,
        fontSize: 9.5, fontFace: "Arial",
        color: j === 0 ? theme.primary : theme.primary,
        bold: j === 0,
        valign: "middle"
      });
      xPos += colWidths[j];
    });
  });

  // Footer note
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 4.2, w: 9.5, h: 0.85,
    fill: { color: theme.light }, line: { color: theme.accent, width: 1 },
    rectRadius: 0.08
  });
  slide.addText("⚡ Tip de configuración:", {
    x: 0.7, y: 4.25, w: 9.1, h: 0.25,
    fontSize: 11, fontFace: "Arial",
    color: theme.accent, bold: true
  });
  slide.addText("Todas estas cuentas se configuran en una sola pantalla dentro de la app: Tools & Integrations Manager. Ahí añades las API keys, haces health-check, y ves cuánta quota has usado vs el límite gratuito.", {
    x: 0.7, y: 4.5, w: 9.1, h: 0.5,
    fontSize: 10, fontFace: "Arial",
    color: theme.primary
  });

  // Page number
  slide.addShape(pres.shapes.OVAL, {
    x: 9.3, y: 5.1, w: 0.4, h: 0.4,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 }
  });
  slide.addText("7", {
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
  pres.writeFile({ fileName: "slide-07-preview.pptx" });
}

module.exports = { createSlide, slideConfig };
