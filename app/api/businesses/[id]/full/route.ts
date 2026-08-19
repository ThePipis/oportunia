/**
 * API: /api/businesses/[id]/full
 * GET - returns business + score + matched services in one call.
 *
 * Also returns the current pipeline status (in_pipeline + stage) so
 * the AddToCrmButton on the profile page can render a proper
 * toggle ("+ Pipeline" vs "− En pipeline") without an extra fetch.
 */

import { NextRequest, NextResponse } from "next/server";
import { getBusiness } from "@/lib/db/repositories/businesses";
import { getScore } from "@/lib/db/repositories/scores";
import { getMatchedServices } from "@/lib/scoring/service-matcher";
import { listActivities } from "@/lib/db/repositories/activities";

export async function GET(
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
    const score = getScore(id);
    const matchedServices = getMatchedServices(id);

    // Pipeline status = the latest activity's stage, if it's a real
    // status_change. A latest pipeline_removed means "not in
    // pipeline anymore" (the user can re-add). This mirrors the
    // query used by the kanban view so both surfaces agree.
    const latest = listActivities(id, { limit: 1 })[0];
    const in_pipeline =
      latest?.type === "status_change" && !!latest.pipeline_stage;
    const stage = in_pipeline ? latest.pipeline_stage : null;

    return NextResponse.json({
      business,
      score,
      matchedServices,
      pipeline: { in_pipeline, stage },
    });
  } catch (error: any) {
    console.error("GET /api/businesses/[id]/full failed:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to load business" },
      { status: 500 }
    );
  }
}
