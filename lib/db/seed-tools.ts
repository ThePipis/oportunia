/**
 * Seed script: inserta las 6 tools Tier 1 como plantillas preconfiguradas.
 * Idempotente: si ya existen, no las duplica.
 *
 * Uso: npm run db:seed-tools
 */

import { listTools, createTool } from "./repositories/tools";

const TOOL_TEMPLATES = [
  {
    type: "api_key" as const,
    name: "google-places",
    display_name: "Google Places API (New)",
    description:
      "Encuentra negocios locales. Nombre, dirección, teléfono, rating, reseñas, horarios, sitio web. $200/mes gratis POR PROYECTO GCP. Soporta múltiples proyectos con auto-fallback.",
    icon: "🗺️",
    docs_url: "https://console.cloud.google.com/",
    sort_order: 10,
    quota_limit: 10000,
    quota_period: "month" as const,
    supports_multiple_keys: 1 as any,
  },
  {
    type: "api_key" as const,
    name: "yelp-fusion",
    display_name: "Yelp Fusion",
    description:
      "Reseñas reales, calificaciones, categorías de negocio. 5,000 calls/día gratis POR APP. Soporta múltiples apps con auto-fallback.",
    icon: "⭐",
    docs_url: "https://www.yelp.com/developers/v3/manage_app",
    sort_order: 20,
    quota_limit: 5000,
    quota_period: "day" as const,
    supports_multiple_keys: 1 as any,
  },
  {
    type: "api_key" as const,
    name: "tavily",
    display_name: "Tavily Search",
    description:
      "Búsqueda web + extracción de contenido. 1,000 searches/mes gratis POR CUENTA. Soporta multi-cuenta con auto-fallback.",
    icon: "🔍",
    docs_url: "https://tavily.com/",
    sort_order: 30,
    quota_limit: 1000,
    quota_period: "month" as const,
    supports_multiple_keys: 1 as any,
  },
  {
    type: "api_key" as const,
    name: "firecrawl",
    display_name: "Firecrawl",
    description:
      "Crawling de sitios web de prospectos. 500 créditos gratis POR CUENTA, luego $16/mo Hobby. Multi-cuenta con auto-fallback.",
    icon: "🕷️",
    docs_url: "https://firecrawl.dev",
    sort_order: 40,
    quota_limit: 500,
    quota_period: "month" as const,
    supports_multiple_keys: 1 as any,
  },
  {
    type: "api_key" as const,
    name: "brave-search",
    display_name: "Brave Search",
    description:
      "Búsqueda web alternativa con privacidad. 2,000 queries/mes gratis POR SUBSCRIPCIÓN. Multi-sub con auto-fallback.",
    icon: "🦁",
    docs_url: "https://brave.com/search/api/",
    sort_order: 50,
    quota_limit: 2000,
    quota_period: "month" as const,
    supports_multiple_keys: 1 as any,
  },
  {
    type: "llm_endpoint" as const,
    name: "gemini-pro",
    display_name: "Google Gemini Pro",
    description:
      "LLM cloud para análisis complejos. Soporta múltiples cuentas Pro con auto-fallback cuando una se queda sin cuota.",
    icon: "✨",
    docs_url: "https://aistudio.google.com/apikey",
    sort_order: 60,
    supports_multiple_keys: 1 as any,
  },
];

function main() {
  console.log("🌱 Seeding Tier 1 tool templates...\n");

  const existing = listTools();
  const existingNames = new Set(existing.map((t) => t.name));
  let created = 0;
  let skipped = 0;

  for (const template of TOOL_TEMPLATES) {
    if (existingNames.has(template.name)) {
      console.log(`   ⏭️  ${template.display_name} (ya existe)`);
      skipped++;
      continue;
    }
    createTool(template);
    console.log(`   ✅ ${template.display_name}`);
    created++;
  }

  console.log(`\n📊 Resumen: ${created} creadas, ${skipped} ya existían`);
  return { created, skipped };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("seed-tools.ts")) {
  main();
}

export { main as seedTools };
