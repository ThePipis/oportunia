/**
 * Geoapify Places API integration for OportunIA.
 *
 * Drop-in replacement for `google-places-full.ts`. Exports the same
 * `PlaceSearchResult` interface and `textSearchWithFallback` function
 * so the Radar search route only needs to change its import path.
 *
 * Geoapify Places API v2:
 *   GET https://api.geoapify.com/v2/places
 *     ?categories=...
 *     &filter=circle:{lon},{lat},{radiusMeters}
 *     &limit=20
 *     &apiKey={key}
 *
 * Free tier: 3,000 requests/day (~90,000/month), no credit card required.
 * Exceeding the limit returns HTTP 429 (zero surprise charges).
 *
 * Data source: OpenStreetMap (excellent US coverage, especially SoCal).
 * Response format: GeoJSON FeatureCollection.
 *
 * Bonus vs Google Places: includes `contact.email` when available.
 */

import { withToolFallback, type FallbackResult } from "./fallback";
import { extractGeoapifyCategories } from "./geoapify-categories";

const API_BASE = "https://api.geoapify.com/v2/places";
const TOOL_NAME = "geoapify";

// ---------------------------------------------------------------------------
// Shared interfaces (same shape as google-places-full.ts for compatibility)
// ---------------------------------------------------------------------------

export interface PlaceSearchResult {
  id: string;
  name?: string;
  displayName?: { text: string; languageCode?: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  location?: { latitude: number; longitude: number };
  types?: string[];
  primaryType?: string;
  primaryTypeDisplayName?: { text: string };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  businessStatus?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  regularOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
    periods?: any[];
  };
  googleMapsUri?: string;
  /** Bonus field: email extracted from Geoapify contact data */
  email?: string;
}

export interface PlaceDetails {
  id: string;
  displayName?: { text: string; languageCode?: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  location?: { latitude: number; longitude: number };
  types?: string[];
  primaryType?: string;
  primaryTypeDisplayName?: { text: string };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  businessStatus?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  regularOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
    periods?: any[];
  };
  currentOpeningHours?: any;
  editorialSummary?: { text: string; languageCode?: string };
  reviews?: Array<{
    rating: number;
    text?: { text: string; languageCode?: string };
    authorAttribution?: { displayName: string; uri?: string };
    publishTime?: string;
    relativePublishTimeDescription?: string;
    originalText?: { text: string; languageCode?: string };
  }>;
  photos?: Array<{ name: string }>;
  googleMapsUri?: string;
  email?: string;
}

export interface TextSearchRequest {
  query: string;
  locationBias?: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
  locationRestriction?: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
  regionCode?: string;
  maxResultCount?: number;
  openNow?: boolean;
  minRating?: number;
}

// ---------------------------------------------------------------------------
// Geoapify GeoJSON response types (internal)
// ---------------------------------------------------------------------------

interface GeoapifyFeature {
  type: "Feature";
  properties: {
    place_id: string;
    name?: string;
    formatted?: string;
    address_line1?: string;
    address_line2?: string;
    housenumber?: string;
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
    categories?: string[];
    datasource?: {
      sourcename?: string;
      attribution?: string;
      raw?: Record<string, any>;
    };
    opening_hours?: string;
    contact?: {
      phone?: string;
      email?: string;
    };
    website?: string;
    lon: number;
    lat: number;
    distance?: number;
    result_type?: string;
  };
  geometry: {
    type: string;
    coordinates: [number, number]; // [lon, lat]
  };
}

interface GeoapifyResponse {
  type: "FeatureCollection";
  features: GeoapifyFeature[];
}

// ---------------------------------------------------------------------------
// Normalization: Geoapify → PlaceSearchResult
// ---------------------------------------------------------------------------

