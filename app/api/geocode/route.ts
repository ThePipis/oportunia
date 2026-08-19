/**
 * GET /api/geocode?q=<text>&limit=<n>
 *
 * Free geocoding autocomplete via OpenStreetMap Nominatim.
 * - No API key, no quota, worldwide
 * - Respects Nominatim's 1 req/sec policy via simple per-IP rate limiting
 * - 5-minute in-memory cache to avoid hammering the same query
 * - Requires a meaningful User-Agent (Nominatim ToS)
 */
import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 10;
const CACHE_TTL_MS = 5 * 60 * 1000;
const RATE_LIMIT_MS = 1100;

// In-memory cache
const cache = new Map<string, { ts: number; payload: GeocodeResponse }>();

// Per-IP rate limit (best-effort — single-process Next.js dev)
const lastCallByIP = new Map<string, number>();

export interface GeocodeSuggestion {
  display_name: string;
  short_name: string;
  lat: number;
  lng: number;
  type: string;
  category: string;
  importance: number;
}

interface GeocodeResponse {
  results: GeocodeSuggestion[];
  error?: string;
  rate_limited?: boolean;
}

function shortNameFor(r: any): string {
  const a = r.address || {};
  const city =
    a.city || a.town || a.village || a.hamlet || a.suburb || a.county;
  const state = a.state || a.region;
  const country = a.country;

  // Primary label: city/village if present, else first address part
  const primary = r.name || city || a.road || a.neighbourhood;
  const tail = [state, country].filter(Boolean).join(", ");
  return tail ? `${primary}, ${tail}` : primary || r.display_name;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const limit = Math.min(
    Math.max(parseInt(req.nextUrl.searchParams.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );

  if (!q || q.length < 3) {
    return NextResponse.json<GeocodeResponse>({ results: [] });
  }

  // Per-IP rate limit (Nominatim policy: max 1 req/sec)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  const now = Date.now();
  const lastCall = lastCallByIP.get(ip) || 0;
  if (now - lastCall < RATE_LIMIT_MS) {
    return NextResponse.json<GeocodeResponse>(
      { results: [], rate_limited: true },
      { status: 429 }
    );
  }
  lastCallByIP.set(ip, now);

  // Cache lookup
  const cacheKey = `${q.toLowerCase()}::${limit}`;
  const cached = cache.get(cacheKey);
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json<GeocodeResponse>(cached.payload);
  }

  // Build Nominatim request
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("dedupe", "1");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        // Nominatim requires a meaningful User-Agent that identifies the app.
        "User-Agent": "OportunIA/1.0 (local lead-generation tool; single user)",
        "Accept-Language": req.headers.get("accept-language") || "en",
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json<GeocodeResponse>(
        { results: [], error: `Nominatim ${res.status}: ${body.slice(0, 120)}` },
        { status: 502 }
      );
    }

    const raw = (await res.json()) as any[];
    const results: GeocodeSuggestion[] = (Array.isArray(raw) ? raw : []).map(
      (r) => ({
        display_name: String(r.display_name || ""),
        short_name: shortNameFor(r),
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        type: String(r.type || ""),
        category: String(r.category || ""),
        importance: typeof r.importance === "number" ? r.importance : 0,
      })
    );

    const payload: GeocodeResponse = { results };
    cache.set(cacheKey, { ts: now, payload });
    return NextResponse.json<GeocodeResponse>(payload);
  } catch (e: any) {
    return NextResponse.json<GeocodeResponse>(
      { results: [], error: e?.message || "geocoding failed" },
      { status: 500 }
    );
  }
}
