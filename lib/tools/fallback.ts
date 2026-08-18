/**
 * Generic multi-account fallback for any tool with API key(s).
 *
 * This is the heart of the quota-multiplier system. It works the same way
 * for Gemini Pro, Google Places, Yelp, Brave, Tavily, Firecrawl, etc.
 *
 * ## Behavior
 *
 * For tools with `supports_multiple_keys = 0` (single-key tools), the
 * existing `api_key_encrypted` column on `tool_configs` is used. No change.
 *
 * For tools with `supports_multiple_keys = 1` (multi-key tools), the helper
 * iterates over all active accounts in `tool_api_keys` and:
 *   - Picks the next account using the chosen strategy (see below)
 *   - Calls `fn(apiKey)`
 *   - On success: marks the account as used, increments the tool's quota
 *   - On error: classifies it (rate_limit / transient / permanent / fatal),
 *     updates the account's status accordingly, and tries the next account
 *
 * ## Smart routing strategy
 *
 * - `"sequential"` (default for back-compat): always try the lowest sort_order
 *   first. Best when accounts have very different quotas or you want a
 *   deterministic order.
 *
 * - `"smart"`: for each request, pick the account with the MOST remaining
 *   quota (`quota_limit - quota_used`). Distributes load evenly across all
 *   accounts. If no account has a `quota_limit`, falls back to sort_order.
 *   Accounts with no limit are treated as "infinite" and used last so the
 *   limited ones don't burn out.
 *
 * ## Error classification
 *
 *   - 429 / RESOURCE_EXHAUSTED / "quota exceeded" → "rate_limit"
 *       Mark account `rate_limited` with a 5-min cooldown, try next.
 *   - 5xx / timeout / network / aborted → "transient"
 *       Same: cooldown 5 min, try next.
 *   - 400 / 401 / 403 → "permanent"
 *       Mark account `error` (admin must fix), try next. 400 with multi-account
 *       is ambiguous (could be the key, could be the payload) so we still try
 *       the next — better than failing the whole call.
 *   - anything else → "transient"
 *       Don't mark, just try next.
 *
 * Throws an error with details if all accounts fail.
 */

import { getTool, incrementQuota, setToolStatus, listTools } from "@/lib/db/repositories/tools";
import {
  listAccounts,
  markAccountUsed,
  markAccountRateLimited,
  markAccountError,
  type ToolApiKey,
} from "@/lib/db/repositories/tool-api-keys";
import { classifyError } from "./error-classifier";

export type FallbackStrategy = "sequential" | "smart";

export interface FallbackOptions {
  strategy?: FallbackStrategy;
  /** Seconds to cool down an account after a 429/5xx. Default 300 (5 min). */
  cooldownSec?: number;
}

export interface FallbackSuccess<T> {
  ok: true;
  data: T;
  usedAccountId: string;
  usedAccountLabel: string | null;
}

export interface FallbackFailure {
  ok: false;
  error: string;
  attempts: number;
  /** Diagnostic: per-account result so the UI can show why each one failed */
  perAccount: Array<{ accountId: string; label: string | null; reason: string; kind: string }>;
}

export type FallbackResult<T> = FallbackSuccess<T> | FallbackFailure;

/**
 * Run `fn` against an available API key, with automatic fallback across
 * multiple accounts when one fails.
 */
