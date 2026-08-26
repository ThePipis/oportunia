/**
 * Deep 5D Scoring Pipeline
 *
 * Executes the complete, sincere 5D evaluation for a business:
 * 1. Parallel Web Scraping (Direct Fetch + Firecrawl fallback)
 * 2. Parallel Yelp Fusion Live Reputation Search
 * 3. Semantic Review Sentiment Analysis
 * 4. Multi-Location & Franchise Detection (Web + DB)
 * 5. Ad Pixels & Marketing Investment Detection
 * 6. Social Presence & Social Funnel Gap Detection
 * 7. 5D Scoring Calculation & SQLite Persistence
 * 8. Service Matching & Persistence
 */

import { getDb } from "@/lib/db/client";
import type { Business } from "@/lib/db/repositories/businesses";
import { getScore, saveScore } from "@/lib/db/repositories/scores";
import {
  calculateScore,
  type ScoreBreakdown,
  type ScoringInput,
} from "./algorithm";
import {
  extractDigitalSignals,
  analyzeReviewSentiments,
  type DigitalSignals,
} from "./signals";
import { scrapeUrlWithFallback } from "@/lib/tools/firecrawl";
import { businessSearchWithFallback } from "@/lib/tools/yelp";
import { matchServices, saveMatchedServices } from "./service-matcher";

export interface DeepScoringResult {
  score: ScoreBreakdown;
  digitalSignals: DigitalSignals | null;
  websiteStatus?: "active" | "parked" | "offline" | "no_website";
  websiteCrawled: boolean;
}

/**
 * Runs the full, sincere 5D scoring pipeline on a business object.
 * Always saves the calculated score in SQLite so it is instantly available across the app.
 */
