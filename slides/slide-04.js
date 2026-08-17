// D:\NEGOCIOIA\slides\slide-04.js
// Catálogo de Servicios AI - Tier 2 (alto impacto, ciclo de venta más largo)
const pptxgen = require("pptxgenjs");

const slideConfig = {
  type: "content",
  index: 4,
  title: "Servicios AI - Tier 2"
};

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  // Header
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.15, h: 5.625,
    fill: { color: theme.secondary }, line: { color: theme.secondary, width: 0 }
  });

  // Badge de tier
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 0.3, w: 1.0, h: 0.32,
    fill: { color: theme.secondary }, line: { color: theme.secondary, width: 0 },
    rectRadius: 0.05
  });
  slide.addText("TIER 2", {
    x: 0.5, y: 0.3, w: 1.0, h: 0.32,
    fontSize: 11, fontFace: "Arial",
    color: theme.bg, bold: true, align: "center", valign: "middle",
    charSpacing: 1
  });

  slide.addText("Alto Impacto, Cierre Más Largo", {
    x: 1.65, y: 0.28, w: 8, h: 0.4,
    fontSize: 26, fontFace: "Arial",
    color: theme.primary, bold: true
  });

  slide.addText("Servicios para clientes que ya tienen Tier 1 y quieren escalar. Tickets más altos.", {
    x: 0.5, y: 0.7, w: 9, h: 0.3,
    fontSize: 13, fontFace: "Arial",
    color: theme.secondary, italic: true
  });

  const services = [
    {
      row: 0, col: 0,
      icon: "💬", name: "AI Reputation Manager",
      desc: "Monitorea Google, Yelp y Facebook. Redacta respuestas a reseñas, alerta al dueño si hay una negativa.",
      example: "Restaurante recibe 1 estrella a las 8 PM → IA propone respuesta empática, dueño aprueba con 1 clic.",
      pain: "60% de negocios no responden reseñas, perdiendo confianza del cliente.",
      price: "$200 setup + $150/mes"
    },
    {
      row: 0, col: 1,
      icon: "📞", name: "AI Outbound Reactivator",
      desc: "IA llama a clientes viejos para ofrecer mantenimiento estacional o reactivación de cuenta.",
      example: "HVAC. IA llama 200 clientes de 2024: 'Hola, soy María, ¿agendamos su tune-up gratis de AC?'",
      pain: "$50,000+ de revenue atrapado en base inactiva. Nadie lo trabaja.",
      price: "$250 setup + $300/mes"
    },
    {
      row: 1, col: 0,
      icon: "🔄", name: "AI Follow-Up & Nurture",
      desc: "Secuencia automática de 5-7 contactos por 14 días al lead que no agendó. SMS, email, llamada.",
      example: "Lead de solar. Día 1 SMS, Día 3 email, Día 7 SMS, Día 14 llamada. Convierte 3x más.",
      pain: "80% de leads calificados se enfrían en 7 días sin seguimiento. Se van con la competencia.",
      price: "$200 setup + $150/mes"
    },
    {
      row: 1, col: 1,
      icon: "💻", name: "AI Web Chat 24/7",
      desc: "Chat conversacional en el sitio que responde dudas, califica, y transfiere a humano si es complejo.",
      example: "Plomería web. Visitante pregunta '¿Cuánto cuesta instalar water heater?' → IA da rango, agenda.",
      pain: "Solo 2-3% de visitantes web convierten a lead. El resto se va sin contacto.",
      price: "$300 setup + $150/mes"
    }
  ];

  services.forEach(svc => {
    const x = 0.5 + (svc.col * 4.5);
    const y = 1.2 + (svc.row * 2.1);

    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x, y: y, w: 4.3, h: 1.95,
      fill: { color: theme.light },
      line: { color: theme.secondary, width: 0.5 },
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
      color: theme.secondary, bold: true
    });
    slide.addText(svc.example, {
      x: x + 0.15, y: y + 1.34, w: 4.0, h: 0.4,
      fontSize: 8.5, fontFace: "Arial",
      color: theme.secondary, italic: true
    });

    slide.addShape(pres.shapes.RECTANGLE, {
      x: x + 2.9, y: y + 1.62, w: 1.3, h: 0.25,
      fill: { color: theme.secondary }, line: { color: theme.secondary, width: 0 }
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
    fill: { color: theme.secondary }, line: { color: theme.secondary, width: 0 }
  });
  slide.addText("4", {
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
  pres.writeFile({ fileName: "slide-04-preview.pptx" });
}

module.exports = { createSlide, slideConfig };
