/**
 * API: /api/radar/search
 * POST - search for businesses matching criteria
 * Body: { query, location?, radiusMiles?, maxResults? }
 */

import { NextRequest, NextResponse } from "next/server";
import { textSearch, placeDetails } from "@/lib/tools/google-places-full";
import { upsertBusiness } from "@/lib/db/repositories/businesses";
import { haversineMiles, milesToMeters } from "@/lib/utils/distance";
import { getTool } from "@/lib/db/repositories/tools";

interface SearchRequest {
  /** e.g. "plumbers in Corona CA" or "HVAC near me" */
  query: string;
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
    if (!body.query) {
      return NextResponse.json(
        { error: "Missing required field: query" },
        { status: 400 }
      );
    }

    const tool = getTool("google-places");
    if (!tool?.api_key_encrypted) {
      return NextResponse.json(
        {
          error:
            "Google Places API key no configurada. Ve a /tools y agrégala.",
        },
        { status: 400 }
      );
    }
    const apiKey = tool.api_key_encrypted;
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

    // Step 1: Text Search
    const searchResults = await textSearch(apiKey, {
      query: body.query,
      locationBias,
      maxResultCount: maxResults,
      regionCode: "US",
    });

    if (searchResults.length === 0) {
      return NextResponse.json({
        results: [],
        saved: 0,
        message: "No se encontraron negocios.",
      });
    }

    // Step 2: For each result, fetch details (parallel, capped at 10 to avoid rate limits)
    const detailsToFetch = searchResults.slice(0, Math.min(10, maxResults));
    const detailedResults = await Promise.allSettled(
      detailsToFetch.map(async (sr) => {
        const details = await placeDetails(apiKey, sr.id, { includeReviews: false });
        return { searchResult: sr, details };
      })
    );

    // Step 3: Save to DB
    const savedBusinesses: any[] = [];
    for (const result of detailedResults) {
      if (result.status !== "fulfilled" || !result.value.details) continue;
      const { searchResult: sr, details } = result.value;

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
      });
    }

    return NextResponse.json({
      results: savedBusinesses,
      saved: savedBusinesses.length,
      total_found: searchResults.length,
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

  // Heuristic: last part is "USA" (skip), second-to-last is "STATE ZIP"
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
