// D:\NEGOCIOIA\slides\slide-06.js
// Factores de Scoring del Radar - Lenguaje simple con ejemplos
const pptxgen = require("pptxgenjs");

const slideConfig = {
  type: "content",
  index: 6,
  title: "Factores de Scoring"
};

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  // Header
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.15, h: 5.625,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 }
  });

  slide.addText("Cómo el Radar Califica a Cada Negocio", {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 26, fontFace: "Arial",
    color: theme.primary, bold: true
  });

  slide.addText("5 dimensiones con pesos diferentes. La suma te da un score de 0-100.", {
    x: 0.5, y: 0.78, w: 9, h: 0.3,
    fontSize: 12, fontFace: "Arial",
    color: theme.secondary, italic: true
  });

  // Las 5 dimensiones con barras de peso
  const factors = [
    {
      letter: "A",
      name: "Brecha Digital",
      weight: 25,
      color: theme.accent,
      simple: "¿Qué tan atrasado está en lo digital?",
      example: "Ejemplo: Sin web, sin reseñas recientes, sin chat, sin booking online. = MUY alta brecha. Tiene web moderna, redes activas, responde rápido. = Baja brecha."
    },
    {
      letter: "B",
      name: "Gap Operativo",
      weight: 25,
      color: theme.secondary,
      simple: "¿Puede operar bien solo, o necesita ayuda?",
      example: "Ejemplo: No contesta llamadas 24/7, no responde leads rápido, no tiene sistema de agendamiento. = Gap alto. Tiene todo eso resuelto. = Gap bajo."
    },
    {
      letter: "C",
      name: "Fit del Negocio",
      weight: 25,
      color: theme.accent,
      simple: "¿Tu servicio realmente les sirve?",
      example: "Ejemplo: Plomería/HVAC/dentista con ticket +$500 y atención de emergencia. = Fit alto. Tienda de ropa con ticket bajo. = Fit bajo."
    },
    {
      letter: "D",
      name: "Señales de Compra",
      weight: 15,
      color: theme.secondary,
      simple: "¿Tienen dinero y están listos para invertir?",
      example: "Ejemplo: Múltiples técnicos, anuncios activos, creciendo, sede nueva. = Señales altas. Un solo dueño operando solo, sin marketing. = Señales bajas."
    },
    {
      letter: "E",
      name: "Proximidad",
      weight: 10,
      color: theme.accent,
      simple: "¿Puedes llegar físicamente?",
      example: "Ejemplo: A 3 millas de Eastvale. = Máxima puntuación. A 40+ millas fuera de tu zona. = Puntuación baja. Se calcula desde 7940 Vandewater St."
    }
  ];

  factors.forEach((f, i) => {
    const y = 1.25 + (i * 0.78);

    // Letter circle
    slide.addShape(pres.shapes.OVAL, {
      x: 0.5, y: y, w: 0.55, h: 0.55,
      fill: { color: f.color }, line: { color: f.color, width: 0 }
    });
    slide.addText(f.letter, {
      x: 0.5, y: y, w: 0.55, h: 0.55,
      fontSize: 22, fontFace: "Arial",
      color: theme.bg, bold: true, align: "center", valign: "middle"
    });

    // Name
    slide.addText(f.name, {
      x: 1.2, y: y - 0.02, w: 2.5, h: 0.3,
      fontSize: 14, fontFace: "Arial",
      color: theme.primary, bold: true
    });

    // Weight bar
    const barX = 1.2, barY = y + 0.28, barW = 2.5, barH = 0.12;
    slide.addShape(pres.shapes.RECTANGLE, {
      x: barX, y: barY, w: barW, h: barH,
      fill: { color: theme.light }, line: { color: theme.light, width: 0 }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: barX, y: barY, w: barW * (f.weight / 100 * 4), h: barH,  // 25%=full bar visualizado como referencia
      fill: { color: f.color }, line: { color: f.color, width: 0 }
    });
    slide.addText(`Peso: ${f.weight}%`, {
      x: 1.2, y: y + 0.42, w: 2.5, h: 0.18,
      fontSize: 9, fontFace: "Arial",
      color: theme.secondary, bold: true
    });

    // Plain language question
    slide.addText(f.simple, {
      x: 3.95, y: y - 0.02, w: 5.8, h: 0.25,
      fontSize: 11, fontFace: "Arial",
      color: theme.primary, bold: true, italic: true
    });

    // Example
    slide.addText(f.example, {
      x: 3.95, y: y + 0.25, w: 5.8, h: 0.45,
      fontSize: 9, fontFace: "Arial",
      color: theme.secondary
    });
  });

  // Footer formula
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 5.15, w: 8.6, h: 0.4,
    fill: { color: theme.primary }, line: { color: theme.primary, width: 0 }
  });
  slide.addText("Score Final = (A × 0.25) + (B × 0.25) + (C × 0.25) + (D × 0.15) + (E × 0.10)  ·  Rango 0-100", {
    x: 0.5, y: 5.15, w: 8.6, h: 0.4,
    fontSize: 10, fontFace: "Arial",
    color: theme.bg, bold: true, align: "center", valign: "middle"
  });

  // Page number
  slide.addShape(pres.shapes.OVAL, {
    x: 9.3, y: 5.1, w: 0.4, h: 0.4,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 }
  });
  slide.addText("6", {
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
  pres.writeFile({ fileName: "slide-06-preview.pptx" });
}

module.exports = { createSlide, slideConfig };
