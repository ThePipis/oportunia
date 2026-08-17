// D:\NEGOCIOIA\slides\slide-05.js
// Catálogo de Servicios AI - Tier 3 (premium / enterprise local)
const pptxgen = require("pptxgenjs");

const slideConfig = {
  type: "content",
  index: 5,
  title: "Servicios AI - Tier 3"
};

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  // Header
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.15, h: 5.625,
    fill: { color: theme.primary }, line: { color: theme.primary, width: 0 }
  });

  // Badge de tier
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 0.3, w: 1.0, h: 0.32,
    fill: { color: theme.primary }, line: { color: theme.primary, width: 0 },
    rectRadius: 0.05
  });
  slide.addText("TIER 3", {
    x: 0.5, y: 0.3, w: 1.0, h: 0.32,
    fontSize: 11, fontFace: "Arial",
    color: theme.bg, bold: true, align: "center", valign: "middle",
    charSpacing: 1
  });

  slide.addText("Premium / Enterprise Local", {
    x: 1.65, y: 0.28, w: 8, h: 0.4,
    fontSize: 26, fontFace: "Arial",
    color: theme.primary, bold: true
  });

  slide.addText("Para clientes más grandes o con operaciones complejas. Tickets de $400+/mes.", {
    x: 0.5, y: 0.7, w: 9, h: 0.3,
    fontSize: 13, fontFace: "Arial",
    color: theme.secondary, italic: true
  });

  const services = [
    {
      row: 0, col: 0,
      icon: "🚚", name: "AI Dispatching & Routing",
      desc: "Optimiza rutas de técnicos, manda ETAs a clientes, reasigna trabajos cuando uno termina antes.",
      example: "HVAC. Técnico termina antes en Corona → IA lo manda a Norco, manda ETA al cliente.",
      pain: "Técnicos manejan 30% más de lo necesario. Clientes esperan más. Margen se va en gasolina.",
      price: "$800 setup + $400/mes"
    },
    {
      row: 0, col: 1,
      icon: "📱", name: "AI Content & Social",
      desc: "Genera 12 posts de Instagram/mes, 2 artículos de blog, 1 update de Google. Dueño aprueba y publica.",
      example: "Dental: 12 posts IG, 2 blogs sobre Invisalign, 1 update de Google. Listo para el mes.",
      pain: "No tienen tiempo para marketing. Sus redes se oxidan, pierden visibilidad.",
      price: "$300 setup + $200/mes"
    },
    {
      row: 1, col: 0,
      icon: "✓", name: "AI Voice Confirmations",
      desc: "IA llama 24h antes para confirmar citas. Si no contesta, manda SMS. Reagenda automáticamente.",
      example: "Dentista. 50 llamadas/día confirmando citas de mañana. No-show baja de 20% a 5%.",
      pain: "20% de no-show cuesta $100+/slot perdido. $2,000/mes en una clínica promedio.",
      price: "$300 setup + $250/mes"
    },
    {
      row: 1, col: 1,
      icon: "📊", name: "AI Ads Optimization",
      desc: "Genera 20 variaciones de anuncios, A/B testea, pausa los de bajo rendimiento, rota los ganadores.",
      example: "HVAC en Google Ads. IA escribe 20 ads, testea, identifica ganador, rota semanalmente.",
      pain: "CPC de $150+ con copy mediocre. La IA lo mejora 2-3x con menos presupuesto.",
      price: "$400 setup + $300/mes"
    }
  ];

  services.forEach(svc => {
    const x = 0.5 + (svc.col * 4.5);
    const y = 1.2 + (svc.row * 2.1);

    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x, y: y, w: 4.3, h: 1.95,
      fill: { color: theme.light },
      line: { color: theme.primary, width: 0.5 },
      rectRadius: 0.08
    });

    slide.addText(svc.icon, {
      x: x + 0.15, y: y + 0.1, w: 0.5, h: 0.5,
      fontSize: 28, fontFace: "Arial", align: "left"
    });

    slide.addText(svc.name, {
      x: x + 0.7, y: y + 0.12, w: 3.5, h: 0.4,
      fontSize: 16, fontFace: "Arial",
      color: theme.primary, bold: true
    });

    slide.addText(svc.desc, {
      x: x + 0.15, y: y + 0.6, w: 4.0, h: 0.6,
      fontSize: 9.5, fontFace: "Arial",
      color: theme.primary
    });

    slide.addText("💡 Ejemplo:", {
      x: x + 0.15, y: y + 1.18, w: 4.0, h: 0.18,
      fontSize: 8, fontFace: "Arial",
      color: theme.primary, bold: true
    });
    slide.addText(svc.example, {
      x: x + 0.15, y: y + 1.34, w: 4.0, h: 0.4,
      fontSize: 8.5, fontFace: "Arial",
      color: theme.secondary, italic: true
    });

    slide.addShape(pres.shapes.RECTANGLE, {
      x: x + 2.9, y: y + 1.62, w: 1.3, h: 0.25,
      fill: { color: theme.primary }, line: { color: theme.primary, width: 0 }
    });
    slide.addText(svc.price, {
      x: x + 2.9, y: y + 1.62, w: 1.3, h: 0.25,
      fontSize: 8.5, fontFace: "Arial",
      color: theme.bg, bold: true, align: "center", valign: "middle"
    });
  });

  // Page number
  slide.addShape(pres.shapes.OVAL, {
    x: 9.3, y: 5.1, w: 0.4, h: 0.4,
    fill: { color: theme.primary }, line: { color: theme.primary, width: 0 }
  });
  slide.addText("5", {
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
  pres.writeFile({ fileName: "slide-05-preview.pptx" });
}

module.exports = { createSlide, slideConfig };
