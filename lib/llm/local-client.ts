import { getToolByName } from "@/lib/db/repositories/tools";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  latencyMs: number;
}

export interface LLMRequest {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
  endpoint?: string;
  model?: string;
}

const FALLBACK_ENDPOINT = "http://100.119.37.120:11434";

/** Cache the active model name briefly to avoid querying /v1/models on every prompt */
let cachedActiveModel: { name: string; endpoint: string; expiresAt: number } | null = null;

export async function getActiveLlamaModel(endpointUrl: string): Promise<string> {
  const now = Date.now();
  if (
    cachedActiveModel &&
    cachedActiveModel.endpoint === endpointUrl &&
    cachedActiveModel.expiresAt > now
  ) {
    return cachedActiveModel.name;
  }

  try {
    const res = await fetch(`${endpointUrl}/v1/models`, {
      method: "GET",
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      const detected =
        data.models?.[0]?.name ||
        data.models?.[0]?.model ||
        data.data?.[0]?.id;
      if (detected) {
        cachedActiveModel = {
          name: detected,
          endpoint: endpointUrl,
          expiresAt: now + 30000, // cache 30s
        };
        return detected;
      }
    }
  } catch (e: any) {
    console.warn(`[local-client] Failed to detect active llama model: ${e.message}`);
  }

  return "default";
}

export async function callLocalLLM(
  request: LLMRequest
): Promise<LLMResponse> {
  // Resolve endpoint dynamically from DB tool configuration or environment
  let endpoint = request.endpoint;
  if (!endpoint) {
    const tool = getToolByName("llama-local");
    endpoint = tool?.endpoint || process.env.LLM_LOCAL_URL || FALLBACK_ENDPOINT;
  }
  endpoint = endpoint.replace(/\/+$/, "");

  // Auto-detect active model if not explicitly specified
  let model = request.model;
  if (!model || model === "auto" || model === "default") {
    model = await getActiveLlamaModel(endpoint);
  }

  const start = Date.now();

  const body: Record<string, unknown> = {
    model,
    messages: request.messages,
    temperature: request.temperature ?? 0.7,
    max_tokens: request.max_tokens ?? 2048,
  };
  if (request.response_format) {
    body.response_format = request.response_format;
  }

  const res = await fetch(`${endpoint}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `Local LLM HTTP ${res.status}: ${errText.slice(0, 200)}`
    );
  }

  const data = await res.json();
  const latencyMs = Date.now() - start;

  return {
    content: data.choices?.[0]?.message?.content ?? "",
    model: data.model ?? model,
    usage: data.usage,
    latencyMs,
  };
}
