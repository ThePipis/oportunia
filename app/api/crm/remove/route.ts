/**
 * API: /api/crm/remove
 * POST - remove a business from the CRM pipeline
 * Body: { business_id: string }
 *
 * Creates an activity with type "pipeline_removed" and pipeline_stage
 * = NULL. The kanban query treats this as a terminal marker — once
 * the latest activity for a business is of this type, the business
 * disappears from the kanban.
 *
 * Removing is idempotent: re-removing an already-removed business
 * just creates a second marker activity (the latest one still wins).
 *
 * The user can re-add the business to the pipeline later (e.g. via
 * +Pipeline from the radar) and it'll show up in LEAD again.
 */

import { NextRequest, NextResponse } from "next/server";
import { createActivity } from "@/lib/db/repositories/activities";
import { getScore } from "@/lib/db/repositories/scores";
import {
  calculateScore,
  type ScoringInput,
} from "@/lib/scoring/algorithm";
import { saveScore } from "@/lib/db/repositories/scores";
import { getBusiness } from "@/lib/db/repositories/businesses";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { business_id } = body as { business_id?: string };
    if (!business_id) {
      return NextResponse.json(
        { error: "Missing business_id" },
        { status: 400 }
      );
    }

    // Sanity check the business exists
    const business = getBusiness(business_id);
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    const activity = createActivity({
      business_id,
      type: "pipeline_removed",
      title: "Eliminado del pipeline",
      pipeline_stage: null,
      status: "completed",
    });

    // Also fire a background rescore if needed (parity with /api/crm/move)
    const existingScore = getScore(business_id);
    if (!existingScore) {
      queueMicrotask(() => {
        try {
          const primaryType = business.primary_type;
          const is24_7 =
            primaryType?.toLowerCase().includes("emergency") ||
            primaryType?.toLowerCase().includes("24") ||
            false;
          const HIGH = ["hvac", "plumb", "roof", "electric", "solar", "dental", "water"];
          const MED = ["restaurant", "cafe", "salon", "barber", "gym", "lawyer", "veter"];
          let avgTicket: number | null = null;
          if (primaryType && HIGH.some((t) => primaryType.toLowerCase().includes(t))) avgTicket = 1500;
          else if (primaryType && MED.some((t) => primaryType.toLowerCase().includes(t))) avgTicket = 300;
          const input: ScoringInput = {
            digitalSignals: null,
            hasGoogleRating: business.google_rating !== null,
            reviewCount: business.review_count,
            hasPhone: !!business.phone,
            hasEmail: !!business.email,
            sector: business.sector_id,
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
          saveScore(business_id, score);
        } catch {
          /* non-fatal */
        }
      });
    }

    return NextResponse.json({ activity });
  } catch (error: any) {
    console.error("POST /api/crm/remove failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
