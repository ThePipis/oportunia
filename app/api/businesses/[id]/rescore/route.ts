/**
 * API: /api/businesses/[id]/rescore
 * POST - recalculate the sincere 5D score and AI recommendations for a business
 */

import { NextRequest, NextResponse } from "next/server";
import { getBusiness } from "@/lib/db/repositories/businesses";
import { runDeepScoringPipeline } from "@/lib/scoring/pipeline";
import { matchServices, saveMatchedServices } from "@/lib/scoring/service-matcher";
import { synthesizeRecommendationsWithAI } from "@/lib/scoring/synthesis";

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

    const { score, digitalSignals, websiteCrawled } = await runDeepScoringPipeline(
      business,
      { forceRefresh: true }
    );

    const is24_7 =
      business.primary_type?.toLowerCase().includes("emergency") ||
      business.primary_type?.toLowerCase().includes("24") ||
      false;

    const yearsInBusiness =
      business.review_count && business.review_count > 0
        ? Math.max(1, Math.round(business.review_count / 18))
        : null;

    // ── Synthesize AI services using Smart Router (Llama.cpp / Gemini) ──
    const matchInput = {
      score,
      brechaDigital: score.breakdown.brechaDigital,
      gapOperativo: score.breakdown.gapOperativo,
      fitNegocio: score.breakdown.fitNegocio,
      senalesCompra: score.breakdown.senalesCompra,
      proximidad: score.breakdown.proximidad,
      sector: business.sector_id,
      primaryType: business.primary_type,
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

    const heuristicMatched = matchServices(matchInput);
    const matched = await synthesizeRecommendationsWithAI(
      business,
      matchInput,
      heuristicMatched
    );
    saveMatchedServices(id, matched);

    return NextResponse.json({
      businessId: id,
      total: score.total,
      tier: score.tier,
      breakdown: score.breakdown,
      reasoning: score.reasoning,
      matchedServices: matched,
      websiteCrawled,
    });
  } catch (error: any) {
    console.error(`POST /api/businesses/[id]/rescore failed:`, error);
    return NextResponse.json(
      { error: error.message ?? "Rescore failed" },
      { status: 500 }
    );
  }
}