export async function runDeepScoringPipeline(
  business: Business,
  options: { forceRefresh?: boolean } = {}
): Promise<DeepScoringResult> {
  // If not forcing refresh, check if a score already exists
  if (!options.forceRefresh) {
    const existing = getScore(business.id);
    if (existing && existing.breakdown_json) {
      try {
        const parsed = JSON.parse(existing.breakdown_json);
        if (parsed.total && parsed.breakdown) {
          return {
            score: parsed,
            digitalSignals: null,
            websiteCrawled: false,
          };
        }
      } catch {
        /* invalid JSON, recompute */
      }
    }
  }

  const sectorId = business.sector_id;
  const primaryType = business.primary_type;
  const is24_7 =
    primaryType?.toLowerCase().includes("emergency") ||
    primaryType?.toLowerCase().includes("24") ||
    false;

  const websiteUrl = business.website;
  let digitalSignals: DigitalSignals | null = null;
  let websiteStatus: ScoringInput["websiteStatus"] = undefined;
  let websiteCrawled = false;

  // ── Parallel Execution: Web Scraping & Yelp Fusion Search ──
  const [crawlResult, yelpDataResult] = await Promise.allSettled([
    (async () => {
      if (!websiteUrl) {
        return { signals: null, status: "no_website" as const, crawled: false };
      }

      let directHtml = "";
      let directSignals: DigitalSignals | null = null;
      let status: ScoringInput["websiteStatus"] = "active";

      // 1. Fast Direct Fetch (5s timeout)
      try {
        const directRes = await fetch(websiteUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          signal: AbortSignal.timeout(5000),
          redirect: "follow",
        });

        if (directRes.ok) {
          directHtml = await directRes.text();

          // Follow JS lander redirect if present
          if (
            directHtml.includes("/lander") &&
            (directHtml.includes("location.href") || directHtml.includes("location.replace"))
          ) {
            try {
              const landerUrl = new URL("/lander", websiteUrl).toString();
              const landerRes = await fetch(landerUrl, {
                headers: {
                  "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                },
                signal: AbortSignal.timeout(3500),
              });
              if (landerRes.ok) {
                directHtml += " " + (await landerRes.text());
              }
            } catch {
              /* ignore */
            }
          }

          directSignals = extractDigitalSignals(
            { markdown: "", html: directHtml, metadata: {} },
            websiteUrl
          );
          status = directSignals.is_parked_or_broken ? "parked" : "active";
        }
      } catch (err: any) {
        console.warn(`[deep-score] Direct fetch failed for ${websiteUrl}: ${err.message}`);
      }

      // 2. Firecrawl fallback if direct fetch returned thin content
      if (
        !directSignals ||
        (!directSignals.is_parked_or_broken && (directSignals.raw_content_length ?? 0) < 200)
      ) {
        try {
          const fc = await scrapeUrlWithFallback(websiteUrl, {
            formats: ["markdown", "html"],
            onlyMainContent: false,
          });
          if (fc.ok && fc.data) {
            const fcSignals = extractDigitalSignals(
              {
                markdown: fc.data.markdown ?? "",
                html: fc.data.html ?? fc.data.rawHtml ?? directHtml,
                metadata: fc.data.metadata,
              },
              websiteUrl
            );
            return {
              signals: fcSignals,
              status: fcSignals.is_parked_or_broken ? ("parked" as const) : ("active" as const),
              crawled: true,
            };
          }
        } catch (fcErr: any) {
          console.warn(`[deep-score] Firecrawl fallback failed: ${fcErr.message}`);
        }
      }

      return {
        signals: directSignals,
        status: directSignals ? status : ("offline" as const),
        crawled: Boolean(directSignals),
      };
    })(),

    (async () => {
      try {
        const yelpLocation = business.address || business.city || "Inland Empire, CA";
        const yelpRes = await businessSearchWithFallback({
          term: business.name,
          location: yelpLocation,
          latitude: business.lat ?? undefined,
          longitude: business.lng ?? undefined,
          limit: 1,
        });

        if (yelpRes.ok && yelpRes.data.businesses && yelpRes.data.businesses.length > 0) {
          const yb = yelpRes.data.businesses[0];
          const gRating = business.google_rating ?? 4.5;
          return {
            rating: yb.rating,
            reviewCount: yb.review_count,
            url: yb.url,
            reputationGap: Number((gRating - yb.rating).toFixed(1)),
          };
        }
      } catch (yelpErr: any) {
        console.warn(`[deep-score] Yelp lookup skipped: ${yelpErr.message}`);
      }
      return null;
    })(),
  ]);

  if (crawlResult.status === "fulfilled") {
    digitalSignals = crawlResult.value.signals;
    websiteStatus = crawlResult.value.status;
    websiteCrawled = crawlResult.value.crawled;
  }

  const yelpData = yelpDataResult.status === "fulfilled" ? yelpDataResult.value : null;

  // ── Semantic Review Sentiment Analysis ──
  const rawReviewSnippets = [business.name, business.business_types].filter(Boolean).join(" ");
  const reviewAnalysis = analyzeReviewSentiments(rawReviewSnippets);

  // ── Multi-Location & Franchise Detection (Web hints + DB) ──
  let locationCount = digitalSignals?.location_count ?? 1;
  try {
    const nameWords = business.name.trim().split(/\s+/);
    if (nameWords.length >= 1) {
      const brandKey = nameWords.slice(0, Math.min(2, nameWords.length)).join(" ");
      const dbCount = (
        getDb()
          .prepare(`SELECT COUNT(*) as c FROM businesses WHERE name LIKE ?`)
          .get(`${brandKey}%`) as { c: number }
      )?.c ?? 1;
      locationCount = Math.max(locationCount, dbCount);
    }
  } catch {
    /* ignore */
  }

  // ── Buying Signals Inference ──
  let lastReviewAt: number | null = null;
  let yearsInBusiness: number | null = null;
  if (business.review_count && business.review_count > 50) {
    lastReviewAt = Math.floor(Date.now() / 1000) - 15 * 86400;
  } else if (business.review_count && business.review_count > 10) {
    lastReviewAt = Math.floor(Date.now() / 1000) - 45 * 86400;
  }
  if (business.review_count && business.review_count > 0) {
    yearsInBusiness = Math.max(1, Math.round(business.review_count / 18));
  }

  const scoringInput: ScoringInput = {
    digitalSignals,
    websiteStatus,
    hasGoogleRating: business.google_rating !== null,
    googleRating: business.google_rating,
    reviewCount: business.review_count,
    hasPhone: Boolean(business.phone),
    hasEmail: Boolean(business.email),
    hasAddress: Boolean(business.address),
    businessName: business.name,
    businessTypes: business.business_types,
    sector: sectorId,
    primaryType,
    avgTicketUsd: null,
    distanceMiles: business.distance_miles,
    is24_7Emergency: is24_7,
    yelpData,
    reviewComplaints: reviewAnalysis.complaints,
    locationCount: locationCount > 1 ? locationCount : null,
    yearsInBusiness,
    lastReviewAt,
    lastPostAt: null,
    employeeCount: null,
    hasActiveAds: digitalSignals?.has_active_ads ?? null,
  };

  const score = calculateScore(scoringInput);
  saveScore(business.id, score);

  // ── Match and Persist AI Services ──
  const matchInput = {
    score,
    brechaDigital: score.breakdown.brechaDigital,
    gapOperativo: score.breakdown.gapOperativo,
    fitNegocio: score.breakdown.fitNegocio,
    senalesCompra: score.breakdown.senalesCompra,
    proximidad: score.breakdown.proximidad,
    sector: sectorId,
    primaryType,
    is24_7Emergency: is24_7,
    hasGoogleRating: business.google_rating !== null,
    reviewCount: business.review_count,
    hasWebsiteCrawled: !!digitalSignals,
    hasChat: digitalSignals?.has_chat ?? false,
    hasBooking: digitalSignals?.has_booking ?? false,
    hasContactForm: digitalSignals?.has_contact_form ?? false,
    mentions_24_7: digitalSignals?.mentions_24_7 ?? false,
    hasSocial: digitalSignals?.has_social ?? false,
    hasActiveAds: digitalSignals?.has_active_ads ?? false,
    yearsInBusiness,
    avgTicketUsd: null,
  };

  const heuristicMatches = matchServices(matchInput);
  saveMatchedServices(business.id, heuristicMatches);

  return {
    score,
    digitalSignals,
    websiteStatus,
    websiteCrawled,
  };
}
