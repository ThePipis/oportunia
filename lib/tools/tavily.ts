/**
 * Tavily Search API client.
 * Free tier: 1,000 searches/month.
 * Best for: AI-native web research with content extraction.
 */

import { incrementQuota } from "@/lib/db/repositories/tools";

const API_BASE = "https://api.tavily.com";

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  raw_content?: string;
  score?: number;
  published_date?: string;
  favicon?: string;
}

export interface TavilySearchResponse {
  query: string;
  results: TavilySearchResult[];
  answer?: string;
  response_time: number;
}

export async function search(
  apiKey: string,
  query: string,
  options: {
    searchDepth?: "basic" | "advanced";
    topic?: "general" | "news";
    maxResults?: number;
    includeAnswer?: boolean;
    includeRawContent?: boolean;
    days?: number;
  } = {}
): Promise<TavilySearchResponse> {
  const res = await fetch(`${API_BASE}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      search_depth: options.searchDepth ?? "basic",
      topic: options.topic ?? "general",
      max_results: options.maxResults ?? 5,
      include_answer: options.includeAnswer ?? false,
      include_raw_content: options.includeRawContent ?? false,
      days: options.days ?? 365,
    }),
  });
  incrementQuota("tavily", 1);
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Tavily search HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }
  return await res.json();
}

export async function extract(
  apiKey: string,
  urls: string[]
): Promise<{ results: Array<{ url: string; raw_content: string }> }> {
  const res = await fetch(`${API_BASE}/extract`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ urls }),
  });
  incrementQuota("tavily", 1);
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Tavily extract HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }
  return await res.json();
}
