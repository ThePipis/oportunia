/**
 * Brave Search API client.
 * Free tier: 2,000 queries/month.
 *
 * Multi-account: each account is a separate Brave Search API subscription
 * (free or paid). Add N keys in /tools and the fallback will distribute
 * requests across them.
 */

import { withToolFallback, type FallbackResult } from "./fallback";

const API_BASE = "https://api.search.brave.com/res/v1";
const TOOL_NAME = "brave-search";

export interface BraveSearchResult {
  type: "news" | "web" | "video";
  title: string;
  url: string;
  description?: string;
  age?: string;
  meta_url?: { hostname: string };
  thumbnail?: { src: string };
}

export interface BraveSearchResponse {
  query: { original: string };
  results: BraveSearchResult[];
  total: number;
}

export async function webSearch(
  apiKey: string,
  query: string,
  options: {
    count?: number; // max 20
    freshness?: "pd" | "pw" | "pm" | "py"; // past day/week/month/year
    safesearch?: "strict" | "moderate" | "off";
  } = {}
): Promise<BraveSearchResponse> {
  const qs = new URLSearchParams();
  qs.set("q", query);
  if (options.count) qs.set("count", String(Math.min(options.count, 20)));
  if (options.freshness) qs.set("freshness", options.freshness);
  if (options.safesearch) qs.set("safesearch", options.safesearch);

  const res = await fetch(`${API_BASE}/web/search?${qs}`, {
    headers: {
      "X-Subscription-Token": apiKey,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Brave search HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }
  return await res.json();
}

export function webSearchWithFallback(
  query: string,
  options: {
    count?: number;
    freshness?: "pd" | "pw" | "pm" | "py";
    safesearch?: "strict" | "moderate" | "off";
  } = {}
): Promise<FallbackResult<BraveSearchResponse>> {
  return withToolFallback(TOOL_NAME, (apiKey) => webSearch(apiKey, query, options));
}
