/**
 * Activities Repository - CRM pipeline events.
 */

import { getDb } from "../client";
import { randomUUID } from "node:crypto";

export type ActivityType = "call" | "email" | "meeting" | "note" | "proposal_sent" | "status_change" | "task" | "pipeline_removed";
export type PipelineStage = "lead" | "contacted" | "meeting" | "proposal" | "closed_won" | "closed_lost";

export interface Activity {
  id: string;
  business_id: string;
  type: ActivityType;
  status: "pending" | "completed" | "cancelled" | null;
  pipeline_stage: PipelineStage | null;
  title: string;
  notes: string | null;
  due_date: number | null;
  completed_at: number | null;
  created_at: number;
}

function makeId(): string {
  return "act-" + randomUUID().slice(0, 12);
}

export function listActivities(businessId?: string, options: { stage?: PipelineStage; limit?: number } = {}): Activity[] {
  const db = getDb();
  const params: unknown[] = [];
  let where = "1=1";
  if (businessId) {
    where += " AND business_id = ?";
    params.push(businessId);
  }
  if (options.stage) {
    where += " AND pipeline_stage = ?";
    params.push(options.stage);
  }
  const limit = options.limit ?? 100;
  return db
    .prepare(`SELECT * FROM activities WHERE ${where} ORDER BY created_at DESC LIMIT ?`)
    .all(...params, limit) as Activity[];
}

export function createActivity(input: {
  business_id: string;
  type: ActivityType;
  title: string;
  notes?: string;
  pipeline_stage?: PipelineStage;
  due_date?: number;
  status?: "pending" | "completed";
}): Activity {
  const db = getDb();
  const id = makeId();
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    `INSERT INTO activities (
      id, business_id, type, status, pipeline_stage, title, notes,
      due_date, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.business_id,
    input.type,
    input.status ?? "pending",
    input.pipeline_stage ?? null,
    input.title,
    input.notes ?? null,
    input.due_date ?? null,
    now
  );
  return listActivities(input.business_id).find((a) => a.id === id)!;
}

export function completeActivity(id: string): Activity | null {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  db.prepare(`UPDATE activities SET status = 'completed', completed_at = ? WHERE id = ?`).run(now, id);
  const row = db.prepare(`SELECT * FROM activities WHERE id = ?`).get(id) as Activity | undefined;
  return row ?? null;
}

/**
 * Group businesses by their latest pipeline stage.
 * Used by the CRM Kanban view.
 */
export function getKanbanData(): Record<PipelineStage, Array<{
  business_id: string;
  business_name: string;
  city: string | null;
  total_score: number | null;
  tier: string | null;
  last_activity: string | null;
  last_activity_at: number | null;
}>> {
  const db = getDb();
  const STAGES: PipelineStage[] = ["lead", "contacted", "meeting", "proposal", "closed_won", "closed_lost"];

  // For each business, get the latest activity's pipeline_stage.
  // We include businesses WITHOUT a score too — the user just added
  // them via the radar and the score gets calculated in the background.
  // The card UI shows "—" for missing score/tier.
  //
  // The inner query also considers "pipeline_removed" activities so we
  // can tell when a business was just removed (its latest activity is
  // a removal marker). The outer WHERE then filters those out.
  const rows = db.prepare(
    `SELECT b.id as business_id, b.name as business_name, b.city,
            s.total_score, s.tier,
            a.pipeline_stage as stage,
            a.type as last_type,
            a.title as last_activity, a.created_at as last_activity_at
     FROM businesses b
     LEFT JOIN business_scores s ON s.business_id = b.id
     LEFT JOIN (
       SELECT business_id, pipeline_stage, type, title, created_at,
         ROW_NUMBER() OVER (PARTITION BY business_id ORDER BY created_at DESC) as rn
       FROM activities
       WHERE pipeline_stage IS NOT NULL OR type = 'pipeline_removed'
     ) a ON a.business_id = b.id AND a.rn = 1
     WHERE a.business_id IS NOT NULL
       AND a.type != 'pipeline_removed'
     ORDER BY
       CASE WHEN s.total_score IS NULL THEN 1 ELSE 0 END,
       s.total_score DESC NULLS LAST,
       a.created_at DESC`
  ).all() as any[];

  const kanban: Record<PipelineStage, any[]> = {
    lead: [], contacted: [], meeting: [], proposal: [], closed_won: [], closed_lost: [],
  };

  for (const row of rows) {
    const stage = (row.stage as PipelineStage) || "lead";
    if (kanban[stage]) {
      kanban[stage].push({
        business_id: row.business_id,
        business_name: row.business_name,
        city: row.city,
        total_score: row.total_score,
        tier: row.tier,
        last_activity: row.last_activity,
        last_activity_at: row.last_activity_at,
      });
    }
  }

  return kanban;
}
