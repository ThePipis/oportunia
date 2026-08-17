/**
 * Brave Search API client.
 * Free tier: 2,000 queries/month.
 */

import { incrementQuota } from "@/lib/db/repositories/tools";

const API_BASE = "https://api.search.brave.com/res/v1";

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
  incrementQuota("brave-search", 1);
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Brave search HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }
  return await res.json();
}
