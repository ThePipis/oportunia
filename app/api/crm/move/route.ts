/**
 * API: /api/crm/move
 * POST - move a business to a new pipeline stage
 * Body: { business_id: string, stage: string }
 *
 * Creates a new activity entry tracking the move. If the business has
 * no score yet, fires a background rescore so the kanban card gets a
 * real number instead of "—" on the next reload.
 */

import { NextRequest, NextResponse } from "next/server";
import { createActivity, type PipelineStage } from "@/lib/db/repositories/activities";
import { getScore } from "@/lib/db/repositories/scores";
import { calculateScore, type ScoringInput } from "@/lib/scoring/algorithm";
import { saveScore } from "@/lib/db/repositories/scores";
import { getBusiness } from "@/lib/db/repositories/businesses";

const VALID_STAGES: PipelineStage[] = [
  "lead", "contacted", "meeting", "proposal", "closed_won", "closed_lost",
];

const STAGE_LABELS: Record<PipelineStage, string> = {
  lead: "Nuevo lead",
  contacted: "Contactado",
  meeting: "Reunión agendada",
  proposal: "Propuesta enviada",
  closed_won: "Cerrado ganado",
  closed_lost: "Cerrado perdido",
};

/**
 * Self-contained rescore — duplicates the logic in /api/businesses/[id]/rescore
 * but inlined here so we can fire-and-forget it without a fetch roundtrip.
 * The algorithm is deterministic (no LLM), so this is fast (~5ms).
 */
function rescoreBusinessSync(businessId: string): void {
  try {
    const business = getBusiness(businessId);
    if (!business) return;
    const primaryType = business.primary_type;
    const is24_7 =
      primaryType?.toLowerCase().includes("emergency") ||
      primaryType?.toLowerCase().includes("24") ||
      false;
    const HIGH_TICKET_TYPES = ["hvac", "plumb", "roof", "electric", "solar", "dental", "water"];
    const MEDIUM_TICKET_TYPES = ["restaurant", "cafe", "salon", "barber", "gym", "lawyer", "veter"];
    let avgTicket: number | null = null;
    if (primaryType && HIGH_TICKET_TYPES.some((t) => primaryType.toLowerCase().includes(t))) {
      avgTicket = 1500;
    } else if (primaryType && MEDIUM_TICKET_TYPES.some((t) => primaryType.toLowerCase().includes(t))) {
      avgTicket = 300;
    }
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
    saveScore(businessId, score);
  } catch (e: any) {
    // Non-fatal — log and move on. The user can always click "Recalcular"
    // on the profile to retry.
    console.error(`[crm/move] background rescore failed for ${businessId}:`, e?.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { business_id, stage } = body as { business_id: string; stage: string };
    if (!business_id || !stage) {
      return NextResponse.json({ error: "Missing business_id or stage" }, { status: 400 });
    }
    if (!VALID_STAGES.includes(stage as PipelineStage)) {
      return NextResponse.json({ error: `Invalid stage. Must be one of: ${VALID_STAGES.join(", ")}` }, { status: 400 });
    }

    const activity = createActivity({
      business_id,
      type: "status_change",
      title: `Movido a: ${STAGE_LABELS[stage as PipelineStage]}`,
      pipeline_stage: stage as PipelineStage,
      status: "completed",
    });

    // Fire-and-forget rescore if the business has no score yet.
    // This makes the radar → +Pipeline → /crm loop feel instant: the
    // card shows up immediately (no filter) and the score is filled
    // in by the time the user opens the kanban refresh.
    const existingScore = getScore(business_id);
    if (!existingScore) {
      // Run synchronously but in a microtask so the response returns
      // first. ~5ms for the deterministic algorithm.
      queueMicrotask(() => rescoreBusinessSync(business_id));
    }

    return NextResponse.json({ activity, rescoreQueued: !existingScore });
  } catch (error: any) {
    console.error("POST /api/crm/move failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
