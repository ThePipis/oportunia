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
  type PlaceSearchResult,
} from "@/lib/tools/google-places-full";
import { upsertBusiness } from "@/lib/db/repositories/businesses";
import { haversineMiles, milesToMeters } from "@/lib/utils/distance";
import {
  getCategoryById,
  incrementUsageBatch,
} from "@/lib/db/repositories/categories";
import { runDeepScoringPipeline } from "@/lib/scoring/pipeline";

interface SearchRequest {
  /** Optional free-text override appended to each category query */
  query?: string;
  /** Optional list of category ids to search for (preferred path) */
  categoryIds?: string[];
  /** Optional city name or address label (e.g. "Eastvale, CA") */
  city?: string;
  /** Optional origin (for distance calc) */
  origin?: { lat: number; lng: number };
  /** Default: 5 miles */
  radiusMiles?: number;
  /** Optional cap on results. If null/undefined, returns all found places. */
  maxResults?: number | null;
}

function extractCleanCity(fullLocation: string): string {
  if (!fullLocation) return "";
  const parts = fullLocation.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return "";

  let cityPart = parts[0];
  if (/\d/.test(cityPart) && parts.length > 1) {
    cityPart = parts[1];
  }
  cityPart = cityPart.replace(/\d+/g, "").trim();

  const isCalifornia =
    fullLocation.toLowerCase().includes("california") ||
    fullLocation.toLowerCase().includes("ca") ||
    fullLocation.toLowerCase().includes("estados unidos");

  if (isCalifornia && !cityPart.toLowerCase().includes("ca")) {
    return `${cityPart}, CA`;
  }
  return cityPart;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SearchRequest;

    // Resolve city context (Mode A vs Mode B)
    const freeText = (body.query || "").trim();
    const cityText = (body.city || "").trim();
    const cleanCity = extractCleanCity(cityText);
    const categoryIds = Array.isArray(body.categoryIds) ? body.categoryIds : [];

    // Helper to format query with city context when a city was chosen
    const withCity = (queryStr: string): string => {
      if (!cleanCity) return queryStr;
      if (queryStr.toLowerCase().includes(cleanCity.toLowerCase())) return queryStr;
      return `${queryStr} in ${cleanCity}`;
    };

    // Build the list of search queries
    const searchQueries: { query: string; categoryId: string | null }[] = [];
    if (categoryIds.length > 0) {
      for (const id of categoryIds) {
        const cat = getCategoryById(id);
        if (!cat) continue; // silently skip unknown ids
        const q = freeText ? `${cat.query} ${freeText}` : cat.query;
        searchQueries.push({ query: withCity(q), categoryId: cat.id });
      }
    } else if (freeText) {
      searchQueries.push({ query: withCity(freeText), categoryId: null });
    } else {
      // Universal multi-sector broad search when no category is selected
      const broadSectors = [
        "contractors, home services, plumbing, roofers, construction",
        "restaurants, cafes, bakeries, food",
        "auto repair, mechanics, body shop, tire shop",
        "health, dental, clinics, medical services",
        "stores, retail, shopping, local businesses",
        "professional services, legal, accounting, insurance",
        "beauty salons, spas, fitness, gym, barbershops",
      ];
      for (const sector of broadSectors) {
        searchQueries.push({
          query: withCity(sector),
          categoryId: null,
        });
      }
    }

    if (searchQueries.length === 0) {
      searchQueries.push({
        query: cleanCity ? `local businesses in ${cleanCity}` : "local businesses, stores, services",
        categoryId: null,
      });
    }

    const radiusMiles = body.radiusMiles ?? 5;
    const isLimited = typeof body.maxResults === "number" && body.maxResults > 0;
    const maxResults = isLimited ? (body.maxResults as number) : null;

    // Build strict location restriction based on center origin and radius
    let locationRestriction: { latitude: number; longitude: number; radiusMeters: number } | undefined;
    if (body.origin) {
      locationRestriction = {
        latitude: body.origin.lat,
        longitude: body.origin.lng,
        radiusMeters: milesToMeters(radiusMiles),
      };
    }

    // Step 1: Run text searches in parallel (multi-account fallback per call)
    // If limited, distribute maxResults across queries; if unlimited, request Google's maximum (60)
    const perQueryMax = maxResults
      ? Math.min(60, Math.max(10, Math.ceil(maxResults / searchQueries.length)))
      : 60;
    const textResults = await Promise.allSettled(
      searchQueries.map(({ query }) =>
        textSearchWithFallback({
          query,
          locationRestriction,
          locationBias: locationRestriction,
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

        // Dual Mode Boundary Filter:
        // 1. If searching a city, businesses whose address explicitly matches the target city are ALWAYS included.
        // 2. Otherwise, check geographic haversine distance against radius.
        if (body.origin && place.location) {
          const dist = haversineMiles(
            body.origin.lat,
            body.origin.lng,
            place.location.latitude,
            place.location.longitude
          );

          const rawCityOnly = cleanCity ? cleanCity.split(",")[0].trim().toLowerCase() : "";
          const addrLower = (place.formattedAddress || "").toLowerCase();
          const isDirectCityMatch = Boolean(rawCityOnly && addrLower.includes(rawCityOnly));

          const effectiveMaxDistance = isDirectCityMatch
            ? Math.max(radiusMiles * 1.5, 12)
            : radiusMiles * 1.05;

          if (dist > effectiveMaxDistance) {
            continue; // Out of boundary
          }
        }

        seen.add(place.id);
        merged.push(place);
      }
    }

    // If no businesses were found within the area
    if (merged.length === 0) {
      if (allErrors.length > 0 && allErrors.length === searchQueries.length) {
        return NextResponse.json(
          {
            error: allErrors[0] || "Error de conexión con el proveedor de mapas.",
            per_account: textResults
              .filter((r) => r.status === "fulfilled" && r.value.ok)
              .map((r: any) => r.value.perAccount)
              .flat(),
          },
          { status: 503 }
        );
      }

      return NextResponse.json({
        results: [],
        saved: 0,
        total_found: 0,
        used_accounts: [...accountsUsed],
        message: "No se encontraron negocios dentro del área especificada. Probá ampliando el radio de búsqueda.",
      });
    }

    // Cap at maxResults if explicitly set by user; otherwise keep all merged places
    const capped = maxResults ? merged.slice(0, maxResults) : merged;

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
        message: "No se encontraron negocios dentro del radio especificado.",
      });
    }

    // Step 2: Directly process search results from single textSearch (0 N+1 calls, 0 Enterprise details fees)
    const upsertedBusinesses: any[] = [];

    for (const place of capped) {
      // Compute distance if we have coordinates and origin
      let distanceMiles: number | undefined;
      if (body.origin && place.location) {
        distanceMiles = haversineMiles(
          body.origin.lat,
          body.origin.lng,
          place.location.latitude,
          place.location.longitude
        );

        // Strict radial filter: exclude any business located outside the requested circle radius
        if (distanceMiles > radiusMiles * 1.05) {
          continue;
        }
      }

      // Parse address into city/state/zip
      const addressParts = parseAddress(place.formattedAddress ?? "");

      const business = upsertBusiness({
        google_place_id: place.id,
        name: place.displayName?.text ?? place.name ?? "Negocio Local",
        address: place.formattedAddress ?? undefined,
        city: addressParts.city,
        state: addressParts.state,
        zip: addressParts.zip,
        lat: place.location?.latitude,
        lng: place.location?.longitude,
        phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber,
        website: place.websiteUri,
        google_rating: place.rating,
        review_count: place.userRatingCount,
        hours_json: place.regularOpeningHours
          ? JSON.stringify(place.regularOpeningHours)
          : undefined,
        business_types: place.types?.join(","),
        primary_type: place.primaryType ?? place.primaryTypeDisplayName?.text,
        source_url: place.googleMapsUri,
        source_engine: "google_places",
        distance_miles: distanceMiles,
        last_crawled: Math.floor(Date.now() / 1000),
        raw_data_json: JSON.stringify(place),
      });

      upsertedBusinesses.push(business);
    }

    // Step 4: Run Deep Sincere 5D Scoring concurrently for all businesses
    // (Web scraping + Yelp Fusion + Review complaints + Multi-location + Ad Pixels)
    const scoredBusinessesResults = await Promise.allSettled(
      upsertedBusinesses.map(async (business) => {
        const deepRes = await runDeepScoringPipeline(business);
        return {
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
          total_score: deepRes.score.total,
          tier: deepRes.score.tier,
        };
      })
    );

    const savedBusinesses = scoredBusinessesResults
      .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
      .map((r) => r.value)
      .sort((a, b) => {
        // Priority: HOT (>=75) -> WARM (60-74) -> NURTURE (40-59) -> SKIP (<40)
        const sa = typeof a.total_score === "number" ? a.total_score : -1;
        const sb = typeof b.total_score === "number" ? b.total_score : -1;
        if (sb !== sa) return sb - sa;

        // Secondary tie-breaker by review_count desc
        const ra = a.review_count ?? 0;
        const rb = b.review_count ?? 0;
        return rb - ra;
      });

    const finalResults = maxResults ? savedBusinesses.slice(0, maxResults) : savedBusinesses;

    return NextResponse.json({
      results: finalResults,
      saved: finalResults.length,
      total_found: savedBusinesses.length,
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

const KNOWN_SOCAL_CITIES = [
  "Eastvale", "Corona", "Norco", "Riverside", "Jurupa Valley", "Mira Loma",
  "Ontario", "Rancho Cucamonga", "Chino Hills", "Chino", "Fontana",
  "Moreno Valley", "Upland", "Montclair", "Pomona", "Claremont", "San Dimas",
  "Rialto", "San Bernardino", "Colton", "Grand Terrace", "Loma Linda",
  "Redlands", "Temecula", "Murrieta", "Menifee", "Lake Elsinore", "Perris",
  "Wildomar", "Canyon Lake", "Beaumont", "Banning", "Yucaipa", "Highland",
  "Anaheim", "Orange", "Fullerton", "Irvine", "Santa Ana", "Garden Grove",
  "Huntington Beach", "Newport Beach", "Costa Mesa", "Tustin", "Placentia",
  "Yorba Linda", "Brea", "Diamond Bar", "Walnut", "Rowland Heights",
  "West Covina", "Covina", "Glendora", "Azusa", "Pasadena", "Los Angeles", "Long Beach"
];

function sanitizeCityToken(str?: string | null): string | null {
  if (!str) return null;
  const c = str.trim().replace(/^[",'\s]+|[",'\s]+$/g, "");
  if (/\d/.test(c)) return null;
  if (/\b(office|suite|ste|unit|bldg|building|dept|floor|fl|rm|room|space|spc|apt|lot|box|po\s*box|#)\b/i.test(c)) return null;
  if (/\b(ave|avenue|st|street|blvd|boulevard|rd|road|dr|drive|hwy|highway|pkwy|parkway|lane|ln|way|ct|court)\b/i.test(c)) return null;
  if (/^[A-Z]{2}$/i.test(c)) return null;
  return c.length >= 2 ? c : null;
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

  const result: { street?: string; city?: string; state?: string; zip?: string } = {};

  // 1. Scan address for known SoCal cities first
  for (const known of KNOWN_SOCAL_CITIES) {
    const regex = new RegExp(`\\b${known}\\b`, "i");
    if (regex.test(formatted)) {
      result.city = known;
      break;
    }
  }

  const parts = formatted
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return result;

  // Remove trailing "USA" / "United States"
  if (parts.length > 1 && /^(usa|united states|ee\.?\s*uu\.?)$/i.test(parts[parts.length - 1])) {
    parts.pop();
  }

  // Parse state + zip from the last remaining part (e.g. "CA 92880")
  if (parts.length >= 1) {
    const stateZip = parts[parts.length - 1];
    const match = stateZip.match(/^([A-Za-z\s]+?)\s+(\d{5}(?:-\d{4})?)$/);
    if (match) {
      result.state = match[1].trim();
      result.zip = match[2].trim();
      parts.pop();
    } else if (/^[A-Z]{2}$/i.test(stateZip)) {
      result.state = stateZip;
      parts.pop();
    }
  }

  // If city was not matched via KNOWN_CITIES, scan remaining parts
  if (!result.city && parts.length >= 1) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const clean = sanitizeCityToken(parts[i]);
      if (clean) {
        result.city = clean;
        parts.splice(i, 1);
        break;
      }
    }
  }

  // Anything remaining is the street / venue
  if (parts.length >= 1) {
    result.street = parts.join(", ");
  }

  return result;
}
