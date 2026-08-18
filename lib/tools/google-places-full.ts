/**
 * Google Places API (New) - Full integration
 *
 * Uses the new Places API endpoints (v1):
 * - POST /v1/places:searchText for searching
 * - GET /v1/places/{id} for details
 *
 * Pricing: Pay per request. Field masks determine SKU.
 * Free tier: ~5,000-10,000 requests/month per SKU.
 *
 * Supports multi-account via withToolFallback. Each GCP project is its own
 * account; create N projects, add N keys in /tools, and the fallback helper
 * will route requests smartly (least-used account first).
 */

import { withToolFallback, type FallbackResult } from "./fallback";
import { incrementQuota } from "@/lib/db/repositories/tools";

const API_BASE = "https://places.googleapis.com/v1";
const TOOL_NAME = "google-places";

export interface PlaceSearchResult {
  id: string;
  name: string;
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  types?: string[];
  primaryType?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  businessStatus?: string;
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
}

export interface TextSearchRequest {
  query: string;
  /** Bias results to a specific location: { latitude, longitude, radiusMeters } */
  locationBias?: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
  /** Restrict to a region (e.g. "US") */
  regionCode?: string;
  /** Max results (default 20, max 60) */
  maxResultCount?: number;
  /** Open now filter */
  openNow?: boolean;
  /** Min rating filter */
  minRating?: number;
}

// ---------------------------------------------------------------------------
// Low-level (single key) — exposed for tests and direct callers
// ---------------------------------------------------------------------------

export async function textSearch(
  apiKey: string,
  request: TextSearchRequest
): Promise<PlaceSearchResult[]> {
  const body: Record<string, unknown> = {
    textQuery: request.query,
    maxResultCount: Math.min(request.maxResultCount ?? 20, 60),
  };
  if (request.locationBias) {
    body.locationBias = {
      circle: {
        center: {
          latitude: request.locationBias.latitude,
          longitude: request.locationBias.longitude,
        },
        radius: request.locationBias.radiusMeters,
      },
    };
  }
  if (request.regionCode) body.regionCode = request.regionCode;
  if (request.openNow) body.openNow = true;
  if (request.minRating) body.minRating = request.minRating;

  const res = await fetch(`${API_BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType,places.rating,places.userRatingCount,places.businessStatus",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Google Places search HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  return (data.places ?? []) as PlaceSearchResult[];
}

export async function placeDetails(
  apiKey: string,
  placeId: string,
  options: { includeReviews?: boolean } = {}
): Promise<PlaceDetails | null> {
  const fieldMask = [
    "id",
    "displayName",
    "formattedAddress",
    "shortFormattedAddress",
    "location",
    "types",
    "primaryType",
    "primaryTypeDisplayName",
    "rating",
    "userRatingCount",
    "priceLevel",
    "businessStatus",
    "websiteUri",
    "nationalPhoneNumber",
    "internationalPhoneNumber",
    "regularOpeningHours",
    "currentOpeningHours",
    "editorialSummary",
    "photos",
    "googleMapsUri",
    ...(options.includeReviews ? ["reviews"] : []),
  ].join(",");

  const res = await fetch(`${API_BASE}/places/${placeId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask,
    },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Google Places details HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }

  return (await res.json()) as PlaceDetails;
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

// ---------------------------------------------------------------------------
// Backwards-compat helper (legacy single-key lookup; not used by API routes)
// ---------------------------------------------------------------------------

/** @deprecated Use withToolFallback instead. Kept for any external callers. */
export function getGooglePlacesApiKey(): string | null {
  // Lazy import to avoid circular deps
  const { getTool } = require("@/lib/db/repositories/tools");
  const tool = getTool(TOOL_NAME);
  return tool?.api_key_encrypted ?? null;
}
