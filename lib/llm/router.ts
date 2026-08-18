/**
 * LLM Router - decide which LLM to use for a given task.
 *
 * Modes:
 * - "local": force Qwen3.5 4B (llama.cpp)
 * - "gemini": force Gemini Pro (cloud). Tries all configured accounts
 *   in sort_order, falling back to the next on transient errors
 *   (429 rate limit, 5xx, quota exceeded, network).
 * - "auto":  local for simple tasks, Gemini for complex (heuristic).
 *
 * For tools that support multiple API keys (gemini-pro is the canonical case,
 * but the same code path works for any tool marked supports_multiple_keys=1),
 * the router iterates over active accounts and:
 *   - On 429/RESOURCE_EXHAUSTED: marks account rate_limited with a cooldown,
 *     and immediately tries the next account.
 *   - On 5xx/timeout: same — try next, no penalty.
 *   - On 400 (bad request) or 403 (PERMISSION_DENIED / invalid key): marks
 *     account as 'error' (admin must fix) and tries the next. 400 due to
 *     payload issues is unlikely to differ across accounts so we still try.
 *   - On success: clears any prior error, increments quota.
 *
 * The user picks the default in Settings; can override per-call.
 */

import { callLocalLLM, type LLMRequest, type LLMResponse } from "./local-client";
import { callGemini } from "./gemini-client";
import { getTool, incrementQuota, setToolStatus } from "@/lib/db/repositories/tools";
import {
  listActiveAccounts,
  markAccountUsed,
  markAccountRateLimited,
  markAccountError,
  getAccount,
} from "@/lib/db/repositories/tool-api-keys";

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

const GEMINI_TOOL_NAME = "gemini-pro";
const GEMINI_TOOL_ID_FALLBACK = "gemini-pro"; // seed IDs are name-based slugs
const TRANSIENT_COOLDOWN_SEC = 300; // 5 min
const PERMANENT_COOLDOWN_SEC = 1800; // 30 min for 5xx

/**
 * Heuristic: decide if a task is "complex" enough to need Gemini.
 */
function needsGemini(request: LLMRequest, opts: RouteOptions): boolean {
  if (opts.requiresJson) return true;
  if (opts.complexity !== undefined && opts.complexity > 0.5) return true;

  const totalChars = request.messages.reduce(
    (sum, m) => sum + m.content.length,
    0
  );
  if (totalChars > 6000) return true;

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

/**
 * Find the gemini tool row, supporting both the seed id (gemini-pro) and
 * any custom id the user may have set.
 */
function findGeminiTool() {
  const direct = getTool(GEMINI_TOOL_ID_FALLBACK);
  if (direct) return direct;
  // Fall back to scanning
  const { listTools } = require("@/lib/db/repositories/tools");
  return listTools().find((t: any) => t.name === GEMINI_TOOL_NAME) ?? null;
}

/**
 * Classify a Gemini API error so we know whether to fall back to the next
 * account or fail the whole call.
 *
 * Returns one of:
 *   - "transient"     → network, 5xx, timeout: try next, no penalty
 *   - "rate_limit"    → 429 / RESOURCE_EXHAUSTED: try next, cool down
 *   - "permanent"     → 400 bad request, 401/403 auth: try next BUT mark
 *                       the current account as 'error' (admin must fix)
 *   - "fatal"         → configuration / programmer error: don't try others
 */
export function classifyError(err: unknown): {
  kind: "transient" | "rate_limit" | "permanent" | "fatal";
  message: string;
} {
  const msg = err instanceof Error ? err.message : String(err);
  // Match patterns our gemini-client emits
  //   "Gemini HTTP 429: {...}"
  //   "Gemini HTTP 400: {...}"
  //   "Gemini HTTP 500: ..."
  const statusMatch = msg.match(/HTTP\s+(\d{3})/);
  const status = statusMatch ? parseInt(statusMatch[1], 10) : 0;

  if (status === 429) return { kind: "rate_limit", message: msg };
  if (status === 408 || status === 500 || status === 502 || status === 503 || status === 504) {
    return { kind: "transient", message: msg };
  }
  if (status === 400) {
    // 400 is usually a malformed request — but with multi-account it can also
    // happen if the key has been disabled. Try next, mark error to be safe.
    return { kind: "permanent", message: msg };
  }
  if (status === 401 || status === 403) {
    return { kind: "permanent", message: msg };
  }
  if (/RESOURCE_EXHAUSTED|QUOTA_EXCEEDED|rate.?limit|quota/i.test(msg)) {
    return { kind: "rate_limit", message: msg };
  }
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|fetch failed|network|aborted/i.test(msg)) {
    return { kind: "transient", message: msg };
  }
  // Unknown — treat as transient (try the next account) but don't mark error
  return { kind: "transient", message: msg };
}