export async function withToolFallback<T>(
  toolName: string,
  fn: (apiKey: string) => Promise<T>,
  opts: FallbackOptions = {}
): Promise<FallbackResult<T>> {
  const tool = findToolByName(toolName);
  if (!tool) {
    return {
      ok: false,
      error: `Tool '${toolName}' not registered. Run npm run db:seed-tools.`,
      attempts: 0,
      perAccount: [],
    };
  }

  // Single-key tools: use the existing api_key_encrypted on tool_configs
  if (tool.supports_multiple_keys === 0) {
    if (!tool.api_key_encrypted) {
      return {
        ok: false,
        error: `No API key configured for ${tool.display_name ?? toolName}. Ve a /tools.`,
        attempts: 0,
        perAccount: [],
      };
    }
    try {
      const data = await fn(tool.api_key_encrypted);
      incrementQuota(tool.id, 1);
      return { ok: true, data, usedAccountId: "single", usedAccountLabel: null };
    } catch (e: any) {
      return {
        ok: false,
        error: e.message,
        attempts: 1,
        perAccount: [{ accountId: "single", label: null, reason: e.message, kind: classifyError(e).kind }],
      };
    }
  }

  // Multi-key tools: try all active accounts in the chosen order
  const now = Math.floor(Date.now() / 1000);
  const allAccounts = listAccounts(tool.id);
  const eligible = allAccounts.filter(
    (a) => a.status === "active" && (a.cooldown_until === null || a.cooldown_until <= now)
  );

  if (eligible.length === 0) {
    // Distinguish: "all paused/disabled" vs "all in cooldown" vs "no accounts"
    if (allAccounts.length === 0) {
      return {
        ok: false,
        error: `No hay cuentas configuradas para ${tool.display_name ?? toolName}. Agregá al menos una.`,
        attempts: 0,
        perAccount: [],
      };
    }
    const allInCooldown = allAccounts.every((a) => a.cooldown_until && a.cooldown_until > now);
    if (allInCooldown) {
      const soonest = Math.min(...allAccounts.map((a) => a.cooldown_until ?? Infinity));
      const waitMin = Math.max(1, Math.ceil((soonest - now) / 60));
      return {
        ok: false,
        error: `Todas las cuentas (${allAccounts.length}) están en cooldown. Reintentá en ~${waitMin} min.`,
        attempts: 0,
        perAccount: [],
      };
    }
    return {
      ok: false,
      error: `Todas las cuentas (${allAccounts.length}) están pausadas o con error. Revisá /tools.`,
      attempts: 0,
      perAccount: [],
    };
  }

  const strategy = opts.strategy ?? "smart";
  const ordered = pickAccountOrder(eligible, strategy);

  const perAccount: FallbackFailure["perAccount"] = [];
  let lastError: Error | null = null;
  const cooldownSec = opts.cooldownSec ?? 300;

  for (const account of ordered) {
    try {
      const data = await fn(account.api_key_encrypted);
      markAccountUsed(account.id);
      incrementQuota(tool.id, 1);
      if (tool.status !== "active") setToolStatus(tool.id, "active");
      return {
        ok: true,
        data,
        usedAccountId: account.id,
        usedAccountLabel: account.label,
      };
    } catch (e: any) {
      lastError = e;
      const cls = classifyError(e);
      perAccount.push({
        accountId: account.id,
        label: account.label,
        reason: e.message?.slice(0, 200) ?? "Unknown error",
        kind: cls.kind,
      });

      if (cls.kind === "rate_limit" || cls.kind === "transient") {
        markAccountRateLimited(account.id, e.message, cooldownSec);
      } else if (cls.kind === "permanent") {
        markAccountError(account.id, e.message);
      }
      // fatal: don't mark, just continue (we'll still try next, which is the
      // safe default for unknown errors)
    }
  }

  // All accounts failed. Build a clear error message.
  const permanentFails = perAccount.filter((p) => p.kind === "permanent").length;
  const transientFails = perAccount.length - permanentFails;
  let summary: string;
  if (permanentFails === perAccount.length && perAccount.length > 0) {
    summary = `Todas las cuentas (${perAccount.length}) fallaron con errores permanentes (keys inválidas o mal configuradas).`;
  } else if (transientFails > 0) {
    summary = `Todas las cuentas (${perAccount.length}) se quedaron sin cuota o están rate-limited.`;
  } else {
    summary = `Todas las cuentas (${perAccount.length}) fallaron.`;
  }

  return {
    ok: false,
    error: `${summary} Último error: ${lastError?.message ?? "unknown"}`,
    attempts: perAccount.length,
    perAccount,
  };
}

/**
 * Pick the order in which to try accounts.
 *
 * "smart" sorts by remaining quota DESC. Accounts with no quota_limit are
 * treated as "infinite" and floated to the end so the limited accounts
 * (which are the ones with finite budgets) are used first and protected.
 *
 * Tiebreaker: oldest updated first (so two accounts at the same usage don't
 * always pick the same one).
 */
function pickAccountOrder(accounts: ToolApiKey[], strategy: FallbackStrategy): ToolApiKey[] {
  if (strategy === "sequential") {
    return [...accounts].sort((a, b) => a.sort_order - b.sort_order);
  }
  return [...accounts].sort((a, b) => {
    const aRemaining = a.quota_limit ? a.quota_limit - a.quota_used : Infinity;
    const bRemaining = b.quota_limit ? b.quota_limit - b.quota_used : Infinity;
    if (aRemaining !== bRemaining) return bRemaining - aRemaining;
    return a.updated_at - b.updated_at; // older first
  });
}

/**
 * Resolve a tool by its name (handles both seed-style id==name and the
 * generated id where the name has a UUID suffix).
 */
function findToolByName(name: string) {
  const direct = getTool(name);
  if (direct) return direct;
  return listTools().find((t) => t.name === name) ?? null;
}
