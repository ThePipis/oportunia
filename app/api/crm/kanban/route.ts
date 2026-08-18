/**
 * API: /api/crm/kanban
 * GET - get all businesses grouped by pipeline stage
 */

import { NextResponse } from "next/server";
import { getKanbanData } from "@/lib/db/repositories/activities";

export async function GET() {
  const kanban = getKanbanData();
  return NextResponse.json({ kanban });
}
