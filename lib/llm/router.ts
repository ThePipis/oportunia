/**
 * LLM Router - decide which LLM to use for a given task.
 *
 * Modes:
 * - "local": force Qwen3.5 4B (llama.cpp)
 * - "gemini": force Gemini Pro (cloud)
 * - "auto":  local for simple tasks, Gemini for complex (heuristic)
 *
 * The user picks the default in Settings; can override per-call.
 */

import { callLocalLLM, type LLMRequest, type LLMResponse } from "./local-client";
import { callGemini } from "./gemini-client";
import { getTool, incrementQuota } from "@/lib/db/repositories/tools";

export type LLMMode = "local" | "gemini" | "auto";

export interface RouteOptions {
  mode?: LLMMode;
  /** Hint about task complexity (0-1). For "auto" mode. */
  complexity?: number;
  /** Whether JSON output is required. May push toward Gemini. */
  requiresJson?: boolean;
  /** If set, overrides whatever is in settings. */
  forceLlm?: "local" | "gemini";
}

/**
 * Heuristic: decide if a task is "complex" enough to need Gemini.
 * - Long context (many messages or long content)
 * - Requires JSON
 * - User explicitly marked it complex
 */
function needsGemini(request: LLMRequest, opts: RouteOptions): boolean {
  if (opts.requiresJson) return true;
  if (opts.complexity !== undefined && opts.complexity > 0.5) return true;

  // Long conversation
  const totalChars = request.messages.reduce(
    (sum, m) => sum + m.content.length,
    0
  );
  if (totalChars > 6000) return true;

  // Complex prompt: multiple system messages, analysis keywords
  const lastUser = request.messages[request.messages.length - 1]?.content ?? "";
  const complexKeywords = [
    "analyze",
    "análisis",
    "compare",
    "comparar",
    "evaluate",
    "evaluar",
    "summarize these",
    "resume",
    "propuesta",
    "executive",
  ];
  if (complexKeywords.some((k) => lastUser.toLowerCase().includes(k))) {
    return true;
  }

  return false;
}

export async function route(
  request: LLMRequest,
  opts: RouteOptions = {}
): Promise<LLMResponse & { usedLlm: "local" | "gemini" }> {
  const mode = opts.mode ?? "auto";
  const force = opts.forceLlm;

  let useGemini: boolean;

  if (force === "local") useGemini = false;
  else if (force === "gemini") useGemini = true;
  else if (mode === "local") useGemini = false;
  else if (mode === "gemini") useGemini = true;
  // auto
  else useGemini = needsGemini(request, opts);

  if (useGemini) {
    const gemini = getTool("gemini-pro");
    if (!gemini?.api_key_encrypted) {
      throw new Error(
        "Gemini Pro no está configurado. Ve a /tools y agrega tu API key."
      );
    }
    incrementQuota("gemini-pro", 1);
    const response = await callGemini(gemini.api_key_encrypted, request);
    return { ...response, usedLlm: "gemini" };
  } else {
    incrementQuota("gemini-pro", 0); // no-op for local
    const response = await callLocalLLM(request);
    return { ...response, usedLlm: "local" };
  }
}

/**
 * Convenience: chat completion with auto routing.
 */
export async function chat(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  opts: RouteOptions = {}
) {
  return route({ messages }, opts);
}
