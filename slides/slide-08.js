// D:\NEGOCIOIA\slides\slide-08.js
// Cuentas Opcionales - Tier 2 (cuando escales)
const pptxgen = require("pptxgenjs");

const slideConfig = {
  type: "content",
  index: 8,
  title: "Cuentas Tier 2"
};

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  // Header
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.15, h: 5.625,
    fill: { color: theme.secondary }, line: { color: theme.secondary, width: 0 }
  });

  slide.addText("Cuentas Opcionales · Tier 2 (Cuando Escales)", {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 24, fontFace: "Arial",
    color: theme.primary, bold: true
  });

  slide.addText("Servicios a añadir cuando ya tengas revenue entrando. Costo total Tier 2: $200-500/mes.", {
    x: 0.5, y: 0.78, w: 9, h: 0.3,
    fontSize: 12, fontFace: "Arial",
    color: theme.secondary, italic: true
  });

  // 3x3 grid de cuentas Tier 2
  const accounts = [
    {
      name: "Apollo.io",
      cost: "$49/user/mo",
      use: "Encontrar el email y nombre del dueño del negocio, no solo el nombre del negocio.",
      when: "Cuando necesites contactar al decision maker directamente."
    },
    {
      name: "Hunter.io",
      cost: "$49/mo",
      use: "Email de cualquier dominio. Alternativa más barata a Apollo si solo necesitas emails.",
      when: "Cuando Apollo te quede grande o solo necesites emails."
    },
    {
      name: "Apify Pro",
      cost: "$39/mo",
      use: "Google Maps scraping alternativo (backup si Google Places te limita).",
      when: "Cuando hagas +50 búsquedas/día y Google te rate-limite."
    },
    {
      name: "Vercel Pro",
      cost: "$20/mo",
      use: "Hosting del app en la nube (cuando dejes de correrlo solo en tu máquina).",
      when: "Cuando quieras que tu vendedor acceda desde cualquier lado, no solo localhost."
    },
    {
      name: "Supabase Pro",
      cost: "$25/mo",
      use: "Base de datos PostgreSQL multi-tenant con autenticación.",
      when: "Cuando monetices y tengas múltiples clientes con cuentas separadas."
    },
    {
      name: "Resend",
      cost: "$0-20/mo",
      use: "Envío de propuestas y emails transaccionales desde la app.",
      when: "Cuando quieras enviar 100+ propuestas por mes automáticamente."
    },
    {
      name: "Stripe",
      cost: "2.9% + 30¢/tx",
      use: "Cobros recurrentes automáticos a tus clientes de AI services.",
      when: "Cuando vendas como SaaS y necesites cobrar suscripciones mensuales."
    },
    {
      name: "Upstash Redis",
      cost: "$0-10/mo",
      use: "Cachear respuestas de Google Places/Firecrawl para ahorrar costos de API.",
      when: "Cuando empieces a hacer +1000 requests/día y los costos de API suban."
    },
    {
      name: "Claude API",
      cost: "$15+/mo",
      use: "LLM premium para análisis muy complejos (alternativa a Gemini en tier premium).",
      when: "Cuando ofrezcas un 'tier premium' de análisis a tus clientes más caros."
    }
  ];

  const cardW = 3.0, cardH = 1.18;
  accounts.forEach((acc, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.5 + (col * 3.17);
    const y = 1.25 + (row * 1.25);

    // Card
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x, y: y, w: cardW, h: cardH,
      fill: { color: theme.light },
      line: { color: theme.secondary, width: 0.5 },
      rectRadius: 0.06
    });

    // Name + cost
    slide.addText(acc.name, {
      x: x + 0.12, y: y + 0.08, w: cardW - 0.24, h: 0.3,
      fontSize: 12, fontFace: "Arial",
      color: theme.primary, bold: true
    });
    slide.addText(acc.cost, {
      x: x + 0.12, y: y + 0.34, w: cardW - 0.24, h: 0.2,
      fontSize: 9.5, fontFace: "Arial",
      color: theme.accent, bold: true
    });

    // Use
    slide.addText(acc.use, {
      x: x + 0.12, y: y + 0.55, w: cardW - 0.24, h: 0.4,
      fontSize: 8.5, fontFace: "Arial",
      color: theme.primary
    });

    // When to add
    slide.addText("▸ " + acc.when, {
      x: x + 0.12, y: y + 0.94, w: cardW - 0.24, h: 0.2,
      fontSize: 8, fontFace: "Arial",
      color: theme.secondary, italic: true
    });
  });

  // Page number
  slide.addShape(pres.shapes.OVAL, {
    x: 9.3, y: 5.1, w: 0.4, h: 0.4,
    fill: { color: theme.secondary }, line: { color: theme.secondary, width: 0 }
  });
  slide.addText("8", {
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
  pres.writeFile({ fileName: "slide-08-preview.pptx" });
}

module.exports = { createSlide, slideConfig };
