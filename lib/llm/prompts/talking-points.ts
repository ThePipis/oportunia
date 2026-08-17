/**
 * Talking Points prompt for LLM.
 *
 * Generates 3-5 persuasive bullets the salesperson can use when talking
 * to the business owner. Based on the business's actual signals + score.
 */

import type { ScoreBreakdown } from "@/lib/scoring/algorithm";
import type { MatchedService } from "@/lib/scoring/service-matcher";

export function buildTalkingPointsPrompt(input: {
  businessName: string;
  businessType: string | null;
  city: string | null;
  state: string | null;
  rating: number | null;
  reviewCount: number | null;
  hasWebsite: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  score: ScoreBreakdown;
  matchedServices: MatchedService[];
  language: "es" | "en";
}): { system: string; user: string } {
  const lang = input.language;
  const system =
    lang === "es"
      ? `Eres un asistente experto en ventas consultivas B2B. Tu trabajo es generar "talking points" — 3 a 5 frases cortas y persuasivas que un vendedor puede usar al hablar con el dueño de un negocio local.

Reglas:
- Cada frase debe ser 1-2 oraciones máximo.
- Tono profesional pero cercano (no corporativo frío).
- Basa cada punto en una brecha o señal real del negocio (no inventes).
- Cada punto debe tener un "porque" concreto: "porque no tiene X" / "porque detectamos Y".
- Termina cada punto con un beneficio cuantificable aproximado: "X recupera $Y/mes" o "X% más conversiones".
- Devuelve SOLO un JSON array con objetos { "point": string, "because": string, "benefit": string }. Sin texto adicional.`
      : `You are an expert B2B consultative sales assistant. Your job is to generate "talking points" — 3 to 5 short, persuasive phrases a salesperson can use when talking to a local business owner.

Rules:
- Each phrase must be 1-2 sentences max.
- Professional but warm tone (not cold corporate).
- Base each point on a real gap or signal from the business (don't invent).
- Each point needs a concrete "because": "because they don't have X" / "because we detected Y".
- End each point with an approximate quantifiable benefit: "recovers $Y/mo" or "X% more conversions".
- Return ONLY a JSON array with objects { "point": string, "because": string, "benefit": string }. No extra text.`;

  const services = input.matchedServices
    .map(
      (s) =>
        `- ${s.serviceName} (relevance: ${s.relevance}%): ${s.reasoning}`
    )
    .join("\n");

  const user = lang === "es" ? `# Negocio

- **Nombre:** ${input.businessName}
- **Tipo:** ${input.businessType ?? "desconocido"}
- **Ubicación:** ${input.city ?? "?"}, ${input.state ?? "?"}
- **Rating Google:** ${input.rating ?? "N/A"} (${input.reviewCount ?? 0} reseñas)
- **Teléfono:** ${input.hasPhone ? "sí" : "no"}
- **Email:** ${input.hasEmail ? "sí" : "no"}
- **Website:** ${input.hasWebsite ? "sí" : "no"}

# Score 5D (0-100)

- **Brecha Digital:** ${input.score.breakdown.brechaDigital}/100
  Razón: ${input.score.reasoning.brechaDigital}
- **Gap Operativo:** ${input.score.breakdown.gapOperativo}/100
  Razón: ${input.score.reasoning.gapOperativo}
- **Fit del Negocio:** ${input.score.breakdown.fitNegocio}/100
  Razón: ${input.score.reasoning.fitNegocio}
- **Señales de Compra:** ${input.score.breakdown.senalesCompra}/100
  Razón: ${input.score.reasoning.senalesCompra}
- **Proximidad:** ${input.score.breakdown.proximidad}/100
  Razón: ${input.score.reasoning.proximidad}

# Servicios AI Recomendados

${services}

# Output esperado

Devuelve SOLO el JSON array con los 3-5 talking points. Ejemplo de formato:
[
  { "point": "...", "because": "...", "benefit": "..." },
  { "point": "...", "because": "...", "benefit": "..." }
]` : `# Business

- **Name:** ${input.businessName}
- **Type:** ${input.businessType ?? "unknown"}
- **Location:** ${input.city ?? "?"}, ${input.state ?? "?"}
- **Google Rating:** ${input.rating ?? "N/A"} (${input.reviewCount ?? 0} reviews)
- **Phone:** ${input.hasPhone ? "yes" : "no"}
- **Email:** ${input.hasEmail ? "yes" : "no"}
- **Website:** ${input.hasWebsite ? "yes" : "no"}

# 5D Score (0-100)

- **Digital Gap:** ${input.score.breakdown.brechaDigital}/100
  Reason: ${input.score.reasoning.brechaDigital}
- **Operational Gap:** ${input.score.breakdown.gapOperativo}/100
  Reason: ${input.score.reasoning.gapOperativo}
- **Business Fit:** ${input.score.breakdown.fitNegocio}/100
  Reason: ${input.score.reasoning.fitNegocio}
- **Buying Signals:** ${input.score.breakdown.senalesCompra}/100
  Reason: ${input.score.reasoning.senalesCompra}
- **Proximity:** ${input.score.breakdown.proximidad}/100
  Reason: ${input.score.reasoning.proximidad}

# Recommended AI Services

${services}

# Expected output

Return ONLY the JSON array with 3-5 talking points. Example format:
[
  { "point": "...", "because": "...", "benefit": "..." },
  { "point": "...", "because": "...", "benefit": "..." }
]`;

  return { system, user };
}

import { z } from "zod";

export const TalkingPointSchema = z.object({
  point: z.string().min(10).max(300),
  because: z.string().min(5).max(200),
  benefit: z.string().min(5).max(200),
});

export const TalkingPointsSchema = z.array(TalkingPointSchema).min(3).max(5);

export type TalkingPoint = z.infer<typeof TalkingPointSchema>;
