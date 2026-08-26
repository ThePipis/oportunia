/**
 * AI Synthesis Engine for Service Recommendations & Pitches.
 *
 * Uses the active LLM (Llama.cpp on GPU or Gemini Pro) to evaluate the 5D Score,
 * industry sector, and digital signals, producing 100% contextual service
 * recommendations with tailored sales pitches.
 */

import { route } from "@/lib/llm/router";
import type { MatchedService, MatchInput } from "./service-matcher";
import { getDb } from "@/lib/db/client";

interface ServiceRow {
  id: string;
  name: string;
  name_en: string;
  tier: number;
  icon: string | null;
  price_setup: number;
  price_monthly: number;
}

export async function synthesizeRecommendationsWithAI(
  business: {
    id: string;
    name: string;
    primary_type?: string | null;
    sector_id?: string | null;
    google_rating?: number | null;
    review_count?: number | null;
    website?: string | null;
  },
  input: MatchInput,
  heuristicMatches: MatchedService[]
): Promise<MatchedService[]> {
  try {
    const db = getDb();
    const catalog = db
      .prepare(`SELECT id, name, name_en, tier, icon, price_setup, price_monthly FROM service_catalog WHERE active = 1`)
      .all() as ServiceRow[];

    const catalogMap = new Map(catalog.map((s) => [s.id, s]));

    const systemPrompt = `Eres el Agente Estratega Senior de una Agencia de Automatización e IA B2B en California (Inland Empire).
Tu trabajo es analizar un negocio local y seleccionar los 3 mejores servicios de IA de nuestro catálogo para venderle en una propuesta ejecutiva.

REGLAS CRÍTICAS:
1. Contexto de Industria Estricto: Si el negocio es gastronomía/cafetería/panadería, NO ofrezcas llamadas outbound en frío; ofrece Review Booster, Reputation Manager, WhatsApp Ordering o Web con Menú Digital. Si es HVAC/Plomería/Techos, ofrece AI Receptionist 24/7, Speed-to-Lead o Appointment Setter.
2. Cada servicio debe tener un 'pitch' persuasivo y directo en español y en inglés ('pitchEn') mencionando datos reales del cliente (ej. sus reseñas, su web, etc.).
3. Responde ÚNICAMENTE en formato JSON con la clave "services" conteniendo un array de hasta 3 objetos.`;

    const userPrompt = `NEGOCIO A ANALIZAR:
- Nombre: "${business.name}"
- Sector/Tipo: "${business.primary_type || business.sector_id || "Comercio Local"}"
- Google Rating: ${business.google_rating ?? "Sin rating"}★ (${business.review_count ?? 0} reseñas)
- Sitio Web: ${business.website || "No tiene / Caído"}
- Diagnóstico 5D:
  * Brecha Digital: ${input.brechaDigital}/100
  * Gap Operativo: ${input.gapOperativo}/100
  * Fit del Negocio: ${input.fitNegocio}/100
  * Señales de Compra: ${input.senalesCompra}/100
  * Proximidad: ${input.proximidad}/100
- Señales Clave Adicionales:
  * Publicidad / Píxeles: ${input.hasActiveAds ? "Invierte en Ads (Píxeles detectados)" : "Sin anuncios detectados"}
  * Redes Sociales: ${input.hasSocial ? "Presentes en Instagram/Facebook" : "Sin redes visibles"}
  * Años Operando: ${input.yearsInBusiness ? input.yearsInBusiness + "+ años" : "Negocio establecido"}

CATÁLOGO DISPONIBLE:
${catalog.map((c) => `- ${c.id}: ${c.name} (Tier ${c.tier}, Setup $${c.price_setup}, MRR $${c.price_monthly}/mo)`).join("\n")}

Genera el JSON con los 3 servicios seleccionados:
{
  "services": [
    {
      "serviceId": "id_del_catalogo",
      "relevance": 35,
      "reasoning": "Razón ejecutiva breve",
      "pitch": "Pitch persuasivo en español mencionando datos del negocio",
      "pitchEn": "Persuasive pitch in English"
    }
  ]
}`;

    const response = await route(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      },
      {
        complexity: 0.6,
        requiresJson: true,
      }
    );

    const rawContent = response.content.trim();
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`No valid JSON object found in response: ${rawContent.slice(0, 100)}`);
    }
    const parsed = JSON.parse(jsonMatch[0]);
    const services = Array.isArray(parsed.services) ? parsed.services : [];

    if (services.length > 0) {
      const synthesized: MatchedService[] = [];
      for (const item of services) {
        const cat = catalogMap.get(item.serviceId);
        if (cat) {
          synthesized.push({
            serviceId: cat.id,
            serviceName: cat.name,
            serviceIcon: cat.icon ?? "⭐",
            serviceTier: cat.tier,
            relevance: Math.min(100, Math.max(20, item.relevance ?? 30)),
            reasoning: item.reasoning || "Recomendado por diagnóstico IA",
            pitch: item.pitch || "Solución automatizada con IA para aumentar clientes y retención.",
            pitchEn: item.pitchEn || "Automated AI solution to increase revenue and customer retention.",
            priceSetup: cat.price_setup,
            priceMonthly: cat.price_monthly,
          });
        }
      }

      if (synthesized.length > 0) {
        return synthesized.slice(0, 3);
      }
    }
  } catch (err: any) {
    console.warn(`[synthesis] AI recommendation synthesis fallback: ${err.message}`);
  }

  // Graceful fallback to heuristic matches
  return heuristicMatches;
}
