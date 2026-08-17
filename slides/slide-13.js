// D:\NEGOCIOIA\slides\slide-13.js
// Próximos Pasos - Summary / Closing
const pptxgen = require("pptxgenjs");

const slideConfig = {
  type: "summary",
  index: 13,
  title: "Próximos Pasos"
};

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  // Header
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.15, h: 5.625,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 }
  });

  slide.addText("Próximos Pasos", {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 28, fontFace: "Arial",
    color: theme.primary, bold: true
  });

  slide.addText("De la idea al primer cliente en 4 semanas.", {
    x: 0.5, y: 0.85, w: 9, h: 0.3,
    fontSize: 14, fontFace: "Arial",
    color: theme.secondary, italic: true
  });

  // Timeline vertical
  const steps = [
    {
      week: "Semana 1",
      title: "Crear Cuentas y Configurar",
      tasks: "Signup de Google Places, Yelp, Tavily, Firecrawl, Brave, Gemini Pro. Configurar el Tools Manager. Verificar health-checks. Correr el primer test con un negocio real.",
      color: theme.accent
    },
    {
      week: "Semana 2",
      title: "Construir el MVP",
      tasks: "Implementar las 9 secciones principales con datos reales. Scoring 5D funcional. UI bilingüe ES/EN. Onboarding guiado. Persistencia en SQLite.",
      color: theme.secondary
    },
    {
      week: "Semana 3",
      title: "Validar con Prospectos Reales",
      tasks: "Hacer 5 búsquedas reales en Inland Empire. Revisar scores con tu ojo de vendedor. Ajustar pesos del scoring. Generar 2 propuestas. Cerrar 1 cliente piloto (gratis o descuento).",
      color: theme.accent
    },
    {
      week: "Semana 4",
      title: "Iterar y Escalar",
      tasks: "Incorporar feedback del cliente piloto. Pulir UX. Documentar el pitch. Empezar a prospectar con el radar como tu herramienta principal. Meta: 3 clientes pagos al final del mes 1.",
      color: theme.secondary
    }
  ];

  steps.forEach((step, i) => {
    const y = 1.4 + (i * 0.92);

    // Week badge
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.5, y: y, w: 1.5, h: 0.7,
      fill: { color: step.color }, line: { color: step.color, width: 0 },
      rectRadius: 0.05
    });
    slide.addText(step.week, {
      x: 0.5, y: y, w: 1.5, h: 0.7,
      fontSize: 13, fontFace: "Arial",
      color: theme.bg, bold: true, align: "center", valign: "middle"
    });

    // Title
    slide.addText(step.title, {
      x: 2.2, y: y, w: 7.3, h: 0.3,
      fontSize: 14, fontFace: "Arial",
      color: theme.primary, bold: true
    });

    // Tasks
    slide.addText(step.tasks, {
      x: 2.2, y: y + 0.3, w: 7.3, h: 0.45,
      fontSize: 9.5, fontFace: "Arial",
      color: theme.secondary
    });

    // Connector line (except last)
    if (i < steps.length - 1) {
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 1.2, y: y + 0.7, w: 0.05, h: 0.22,
        fill: { color: theme.light }, line: { color: theme.light, width: 0 }
      });
    }
  });

  // Page number
  slide.addShape(pres.shapes.OVAL, {
    x: 9.3, y: 5.1, w: 0.4, h: 0.4,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 }
  });
  slide.addText("13", {
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
  pres.writeFile({ fileName: "slide-13-preview.pptx" });
}

module.exports = { createSlide, slideConfig };