function normalizeFeature(feature: GeoapifyFeature): PlaceSearchResult {
  const p = feature.properties;
  const raw = p.datasource?.raw || {};
  const lon = feature.geometry?.coordinates?.[0] ?? p.lon;
  const lat = feature.geometry?.coordinates?.[1] ?? p.lat;

  // Build a rich Google Maps link that opens the actual business place profile (Name + Address)
  const placeName = p.name || raw.name || raw["name:es"] || raw["name:en"] || "";
  const placeAddress = p.formatted || p.address_line1 || "";
  const queryStr = [placeName, placeAddress].filter(Boolean).join(", ");

  const googleMapsUri = queryStr
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryStr)}`
    : lat && lon
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
    : undefined;

  // Extract most specific primary type from categories (longest dot hierarchy)
  const categories = p.categories ?? [];
  const specificCategory = categories
    .slice()
    .sort((a, b) => b.split(".").length - a.split(".").length)[0];
  const primaryType = specificCategory || categories[0] || undefined;

  // Determine business status
  const businessStatus = "OPERATIONAL";

  // Parse opening hours string into structured format (best-effort)
  let regularOpeningHours: PlaceSearchResult["regularOpeningHours"] | undefined;
  if (p.opening_hours || raw.opening_hours) {
    regularOpeningHours = {
      weekdayDescriptions: [p.opening_hours || raw.opening_hours],
    };
  }

  // Extract phone, website, email from both standard and raw OSM properties
  const nationalPhoneNumber =
    p.contact?.phone ||
    raw.phone ||
    raw["contact:phone"] ||
    raw["phone:mobile"] ||
    raw["telephone"] ||
    undefined;

  const websiteUri =
    p.website ||
    raw.website ||
    raw["contact:website"] ||
    raw.url ||
    raw["contact:url"] ||
    undefined;

  const email =
    p.contact?.email ||
    raw.email ||
    raw["contact:email"] ||
    undefined;

  return {
    id: p.place_id,
    name: p.name || raw.name || raw["name:es"] || raw["name:en"],
    displayName: (p.name || raw.name) ? { text: p.name || raw.name } : undefined,
    formattedAddress: p.formatted ?? [p.address_line1, p.address_line2].filter(Boolean).join(", "),
    shortFormattedAddress: p.address_line1 ?? undefined,
    location: lat && lon ? { latitude: lat, longitude: lon } : undefined,
    types: categories,
    primaryType,
    primaryTypeDisplayName: primaryType ? { text: formatCategoryName(primaryType) } : undefined,
    businessStatus,
    websiteUri,
    nationalPhoneNumber,
    regularOpeningHours,
    googleMapsUri,
    email,
  };
}

/**
 * Convert a Geoapify dot-notation category to a human-readable label.
 * e.g. "service.beauty.hairdresser" → "Hairdresser"
 */
function formatCategoryName(category: string): string {
  const parts = category.split(".");
  const leaf = parts[parts.length - 1];
  return leaf.charAt(0).toUpperCase() + leaf.slice(1).replace(/_/g, " ");
}

// ---------------------------------------------------------------------------
// Low-level search (single key)
// ---------------------------------------------------------------------------

export async function textSearch(
  apiKey: string,
  request: TextSearchRequest
): Promise<PlaceSearchResult[]> {
  const targetCount = Math.min(request.maxResultCount ?? 20, 40);

  // Determine center and radius from locationRestriction or locationBias
  const loc = request.locationRestriction ?? request.locationBias;
  if (!loc) {
    throw new Error("Geoapify requires a location (locationRestriction or locationBias) for searches.");
  }

  const { latitude: lat, longitude: lon, radiusMeters } = loc;

  // Try to extract Geoapify categories from the query text
  const geoapifyCategories = extractGeoapifyCategories(request.query);

  // Build the Geoapify Places API URL
  const params = new URLSearchParams();

  if (geoapifyCategories.length > 0) {
    params.set("categories", geoapifyCategories.join(","));
  }

  // Geoapify filter format: circle:lon,lat,radiusMeters
  params.set("filter", `circle:${lon},${lat},${radiusMeters}`);
  // Bias results towards the center point
  params.set("bias", `proximity:${lon},${lat}`);
  params.set("limit", String(targetCount));
  params.set("apiKey", apiKey);

  // If no categories matched but we have a query, use the conditions parameter
  // to filter by name. Geoapify doesn't have a full text-search endpoint for
  // places, so we use categories when available and fall back to fetching all
  // commercial/service places in the area.
  if (geoapifyCategories.length === 0) {
    // Broad search: commercial + service + catering + healthcare
    params.set(
      "categories",
      "commercial,service,catering,healthcare,office,sport,education"
    );
  }

  const url = `${API_BASE}?${params.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Geoapify Places HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data: GeoapifyResponse = await res.json();
  const features = data.features ?? [];

  // Normalize all features to PlaceSearchResult
  let results = features.map(normalizeFeature);

  // If we did a broad search (no category match), filter results by name match
  if (geoapifyCategories.length === 0 && request.query) {
    const queryTerms = request.query
      .toLowerCase()
      .split(/[\s,]+/)
      .filter((t) => t.length > 2 && !STOP_WORDS.has(t));

    if (queryTerms.length > 0) {
      // Keep results that match at least one query term in name or categories
      const filtered = results.filter((r) => {
        const name = (r.name ?? r.displayName?.text ?? "").toLowerCase();
        const cats = (r.types ?? []).join(" ").toLowerCase();
        const combined = `${name} ${cats}`;
        return queryTerms.some((term) => combined.includes(term));
      });
      // Only use filtered results if we got meaningful matches
      if (filtered.length >= 3 || filtered.length === results.length) {
        results = filtered;
      }
    }
  }

  return results;
}

/** Common stop words to ignore when matching query terms against place names */
const STOP_WORDS = new Set([
  "in", "at", "the", "and", "or", "of", "for", "near", "around",
  "local", "businesses", "services", "stores", "shops",
  "en", "de", "la", "el", "los", "las", "con", "por", "para",
]);

// ---------------------------------------------------------------------------
// Place details (on-demand only)
// ---------------------------------------------------------------------------

export async function placeDetails(
  apiKey: string,
  placeId: string,
  _options: { includeReviews?: boolean; includePhotos?: boolean; includeAtmosphere?: boolean } = {}
): Promise<PlaceDetails | null> {
  // Geoapify Place Details endpoint
  const url = `https://api.geoapify.com/v2/place-details?id=${encodeURIComponent(placeId)}&apiKey=${apiKey}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Geoapify Details HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const feature = data.features?.[0] as GeoapifyFeature | undefined;
  if (!feature) return null;

  const normalized = normalizeFeature(feature);
  return normalized as PlaceDetails;
}

// ---------------------------------------------------------------------------
// High-level (multi-account) — use these from API routes
// ---------------------------------------------------------------------------

/** Text search with automatic multi-account fallback. */
export async function textSearchWithFallback(
  request: TextSearchRequest
): Promise<FallbackResult<PlaceSearchResult[]>> {
  return withToolFallback(TOOL_NAME, (apiKey) => textSearch(apiKey, request));
}

/** Place details with automatic multi-account fallback. */
export async function placeDetailsWithFallback(
  placeId: string,
  options: { includeReviews?: boolean } = {}
): Promise<FallbackResult<PlaceDetails | null>> {
  return withToolFallback(TOOL_NAME, (apiKey) => placeDetails(apiKey, placeId, options));
}
