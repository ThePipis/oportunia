/**
 * API: /api/radar/search
 * POST - search for businesses matching criteria
 * Body: { query?, categoryIds?, origin?, radiusMiles?, maxResults? }
 *
 * - query: free-text override (e.g. "open 24/7"). Optional when categoryIds
 *   are provided.
 * - categoryIds: array of category ids (from the categories table). The
 *   corresponding `query` for each is fetched and combined with `query` if
 *   present. Multiple category queries are run in parallel and deduped.
 * - After a successful search, each used category has its usage_count
 *   incremented so the "Más usadas" section reflects the user's habits.
 *
 * Uses the multi-account Google Places fallback. The smart router picks
 * the account with the most remaining quota, and auto-falls-back on
 * 429/5xx errors.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  textSearchWithFallback,
  placeDetailsWithFallback,
  type PlaceSearchResult,
  type PlaceDetails,
} from "@/lib/tools/google-places-full";
import { upsertBusiness } from "@/lib/db/repositories/businesses";
import { haversineMiles, milesToMeters } from "@/lib/utils/distance";
import {
  getCategoryById,
  incrementUsageBatch,
} from "@/lib/db/repositories/categories";

interface SearchRequest {
  /** Optional free-text override appended to each category query */
  query?: string;
  /** Optional list of category ids to search for (preferred path) */
  categoryIds?: string[];
  /** Optional origin (for distance calc) */
  origin?: { lat: number; lng: number };
  /** Default: 5 miles */
  radiusMiles?: number;
  /** Default: 20 */
  maxResults?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SearchRequest;

    // Resolve the list of queries to search for.
    // - If categoryIds are provided, look up each in the DB.
    // - The free-text `query` is appended to each.
    // - If no categories, fall back to `query` alone.
    const freeText = (body.query || "").trim();
    const categoryIds = Array.isArray(body.categoryIds) ? body.categoryIds : [];

    if (categoryIds.length === 0 && !freeText) {
      return NextResponse.json(
        { error: "Provide at least one categoryId or a non-empty query" },
        { status: 400 }
      );
    }

    // Build the list of search queries
    const searchQueries: { query: string; categoryId: string | null }[] = [];
    if (categoryIds.length > 0) {
      for (const id of categoryIds) {
        const cat = getCategoryById(id);
        if (!cat) continue; // silently skip unknown ids
        const q = freeText ? `${cat.query} ${freeText}` : cat.query;
        searchQueries.push({ query: q, categoryId: cat.id });
      }
    } else {
      searchQueries.push({ query: freeText, categoryId: null });
    }

    if (searchQueries.length === 0) {
      return NextResponse.json(
        { error: "No valid categories found for the given ids" },
        { status: 400 }
      );
    }

    const radiusMiles = body.radiusMiles ?? 5;
    const maxResults = body.maxResults ?? 20;

    // Build location bias
    let locationBias: { latitude: number; longitude: number; radiusMeters: number } | undefined;
    if (body.origin) {
      locationBias = {
        latitude: body.origin.lat,
        longitude: body.origin.lng,
        radiusMeters: milesToMeters(radiusMiles),
      };
    }

    // Step 1: Run text searches in parallel (multi-account fallback per call)
    // Distribute maxResults roughly across the queries so we don't exceed quota.
    const perQueryMax = Math.max(5, Math.ceil(maxResults / searchQueries.length));
    const textResults = await Promise.allSettled(
      searchQueries.map(({ query }) =>
        textSearchWithFallback({
          query,
          locationBias,
          maxResultCount: perQueryMax,
          regionCode: "US",
        })
      )
    );

    // Merge + dedupe by place id
    const seen = new Set<string>();
    const merged: PlaceSearchResult[] = [];
    const accountsUsed = new Set<string>();
    const allErrors: string[] = [];
    for (let i = 0; i < textResults.length; i++) {
      const r = textResults[i];
      if (r.status === "rejected") {
        allErrors.push(`Query ${i}: ${String(r.reason)}`);
        continue;
      }
      if (!r.value.ok) {
        allErrors.push(`Query ${i}: ${r.value.error}`);
        continue;
      }
      if (r.value.usedAccountId) accountsUsed.add(r.value.usedAccountId);
      for (const place of r.value.data) {
        if (seen.has(place.id)) continue;
        seen.add(place.id);
        merged.push(place);
      }
    }

    // If every query failed, surface the error
    if (merged.length === 0) {
      return NextResponse.json(
        {
          error: allErrors[0] || "All searches failed",
          per_account: textResults
            .filter((r) => r.status === "fulfilled" && r.value.ok)
            .map((r: any) => r.value.perAccount)
            .flat(),
        },
        { status: 503 }
      );
    }

    // Cap at maxResults
    const capped = merged.slice(0, maxResults);

    // Increment usage_count for each category used (so the "Más usadas"
    // section reflects the user's habits).
    const usedCategoryIds = searchQueries
      .map((q) => q.categoryId)
      .filter((id): id is string => Boolean(id));
    if (usedCategoryIds.length > 0) {
      try {
        incrementUsageBatch(usedCategoryIds);
      } catch {
        // non-fatal
      }
    }

    if (capped.length === 0) {
      return NextResponse.json({
        results: [],
        saved: 0,
        used_accounts: [...accountsUsed],
        message: "No se encontraron negocios.",
      });
    }

    // Step 2: For each result, fetch details in parallel.
    // Each detail call also uses the multi-account fallback independently,
    // so a single rate-limited account doesn't kill the whole batch.
    const detailsToFetch = capped.slice(0, Math.min(10, maxResults));
    const detailedResults = await Promise.allSettled(
      detailsToFetch.map(async (sr) => {
        const detailResult = await placeDetailsWithFallback(sr.id, { includeReviews: false });
        if (!detailResult.ok) {
          // Don't fail the whole batch — return a synthetic null and let the
          // search-result row stand on its own.
          return { searchResult: sr, details: null as PlaceDetails | null, error: detailResult.error };
        }
        return { searchResult: sr, details: detailResult.data, error: null as string | null };
      })
    );

    // Step 3: Save to DB
    const savedBusinesses: any[] = [];

    for (const result of detailedResults) {
      if (result.status !== "fulfilled") continue;
      const { searchResult: sr, details } = result.value;
      if (!details) continue;

      // Compute distance if we have coordinates and origin
      let distanceMiles: number | undefined;
      if (body.origin && details.location) {
        distanceMiles = haversineMiles(
          body.origin.lat,
          body.origin.lng,
          details.location.latitude,
          details.location.longitude
        );
      }

      // Parse address into city/state/zip
      const addressParts = parseAddress(details.formattedAddress ?? "");

      const business = upsertBusiness({
        google_place_id: details.id,
        name: details.displayName?.text ?? sr.name,
        address: details.formattedAddress ?? sr.formattedAddress ?? undefined,
        city: addressParts.city,
        state: addressParts.state,
        zip: addressParts.zip,
        lat: details.location?.latitude,
        lng: details.location?.longitude,
        phone: details.nationalPhoneNumber ?? details.internationalPhoneNumber,
        website: details.websiteUri,
        google_rating: details.rating ?? sr.rating,
        review_count: details.userRatingCount ?? sr.userRatingCount,
        hours_json: details.regularOpeningHours
          ? JSON.stringify(details.regularOpeningHours)
          : undefined,
        business_types: details.types?.join(","),
        primary_type: details.primaryType ?? details.primaryTypeDisplayName?.text,
        photos_json: details.photos ? JSON.stringify(details.photos) : undefined,
        source_engine: "google_places",
        distance_miles: distanceMiles,
        last_crawled: Math.floor(Date.now() / 1000),
        raw_data_json: JSON.stringify(details),
      });

      savedBusinesses.push({
        id: business.id,
        name: business.name,
        address: business.address,
        city: business.city,
        rating: business.google_rating,
        review_count: business.review_count,
        distance_miles: business.distance_miles,
        primary_type: business.primary_type,
        lat: business.lat,
        lng: business.lng,
        phone: business.phone,
        website: business.website,
      });
    }

    return NextResponse.json({
      results: savedBusinesses,
      saved: savedBusinesses.length,
      total_found: capped.length,
      used_accounts: [...accountsUsed],
    });
  } catch (error: any) {
    console.error("POST /api/radar/search failed:", error);
    return NextResponse.json(
      { error: error.message ?? "Search failed" },
      { status: 500 }
    );
  }
}

/**
 * Parse a US-formatted address like "123 Main St, Corona, CA 92879, USA"
 * into { street, city, state, zip }.
 */
function parseAddress(formatted: string): {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
} {
  if (!formatted) return {};
  const parts = formatted.split(",").map((p) => p.trim());

  const result: { street?: string; city?: string; state?: string; zip?: string } = {};
  if (parts.length >= 1) result.street = parts[0];
  if (parts.length >= 2) result.city = parts[1];
  if (parts.length >= 3) {
    const stateZip = parts[parts.length - 2] ?? "";
    const match = stateZip.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
    if (match) {
      result.state = match[1];
      result.zip = match[2];
    }
  }
  return result;
}
