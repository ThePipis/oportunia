// D:\NEGOCIOIA\slides\slide-03.js
// Catálogo de Servicios AI - Tier 1 (los 4 más demandados)
const pptxgen = require("pptxgenjs");

const slideConfig = {
  type: "content",
  index: 3,
  title: "Servicios AI - Tier 1"
};

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  // Header
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.15, h: 5.625,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 }
  });

  // Badge de tier
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 0.3, w: 1.0, h: 0.32,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 },
    rectRadius: 0.05
  });
  slide.addText("TIER 1", {
    x: 0.5, y: 0.3, w: 1.0, h: 0.32,
    fontSize: 11, fontFace: "Arial",
    color: theme.bg, bold: true, align: "center", valign: "middle",
    charSpacing: 1
  });

  slide.addText("Servicios de Alta Demanda", {
    x: 1.65, y: 0.28, w: 8, h: 0.4,
    fontSize: 26, fontFace: "Arial",
    color: theme.primary, bold: true
  });

  slide.addText("Los 4 servicios que más vas a cerrar. ROI inmediato, ciclo de venta corto.", {
    x: 0.5, y: 0.7, w: 9, h: 0.3,
    fontSize: 13, fontFace: "Arial",
    color: theme.secondary, italic: true
  });

  // 2x2 grid de servicios Tier 1
  const services = [
    {
      row: 0, col: 0,
      icon: "📞", name: "AI Receptionist 24/7",
      desc: "Contesta llamadas a cualquier hora, en inglés o español. Toma mensajes, agenda citas, transfiere emergencias a un humano.",
      example: "Plomería en Corona. Llamada a las 2 AM por tubería rota → IA agenda visita y avisa al técnico por SMS.",
      pain: "Pierden 30-60% de llamadas fuera de horario. Servicio humano cuesta $3,000-5,000/mes.",
      price: "$400 setup + $300/mes"
    },
    {
      row: 0, col: 1,
      icon: "⚡", name: "Speed-to-Lead",
      desc: "Responde por SMS o WhatsApp a leads del sitio web en menos de 60 segundos. Hace preguntas, califica, agenda.",
      example: "Dentista en Chino Hills. Lead pide consulta de Invisalign a las 11 PM → IA responde en 30s, agenda viernes 3 PM.",
      pain: "78% de los leads los captura el primero que responde. Hoy responden en 4+ horas (o nunca).",
      price: "$250 setup + $200/mes"
    },
    {
      row: 1, col: 0,
      icon: "📅", name: "AI Appointment Setter",
      desc: "Chat en web + WhatsApp que agenda consultas 24/7. Se conecta con Google Calendar o tu sistema actual.",
      example: "Clínica dental. Visitante a las 10 PM → bot hace 4 preguntas, reserva viernes 2 PM sin intervención humana.",
      pain: "40% de visitantes web quieren agendar pero no pueden (la web no tiene booking). Se van a la competencia.",
      price: "$400 setup + $200/mes"
    },
    {
      row: 1, col: 1,
      icon: "⭐", name: "AI Review Booster",
      desc: "Después de cada servicio, manda SMS pidiendo reseña en Google. Si es negativa, la escala al dueño antes de publicar.",
      example: "Técnico HVAC termina trabajo → SMS automático: '¿Cómo le fue? [link Google]' → reseña publicada en 5 min.",
      pain: "80% de clientes felices nunca reseñan. Una sola reseña negativa no respondida puede ahuyentar 30 clientes.",
      price: "$150 setup + $150/mes"
    }
  ];

  services.forEach(svc => {
    const x = 0.5 + (svc.col * 4.5);
    const y = 1.2 + (svc.row * 2.1);

    // Card
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x, y: y, w: 4.3, h: 1.95,
      fill: { color: theme.light },
      line: { color: theme.secondary, width: 0.5 },
      rectRadius: 0.08
    });

    // Icon
    slide.addText(svc.icon, {
      x: x + 0.15, y: y + 0.1, w: 0.5, h: 0.5,
      fontSize: 28, fontFace: "Arial", align: "left"
    });

    // Service name
    slide.addText(svc.name, {
      x: x + 0.7, y: y + 0.12, w: 3.5, h: 0.4,
      fontSize: 16, fontFace: "Arial",
      color: theme.primary, bold: true
    });

    // Description
    slide.addText(svc.desc, {
      x: x + 0.15, y: y + 0.6, w: 4.0, h: 0.6,
      fontSize: 9.5, fontFace: "Arial",
      color: theme.primary
    });

    // Pain box
    slide.addText("💡 Ejemplo:", {
      x: x + 0.15, y: y + 1.18, w: 4.0, h: 0.18,
      fontSize: 8, fontFace: "Arial",
      color: theme.accent, bold: true
    });
    slide.addText(svc.example, {
      x: x + 0.15, y: y + 1.34, w: 4.0, h: 0.4,
      fontSize: 8.5, fontFace: "Arial",
      color: theme.secondary, italic: true
    });

    // Price tag
    slide.addShape(pres.shapes.RECTANGLE, {
      x: x + 2.9, y: y + 1.62, w: 1.3, h: 0.25,
      fill: { color: theme.accent }, line: { color: theme.accent, width: 0 }
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
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 }
  });
  slide.addText("3", {
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
  pres.writeFile({ fileName: "slide-03-preview.pptx" });
}

module.exports = { createSlide, slideConfig };
