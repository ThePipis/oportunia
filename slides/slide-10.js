// D:\NEGOCIOIA\slides\slide-10.js
// Toggle Manual de LLMs - Selección entre modelos
const pptxgen = require("pptxgenjs");

const slideConfig = {
  type: "content",
  index: 10,
  title: "Toggle Manual de LLMs"
};

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  // Header
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.15, h: 5.625,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 }
  });

  slide.addText("Toggle Manual de LLMs", {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 26, fontFace: "Arial",
    color: theme.primary, bold: true
  });

  slide.addText("Tú controlas qué modelo usa cada tarea. El sistema te deja cambiarlo en cada búsqueda.", {
    x: 0.5, y: 0.78, w: 9, h: 0.3,
    fontSize: 12, fontFace: "Arial",
    color: theme.secondary, italic: true
  });

  // 3 columnas de LLMs disponibles
  const models = [
    {
      x: 0.5, color: theme.secondary, badge: "🖥️",
      title: "Local · Qwen3.5 4B",
      cost: "$0 (ya lo tienes)",
      speed: "Rápido (~1-3s por respuesta)",
      quality: "Bueno para tareas simples",
      goodFor: "✓ Scoring de muchos prospectos\n✓ Clasificaciones rápidas\n✓ Resúmenes de 1-3 reseñas\n✓ Generación de pitches cortos",
      notFor: "✗ Análisis profundo de 30+ reseñas\n✗ Propuestas largas",
      whenToUse: "Cuando haces +20 análisis/día y quieres ahorrar tu quota de Gemini."
    },
    {
      x: 3.67, color: theme.accent, badge: "☁️",
      title: "Cloud · Gemini Pro",
      cost: "$0 (con tu cuenta Pro)",
      speed: "Medio (~2-5s por respuesta)",
      quality: "Excelente, mejor razonamiento",
      goodFor: "✓ Análisis de muchas reseñas\n✓ Propuestas personalizadas largas\n✓ Matching complejo de servicios\n✓ Resúmenes ejecutivos",
      notFor: "✗ Si excedes la quota diaria de tu cuenta",
      whenToUse: "Cuando la calidad importa más que la velocidad. Para propuestas finales."
    },
    {
      x: 6.83, color: theme.primary, badge: "🤖",
      title: "Auto · Router Inteligente",
      cost: "Variable según uso",
      speed: "Adapta al modelo elegido",
      quality: "Máxima disponible",
      goodFor: "✓ El sistema decide qué usar\n✓ Empieza local, escala a Gemini si es complejo\n✓ Optimiza costo vs calidad",
      notFor: "✗ No te deja forzar un modelo específico",
      whenToUse: "Cuando no quieres pensar en qué modelo usar. Para uso general."
    }
  ];

  models.forEach(m => {
    // Card
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: m.x, y: 1.2, w: 2.84, h: 3.55,
      fill: { color: theme.light },
      line: { color: m.color, width: 1 },
      rectRadius: 0.08
    });

    // Header band
    slide.addShape(pres.shapes.RECTANGLE, {
      x: m.x, y: 1.2, w: 2.84, h: 0.5,
      fill: { color: m.color }, line: { color: m.color, width: 0 }
    });

    // Icon
    slide.addText(m.badge, {
      x: m.x + 0.1, y: 1.25, w: 0.4, h: 0.4,
      fontSize: 20, fontFace: "Arial", align: "center", valign: "middle"
    });

    // Title
    slide.addText(m.title, {
      x: m.x + 0.55, y: 1.25, w: 2.2, h: 0.4,
      fontSize: 13, fontFace: "Arial",
      color: theme.bg, bold: true, valign: "middle"
    });

    // Cost
    slide.addText("💰 " + m.cost, {
      x: m.x + 0.15, y: 1.78, w: 2.6, h: 0.25,
      fontSize: 10, fontFace: "Arial",
      color: theme.primary, bold: true
    });

    // Speed
    slide.addText("⚡ " + m.speed, {
      x: m.x + 0.15, y: 2.0, w: 2.6, h: 0.22,
      fontSize: 9, fontFace: "Arial",
      color: theme.primary
    });

    // Quality
    slide.addText("🎯 " + m.quality, {
      x: m.x + 0.15, y: 2.2, w: 2.6, h: 0.22,
      fontSize: 9, fontFace: "Arial",
      color: theme.primary
    });

    // Good for
    slide.addText("Bueno para:", {
      x: m.x + 0.15, y: 2.5, w: 2.6, h: 0.2,
      fontSize: 9, fontFace: "Arial",
      color: theme.accent, bold: true
    });
    slide.addText(m.goodFor, {
      x: m.x + 0.15, y: 2.7, w: 2.6, h: 0.9,
      fontSize: 8.5, fontFace: "Arial",
      color: theme.primary
    });

    // Not for
    slide.addText(m.notFor, {
      x: m.x + 0.15, y: 3.6, w: 2.6, h: 0.5,
      fontSize: 8, fontFace: "Arial",
      color: theme.secondary, italic: true
    });

    // When to use
    slide.addShape(pres.shapes.RECTANGLE, {
      x: m.x + 0.15, y: 4.15, w: 2.55, h: 0.55,
      fill: { color: theme.bg }, line: { color: theme.secondary, width: 0.5 }
    });
    slide.addText("▸ " + m.whenToUse, {
      x: m.x + 0.2, y: 4.18, w: 2.45, h: 0.5,
      fontSize: 8, fontFace: "Arial",
      color: theme.primary, italic: true
    });
  });

  // Footer note about UI
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 4.95, w: 8.6, h: 0.55,
    fill: { color: theme.primary }, line: { color: theme.primary, width: 0 },
    rectRadius: 0.05
  });
  slide.addText("🎛️ En la UI: dropdown arriba a la derecha antes de cada búsqueda. El default se guarda en tu perfil.", {
    x: 0.5, y: 4.95, w: 8.6, h: 0.55,
    fontSize: 10, fontFace: "Arial",
    color: theme.bg, align: "center", valign: "middle"
  });

  // Page number
  slide.addShape(pres.shapes.OVAL, {
    x: 9.3, y: 5.1, w: 0.4, h: 0.4,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 }
  });
  slide.addText("10", {
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
  pres.writeFile({ fileName: "slide-10-preview.pptx" });
}

module.exports = { createSlide, slideConfig };
