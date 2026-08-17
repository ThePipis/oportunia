/**
 * Local LLM client (llama.cpp server, OpenAI-compatible API).
 * Default endpoint: http://srvubuntu01:8080
 */

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

const DEFAULT_ENDPOINT = process.env.LLM_LOCAL_URL ?? "http://srvubuntu01:8080";
const DEFAULT_MODEL = process.env.LLM_LOCAL_MODEL ?? "qwen3.5-4b";

export async function callLocalLLM(
  request: LLMRequest
): Promise<LLMResponse> {
  const endpoint = (request.endpoint ?? DEFAULT_ENDPOINT).replace(/\/+$/, "");
  const model = request.model ?? DEFAULT_MODEL;
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