/**
 * Call Gemini Pro with automatic multi-account fallback.
 * Throws if all accounts fail.
 */
async function callGeminiWithFallback(
  request: LLMRequest
): Promise<LLMResponse & { usedAccountId: string | null }> {
  const tool = findGeminiTool();
  if (!tool) {
    throw new Error("Gemini Pro tool not registered. Run `npm run db:seed-tools`.");
  }

  const now = Math.floor(Date.now() / 1000);
  const accounts = listActiveAccounts(tool.id, now);

  if (accounts.length === 0) {
    throw new Error(
      "No hay cuentas Gemini Pro activas. Ve a /tools y agrega al menos una API key."
    );
  }

  let lastError: Error | null = null;
  let lastErrorKind: ReturnType<typeof classifyError>["kind"] = "transient";
  let permanentFailures = 0;
  let transientFailures = 0;

  for (const account of accounts) {
    try {
      const response = await callGemini(account.api_key_encrypted, request);
      // Success path
      markAccountUsed(account.id);
      incrementQuota(tool.id, 1);
      // If tool was errored, mark it active again
      if (tool.status !== "active") setToolStatus(tool.id, "active");
      return { ...response, usedAccountId: account.id };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const cls = classifyError(err);
      lastErrorKind = cls.kind;

      if (cls.kind === "rate_limit") {
        markAccountRateLimited(account.id, cls.message, TRANSIENT_COOLDOWN_SEC);
        transientFailures++;
        continue;
      }
      if (cls.kind === "transient") {
        markAccountRateLimited(account.id, cls.message, TRANSIENT_COOLDOWN_SEC);
        transientFailures++;
        continue;
      }
      if (cls.kind === "permanent") {
        // 4xx other than 429: usually the key is bad, not the request.
        // Mark the account as errored (admin must fix) but try the next.
        markAccountError(account.id, cls.message);
        permanentFailures++;
        continue;
      }
      // fatal — don't try other accounts
      throw lastError;
    }
  }

  // All accounts exhausted.
  if (lastError) {
    if (permanentFailures > 0 && transientFailures === 0) {
      // Every account was permanently broken
      throw new Error(
        `Todas las cuentas Gemini Pro fallaron con errores permanentes (${permanentFailures} cuentas). Revisa las API keys en /tools. Último error: ${lastError.message}`
      );
    }
    throw new Error(
      `Todas las cuentas Gemini Pro agotaron su cuota o están rate-limited (probadas ${accounts.length}). Reintentá en unos minutos. Último error: ${lastError.message}`
    );
  }
  throw new Error("No Gemini Pro account could serve the request.");
}

export async function route(
  request: LLMRequest,
  opts: RouteOptions = {}
): Promise<LLMResponse & { usedLlm: "local" | "gemini"; usedAccountId?: string | null }> {
  const mode = opts.mode ?? "auto";
  const force = opts.forceLlm;

  let useGemini: boolean;

  if (force === "local") useGemini = false;
  else if (force === "gemini") useGemini = true;
  else if (mode === "local") useGemini = false;
  else if (mode === "gemini") useGemini = true;
  else useGemini = needsGemini(request, opts);

  if (useGemini) {
    const response = await callGeminiWithFallback(request);
    return { ...response, usedLlm: "gemini" };
  } else {
    const response = await callLocalLLM(request);
    return { ...response, usedLlm: "local", usedAccountId: null };
  }
}

/** Convenience: chat completion with auto routing. */
export async function chat(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  opts: RouteOptions = {}
) {
  return route({ messages }, opts);
}

/** Test a specific account (used by /api/tools/[id]/keys/[keyId]/health). */
export async function pingGeminiAccount(
  accountId: string
): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const account = getAccount(accountId);
  if (!account) return { ok: false, latencyMs: 0, error: "Account not found" };
  const start = Date.now();
  try {
    // Use the cheapest Gemini call: list models
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${account.api_key_encrypted}`
    );
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        latencyMs,
        error: `HTTP ${res.status}: ${body.slice(0, 200)}`,
      };
    }
    markAccountUsed(account.id);
    return { ok: true, latencyMs };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, error: e.message };
  }
}
