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
      "Encuentra negocios locales. Nombre, dirección, teléfono, rating, reseñas, horarios, sitio web. 5K-10K requests/mes gratis.",
    icon: "🗺️",
    docs_url: "https://console.cloud.google.com/",
    sort_order: 10,
    quota_limit: 10000,
    quota_period: "month" as const,
  },
  {
    type: "api_key" as const,
    name: "yelp-fusion",
    display_name: "Yelp Fusion",
    description:
      "Reseñas reales, calificaciones, categorías de negocio. 5,000 calls/día gratis.",
    icon: "⭐",
    docs_url: "https://www.yelp.com/developers/v3/manage_app",
    sort_order: 20,
    quota_limit: 5000,
    quota_period: "day" as const,
  },
  {
    type: "api_key" as const,
    name: "tavily",
    display_name: "Tavily Search",
    description:
      "Búsqueda web + extracción de contenido. 1,000 searches/mes gratis.",
    icon: "🔍",
    docs_url: "https://tavily.com/",
    sort_order: 30,
    quota_limit: 1000,
    quota_period: "month" as const,
  },
  {
    type: "api_key" as const,
    name: "firecrawl",
    display_name: "Firecrawl",
    description:
      "Crawling de sitios web de prospectos. 500 créditos gratis, luego $16/mo Hobby.",
    icon: "🕷️",
    docs_url: "https://firecrawl.dev",
    sort_order: 40,
    quota_limit: 500,
    quota_period: "month" as const,
  },
  {
    type: "api_key" as const,
    name: "brave-search",
    display_name: "Brave Search",
    description:
      "Búsqueda web alternativa con privacidad. 2,000 queries/mes gratis.",
    icon: "🦁",
    docs_url: "https://brave.com/search/api/",
    sort_order: 50,
    quota_limit: 2000,
    quota_period: "month" as const,
  },
  {
    type: "llm_endpoint" as const,
    name: "gemini-pro",
    display_name: "Google Gemini Pro",
    description:
      "LLM cloud para análisis complejos. Usa una de tus 4 cuentas Pro. Tier premium fallback.",
    icon: "✨",
    docs_url: "https://aistudio.google.com/apikey",
    sort_order: 60,
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
