/**
 * API: /api/businesses/[id]/rescore
 * POST - recalculate the 5D score for a business
 *
 * Currently uses only Google Places data (no website crawl yet).
 * Will be enhanced in Phase 4 with Firecrawl-derived signals.
 */

import { NextRequest, NextResponse } from "next/server";
import { getBusiness } from "@/lib/db/repositories/businesses";
import { saveScore } from "@/lib/db/repositories/scores";
import { calculateScore } from "@/lib/scoring/algorithm";
import type { ScoringInput } from "@/lib/scoring/algorithm";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const business = getBusiness(id);
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Determine sector/ticket from business data
    const sectorId = business.sector_id;
    const primaryType = business.primary_type;
    const is24_7 =
      primaryType?.toLowerCase().includes("emergency") ||
      primaryType?.toLowerCase().includes("24") ||
      false;

    // Estimate ticket from sector (rough heuristic; will improve with sector catalog)
    const HIGH_TICKET_TYPES = ["hvac", "plumb", "roof", "electric", "solar", "dental", "water"];
    const MEDIUM_TICKET_TYPES = ["restaurant", "cafe", "salon", "barber", "gym", "lawyer", "veter"];
    let avgTicket: number | null = null;
    if (primaryType && HIGH_TICKET_TYPES.some((t) => primaryType.toLowerCase().includes(t))) {
      avgTicket = 1500;
    } else if (primaryType && MEDIUM_TICKET_TYPES.some((t) => primaryType.toLowerCase().includes(t))) {
      avgTicket = 300;
    }

    const input: ScoringInput = {
      digitalSignals: null, // will be filled in Phase 4 with Firecrawl
      hasGoogleRating: business.google_rating !== null,
      reviewCount: business.review_count,
      hasPhone: !!business.phone,
      hasEmail: !!business.email,
      sector: sectorId,
      primaryType,
      avgTicketUsd: avgTicket,
      distanceMiles: business.distance_miles,
      is24_7Emergency: is24_7,
      locationCount: null,
      yearsInBusiness: null,
      lastReviewAt: null,
      lastPostAt: null,
      employeeCount: null,
      hasActiveAds: null,
    };

    const score = calculateScore(input);
    const saved = saveScore(id, score);

    return NextResponse.json({
      businessId: id,
      total: saved.total_score,
      tier: saved.tier,
      breakdown: {
        brechaDigital: saved.score_brecha_digital,
        gapOperativo: saved.score_gap_operativo,
        fitNegocio: saved.score_fit_negocio,
        senalesCompra: saved.score_senales_compra,
        proximidad: saved.score_proximidad,
      },
      reasoning: JSON.parse(saved.breakdown_json ?? "{}").reasoning ?? null,
    });
  } catch (error: any) {
    console.error(`POST /api/businesses/[id]/rescore failed:`, error);
    return NextResponse.json(
      { error: error.message ?? "Rescore failed" },
      { status: 500 }
    );
  }
}
