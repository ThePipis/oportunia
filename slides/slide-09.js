// D:\NEGOCIOIA\slides\slide-09.js
// Principios de Diseño del Nuevo App
const pptxgen = require("pptxgenjs");

const slideConfig = {
  type: "content",
  index: 9,
  title: "Principios de Diseño"
};

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  // Header
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.15, h: 5.625,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 }
  });

  slide.addText("Principios de Diseño del Nuevo App", {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 24, fontFace: "Arial",
    color: theme.primary, bold: true
  });

  slide.addText("Reglas que vamos a seguir para que la app sea intuitiva, explicativa, y no se sienta 'engorrosa'.", {
    x: 0.5, y: 0.78, w: 9, h: 0.3,
    fontSize: 12, fontFace: "Arial",
    color: theme.secondary, italic: true
  });

  // 3x4 grid de principios
  const principles = [
    { icon: "🎯", title: "Un CTA por Pantalla", desc: "Siempre sabes qué hacer después. Sin botones compitiendo." },
    { icon: "📋", title: "Glosario Inline", desc: "Términos técnicos con icono '?' que explica en 1 línea al tocar." },
    { icon: "⚡", title: "Onboarding Guiado", desc: "Primera vez: 3 pasos para entender qué hace. Tooltip tours." },
    { icon: "🔍", title: "Datos Reales", desc: "Cero Math.random. Si no se pudo verificar, mostramos 'pendiente'." },
    { icon: "📊", title: "Charts con Acción", desc: "Cada gráfico tiene insight + botón '¿Qué hago con esto?'." },
    { icon: "💾", title: "Persistencia Total", desc: "Búsquedas, listas, actividad. Recargás y seguís donde quedaste." },
    { icon: "🌗", title: "Light + Dark", desc: "Toggle de tema. Persiste preferencia del usuario." },
    { icon: "📱", title: "Mobile-First Real", desc: "Funciona en la van del vendedor. Bottom nav, swipe, captura en 1 tap." },
    { icon: "🌍", title: "Bilingüe i18n", desc: "Sistema completo en español e inglés. Toggle global." },
    { icon: "🛠️", title: "Tools Manager Primero", desc: "Antes de buscar, configura tus API keys con health-checks." },
    { icon: "🔄", title: "Progressive Disclosure", desc: "Wizard: 1. Qué buscas → 2. Filtros → 3. Resultados → 4. Detalle." },
    { icon: "⚙️", title: "Estados Completos", desc: "Loading con skeleton, empty con CTA, error con retry." }
  ];

  const cardW = 2.95, cardH = 1.1;
  principles.forEach((p, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.5 + (col * 3.12);
    const y = 1.2 + (row * 1.18);

    // Card
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x, y: y, w: cardW, h: cardH,
      fill: { color: theme.bg },
      line: { color: theme.accent, width: 0.75 },
      rectRadius: 0.06
    });

    // Icon
    slide.addText(p.icon, {
      x: x + 0.1, y: y + 0.08, w: 0.45, h: 0.45,
      fontSize: 22, fontFace: "Arial", align: "left"
    });

    // Title
    slide.addText(p.title, {
      x: x + 0.6, y: y + 0.1, w: cardW - 0.7, h: 0.3,
      fontSize: 12, fontFace: "Arial",
      color: theme.primary, bold: true
    });

    // Description
    slide.addText(p.desc, {
      x: x + 0.1, y: y + 0.55, w: cardW - 0.2, h: 0.5,
      fontSize: 9, fontFace: "Arial",
      color: theme.secondary
    });
  });

  // Page number
  slide.addShape(pres.shapes.OVAL, {
    x: 9.3, y: 5.1, w: 0.4, h: 0.4,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 }
  });
  slide.addText("9", {
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
  pres.writeFile({ fileName: "slide-09-preview.pptx" });
}

module.exports = { createSlide, slideConfig };
