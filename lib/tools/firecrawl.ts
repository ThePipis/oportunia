/**
 * Firecrawl API client.
 * Pricing: $16/mo Hobby, 500 free credits.
 * Used to: scrape business websites and detect digital signals.
 */

import { incrementQuota } from "@/lib/db/repositories/tools";

const API_BASE = "https://api.firecrawl.dev/v1";

export interface ScrapeOptions {
  formats?: ("markdown" | "html" | "rawHtml" | "screenshot" | "links")[];
  onlyMainContent?: boolean;
  includeTags?: string[];
  excludeTags?: string[];
  waitFor?: number;
}

export interface ScrapeResult {
  markdown?: string;
  html?: string;
  rawHtml?: string;
  links?: string[];
  screenshot?: string;
  metadata?: {
    title?: string;
    description?: string;
    language?: string;
    sourceURL?: string;
    statusCode?: number;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  };
}

export async function scrapeUrl(
  apiKey: string,
  url: string,
  options: ScrapeOptions = {}
): Promise<ScrapeResult> {
  const res = await fetch(`${API_BASE}/scrape`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: options.formats ?? ["markdown"],
      onlyMainContent: options.onlyMainContent ?? true,
      includeTags: options.includeTags,
      excludeTags: options.excludeTags,
      waitFor: options.waitFor,
    }),
  });
  incrementQuota("firecrawl", 1);
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Firecrawl scrape HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.data ?? data;
}

export async function crawlSite(
  apiKey: string,
  url: string,
  options: { maxDepth?: number; limit?: number } = {}
): Promise<{ jobId?: string; data?: ScrapeResult[] }> {
  const res = await fetch(`${API_BASE}/crawl`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      maxDepth: options.maxDepth ?? 2,
      limit: options.limit ?? 10,
    }),
  });
  incrementQuota("firecrawl", 1);
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Firecrawl crawl HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }
  return await res.json();
}
