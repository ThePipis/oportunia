/**
 * Tavily Search API client.
 * Free tier: 1,000 searches/month.
 * Best for: AI-native web research with content extraction.
 *
 * Multi-account: each account is a separate Tavily API key (sign up at
 * https://tavily.com). Add N keys in /tools.
 */

import { withToolFallback, type FallbackResult } from "./fallback";

const API_BASE = "https://api.tavily.com";
const TOOL_NAME = "tavily";

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

export interface TavilySearchOptions {
  searchDepth?: "basic" | "advanced";
  topic?: "general" | "news";
  maxResults?: number;
  includeAnswer?: boolean;
  includeRawContent?: boolean;
  days?: number;
}

export async function search(
  apiKey: string,
  query: string,
  options: TavilySearchOptions = {}
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
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Tavily extract HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }
  return await res.json();
}

export function searchWithFallback(
  query: string,
  options: TavilySearchOptions = {}
): Promise<FallbackResult<TavilySearchResponse>> {
  return withToolFallback(TOOL_NAME, (apiKey) => search(apiKey, query, options));
}

export function extractWithFallback(
  urls: string[]
): Promise<FallbackResult<{ results: Array<{ url: string; raw_content: string }> }>> {
  return withToolFallback(TOOL_NAME, (apiKey) => extract(apiKey, urls));
}
