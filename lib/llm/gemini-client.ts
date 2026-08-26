/**
 * Google Gemini Pro client.
 * Uses the Google AI Generative Language API directly.
 */

import type { ChatMessage, LLMResponse, LLMRequest } from "./local-client";

const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.1-pro-preview";

interface GeminiRequest {
  contents: Array<{
    role: "user" | "model";
    parts: Array<{ text: string }>;
  }>;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
  };
  systemInstruction?: {
    parts: Array<{ text: string }>;
  };
}

export async function callGemini(
  apiKey: string,
  request: LLMRequest
): Promise<LLMResponse> {
  const model = request.model ?? DEFAULT_MODEL;
  const start = Date.now();

  // Convert OpenAI-style messages to Gemini format
  const systemMessage = request.messages.find((m) => m.role === "system");
  const conversation = request.messages.filter((m) => m.role !== "system");

  const contents: GeminiRequest["contents"] = [];
  for (let i = 0; i < conversation.length; i++) {
    const msg = conversation[i];
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }

  const body: GeminiRequest = {
    contents,
    generationConfig: {
      temperature: request.temperature ?? 0.7,
      maxOutputTokens: request.max_tokens ?? 2048,
    },
  };
  if (systemMessage) {
    body.systemInstruction = { parts: [{ text: systemMessage.content }] };
  }
  if (request.response_format?.type === "json_object") {
    body.generationConfig!.responseMimeType = "application/json";
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const latencyMs = Date.now() - start;
  const content =
    data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  return {
    content,
    model,
    usage: data.usageMetadata
      ? {
          prompt_tokens: data.usageMetadata.promptTokenCount,
          completion_tokens: data.usageMetadata.candidatesTokenCount,
          total_tokens: data.usageMetadata.totalTokenCount,
        }
      : undefined,
    latencyMs,
  };
}
