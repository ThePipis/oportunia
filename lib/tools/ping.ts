/**
 * Generic per-account health check.
 *
 * Returns { ok, latencyMs, error?, meta? } for a single account.
 * Dispatches to the right health check based on the tool name.
 */

import { getAccount } from "@/lib/db/repositories/tool-api-keys";
import { getTool } from "@/lib/db/repositories/tools";
import { HEALTH_CHECKS } from "./health-checks";

export interface PingResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
  meta?: Record<string, unknown>;
}

/**
 * Ping the account by id. The right protocol is inferred from the tool's name.
 * Works for any tool with multi-account support.
 */
export async function pingAccount(accountId: string): Promise<PingResult> {
  const account = getAccount(accountId);
  if (!account) {
    return { ok: false, latencyMs: 0, error: "Account not found" };
  }
  const tool = getTool(account.tool_id);
  if (!tool) {
    return { ok: false, latencyMs: 0, error: "Tool not found" };
  }

  const start = Date.now();
  const apiKey = account.api_key_encrypted;

  try {
    if (tool.name === "gemini-pro") {
      // Reuse the existing gemini-specific health check
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      const latencyMs = Date.now() - start;
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { ok: false, latencyMs, error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
      }
      const data = await res.json();
      return {
        ok: true,
        latencyMs,
        meta: { models: data.models?.slice(0, 3).map((m: any) => m.name) ?? [] },
      };
    }

    if (tool.name === "google-places" && HEALTH_CHECKS["google-places"]) {
      return HEALTH_CHECKS["google-places"](apiKey);
    }
    if (tool.name === "yelp-fusion" && HEALTH_CHECKS["yelp-fusion"]) {
      return HEALTH_CHECKS["yelp-fusion"](apiKey);
    }
    if (tool.name === "tavily" && HEALTH_CHECKS["tavily"]) {
      return HEALTH_CHECKS["tavily"](apiKey);
    }
    if (tool.name === "firecrawl" && HEALTH_CHECKS["firecrawl"]) {
      return HEALTH_CHECKS["firecrawl"](apiKey);
    }
    if (tool.name === "brave-search" && HEALTH_CHECKS["brave-search"]) {
      return HEALTH_CHECKS["brave-search"](apiKey);
    }

    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: `No health check available for tool '${tool.name}'`,
    };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, error: e.message };
  }
}
