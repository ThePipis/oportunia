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

const PHOTON_URL = "https://photon.komoot.io/api/";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 10;
const CACHE_TTL_MS = 5 * 60 * 1000;

// In-memory cache
const cache = new Map<string, { ts: number; payload: GeocodeResponse }>();

export interface GeocodeSuggestion {
  display_name: string;
  short_name: string;
  lat: number;
  lng: number;
  type: string;
  category: string;
  importance: number;
  suggestedRadiusMiles?: number;
}

interface GeocodeResponse {
  results: GeocodeSuggestion[];
  error?: string;
  rate_limited?: boolean;
}

function computeRadiusFromExtent(extent: any): number | undefined {
  if (!Array.isArray(extent) || extent.length < 4) return undefined;
  // Photon extent: [minLon, maxLat, maxLon, minLat]
  const [minLon, maxLat, maxLon, minLat] = extent.map((x: any) => parseFloat(x));
  if (isNaN(minLat) || isNaN(maxLat) || isNaN(minLon) || isNaN(maxLon)) return undefined;

  const dLat = Math.abs(maxLat - minLat) * 69.0;
  const dLon = Math.abs(maxLon - minLon) * 54.6;
  const halfDiag = Math.sqrt(dLat * dLat + dLon * dLon) / 2;
  return Math.min(25, Math.max(2.5, Math.round(halfDiag * 1.15 * 10) / 10));
}

function computeRadiusFromBbox(bbox: any): number | undefined {
  if (!Array.isArray(bbox) || bbox.length < 4) return undefined;
  // Nominatim bbox: [minLat, maxLat, minLon, maxLon]
  const minLat = parseFloat(bbox[0]);
  const maxLat = parseFloat(bbox[1]);
  const minLon = parseFloat(bbox[2]);
  const maxLon = parseFloat(bbox[3]);
  if (isNaN(minLat) || isNaN(maxLat) || isNaN(minLon) || isNaN(maxLon)) return undefined;

  const dLat = (maxLat - minLat) * 69.0;
  const dLon = (maxLon - minLon) * 54.6;
  const halfDiag = Math.sqrt(dLat * dLat + dLon * dLon) / 2;
  return Math.min(25, Math.max(2.5, Math.round(halfDiag * 1.15 * 10) / 10));
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const limit = Math.min(
    Math.max(parseInt(req.nextUrl.searchParams.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );

  if (!q || q.length < 2) {
    return NextResponse.json<GeocodeResponse>({ results: [] });
  }

  // Cache lookup
  const cacheKey = `${q.toLowerCase()}::${limit}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json<GeocodeResponse>(cached.payload);
  }

  // Step 1: Try Photon API (OSM real-time typeahead with Inland Empire / CA location bias)
  try {
    const photonUrl = new URL(PHOTON_URL);
    photonUrl.searchParams.set("q", q);
    photonUrl.searchParams.set("limit", String(limit));
    photonUrl.searchParams.set("lat", "33.9425");
    photonUrl.searchParams.set("lon", "-117.5632");

    const pRes = await fetch(photonUrl.toString(), {
      headers: { "User-Agent": "OportunIA/1.0 (local lead-gen app)" },
    });

    if (pRes.ok) {
      const pData = await pRes.json();
      if (Array.isArray(pData?.features) && pData.features.length > 0) {
        const results: GeocodeSuggestion[] = pData.features.map((f: any) => {
          const p = f.properties || {};
          const cityOrPlace = p.city || p.town || p.district || p.name || "";
          const state = p.state || "";
          const country = p.country || "United States";
          const shortName = [cityOrPlace, state, country].filter(Boolean).join(", ");
          const fullParts = [
            p.name !== cityOrPlace ? p.name : null,
            p.street ? `${p.housenumber ?? ""} ${p.street}`.trim() : null,
            cityOrPlace,
            p.county,
            state,
            p.postcode,
            country,
          ].filter(Boolean);

          return {
            display_name: fullParts.join(", ") || shortName,
            short_name: shortName,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            type: String(p.type || p.osm_value || "place"),
            category: String(p.osm_key || "place"),
            importance: typeof p.importance === "number" ? p.importance : 0.5,
            suggestedRadiusMiles: computeRadiusFromExtent(p.extent),
          };
        });

        const payload: GeocodeResponse = { results };
        cache.set(cacheKey, { ts: now, payload });
        return NextResponse.json<GeocodeResponse>(payload);
      }
    }
  } catch {
    // Silently proceed to Nominatim fallback
  }

  // Step 2: Fallback to Nominatim with countrycodes=us
  try {
    const nomUrl = new URL(NOMINATIM_URL);
    nomUrl.searchParams.set("q", q);
    nomUrl.searchParams.set("format", "json");
    nomUrl.searchParams.set("addressdetails", "1");
    nomUrl.searchParams.set("countrycodes", "us");
    nomUrl.searchParams.set("limit", String(limit));
    nomUrl.searchParams.set("dedupe", "1");

    const nRes = await fetch(nomUrl.toString(), {
      headers: {
        "User-Agent": "OportunIA/1.0 (local lead-gen app)",
        "Accept-Language": "en",
      },
    });

    if (nRes.ok) {
      const raw = (await nRes.json()) as any[];
      const results: GeocodeSuggestion[] = (Array.isArray(raw) ? raw : []).map((r) => {
        const a = r.address || {};
        const city = a.city || a.town || a.village || a.county;
        const state = a.state || "";
        const country = a.country || "United States";
        const shortName = [city || r.name, state, country].filter(Boolean).join(", ");

        return {
          display_name: String(r.display_name || shortName),
          short_name: shortName,
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
          type: String(r.type || "place"),
          category: String(r.category || "place"),
          importance: typeof r.importance === "number" ? r.importance : 0,
          suggestedRadiusMiles: computeRadiusFromBbox(r.boundingbox),
        };
      });

      const payload: GeocodeResponse = { results };
      cache.set(cacheKey, { ts: now, payload });
      return NextResponse.json<GeocodeResponse>(payload);
    }
  } catch (e: any) {
    return NextResponse.json<GeocodeResponse>(
      { results: [], error: e?.message || "geocoding failed" },
      { status: 500 }
    );
  }

  return NextResponse.json<GeocodeResponse>({ results: [] });
}
