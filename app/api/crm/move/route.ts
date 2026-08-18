/**
 * API: /api/crm/move
 * POST - move a business to a new pipeline stage
 * Body: { business_id: string, stage: string }
 *
 * Creates a new activity entry tracking the move.
 */

import { NextRequest, NextResponse } from "next/server";
import { createActivity, type PipelineStage } from "@/lib/db/repositories/activities";

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

    return NextResponse.json({ activity });
  } catch (error: any) {
    console.error("POST /api/crm/move failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
