/**
 * Yelp Fusion API client.
 * Free tier: 5,000 calls/day.
 *
 * Supports multi-account via withToolFallback. Create multiple Yelp apps
 * (one per account) at https://www.yelp.com/developers/v3/manage_app and
 * add each API key in /tools.
 */

import { withToolFallback, type FallbackResult } from "./fallback";

const API_BASE = "https://api.yelp.com/v3";
const TOOL_NAME = "yelp-fusion";

export interface YelpBusiness {
  id: string;
  alias: string;
  name: string;
  image_url: string;
  is_closed: boolean;
  url: string;
  review_count: number;
  categories: Array<{ alias: string; title: string }>;
  rating: number;
  coordinates: { latitude: number; longitude: number };
  transactions: string[];
  price?: string;
  location: {
    address1: string;
    address2?: string;
    address3?: string;
    city: string;
    zip_code: string;
    country: string;
    state: string;
    display_address: string[];
  };
  phone: string;
  display_phone: string;
  distance?: number;
}

export interface YelpReview {
  id: string;
  url: string;
  text: string;
  rating: number;
  time_created: string;
  user: { id: string; profile_url: string; image_url?: string; name: string };
}

export interface YelpBusinessSearchParams {
  term?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // meters
  categories?: string;
  limit?: number;
  price?: string; // "1,2,3,4"
  open_now?: boolean;
}

// Concurrency throttler to safely stay within Yelp's 5 QPS limit
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 220; // ~4.5 requests/sec max

async function throttleYelp(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

async function fetchWithYelpRetry(url: string, apiKey: string, maxRetries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    await throttleYelp();
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.status === 429) {
      const errText = await res.text().catch(() => "");
      if (errText.includes("TOO_MANY_REQUESTS_PER_SECOND") && attempt < maxRetries) {
        // Back off briefly and retry
        await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1) + Math.random() * 100));
        continue;
      }
      throw new Error(`Yelp search HTTP 429: ${errText.slice(0, 300)}`);
    }
    return res;
  }
  throw new Error("Yelp request failed after retries");
}

export async function businessSearch(
  apiKey: string,
  params: YelpBusinessSearchParams
): Promise<{ businesses: YelpBusiness[]; total: number }> {
  const qs = new URLSearchParams();
  if (params.term) qs.set("term", params.term);
  if (params.location) qs.set("location", params.location);
  if (params.latitude !== undefined) qs.set("latitude", String(params.latitude));
  if (params.longitude !== undefined) qs.set("longitude", String(params.longitude));
  if (params.radius) qs.set("radius", String(params.radius));
  if (params.categories) qs.set("categories", params.categories);
  if (params.limit) qs.set("limit", String(Math.min(params.limit, 50)));
  if (params.price) qs.set("price", params.price);
  if (params.open_now) qs.set("open_now", "true");

  const res = await fetchWithYelpRetry(`${API_BASE}/businesses/search?${qs}`, apiKey);
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Yelp search HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }
  const data = await res.json();
  return {
    businesses: data.businesses ?? [],
    total: data.total ?? 0,
  };
}

export async function businessReviews(
  apiKey: string,
  businessId: string
): Promise<YelpReview[]> {
  const res = await fetchWithYelpRetry(`${API_BASE}/businesses/${businessId}/reviews`, apiKey);
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Yelp reviews HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.reviews ?? [];
}

// ---------------------------------------------------------------------------
// High-level (multi-account) — use these from API routes
// ---------------------------------------------------------------------------

export function businessSearchWithFallback(
  params: YelpBusinessSearchParams
): Promise<FallbackResult<{ businesses: YelpBusiness[]; total: number }>> {
  return withToolFallback(TOOL_NAME, (apiKey) => businessSearch(apiKey, params));
}

export function businessReviewsWithFallback(
  businessId: string
): Promise<FallbackResult<YelpReview[]>> {
  return withToolFallback(TOOL_NAME, (apiKey) => businessReviews(apiKey, businessId));
}
