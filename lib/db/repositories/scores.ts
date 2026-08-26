/**
 * Business Scores Repository - CRUD for business_scores table.
 *
 * Stores the 5D scoring result for each business.
 */

import { getDb } from "../client";
import type { ScoreBreakdown } from "@/lib/scoring/algorithm";

export interface BusinessScore {
  business_id: string;
  total_score: number;
  score_brecha_digital: number;
  score_gap_operativo: number;
  score_fit_negocio: number;
  score_senales_compra: number;
  score_proximidad: number;
  breakdown_json: string | null;
  tier: "hot" | "warm" | "nurture" | "skip";
  reasoning_text: string | null;
  talking_points_json?: string | null;
  last_calculated: number;
}

export function getScore(businessId: string): BusinessScore | null {
  const db = getDb();
  return (
    db
      .prepare(`SELECT * FROM business_scores WHERE business_id = ?`)
      .get(businessId) as BusinessScore | undefined
  ) ?? null;
}

export function saveTalkingPoints(businessId: string, talkingPoints: any[]): void {
  const db = getDb();
  const exists = db.prepare(`SELECT business_id FROM business_scores WHERE business_id = ?`).get(businessId);
  const jsonStr = JSON.stringify(talkingPoints);

  if (exists) {
    db.prepare(`UPDATE business_scores SET talking_points_json = ? WHERE business_id = ?`).run(
      jsonStr,
      businessId
    );
  } else {
    db.prepare(`
      INSERT INTO business_scores (business_id, total_score, talking_points_json, last_calculated)
      VALUES (?, 0, ?, strftime('%s', 'now'))
    `).run(businessId, jsonStr);
  }
}

export function getTalkingPoints(businessId: string): any[] | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT talking_points_json FROM business_scores WHERE business_id = ?`)
    .get(businessId) as { talking_points_json: string | null } | undefined;
  if (!row?.talking_points_json) return null;
  try {
    const parsed = JSON.parse(row.talking_points_json);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function saveScore(businessId: string, score: ScoreBreakdown): BusinessScore {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  // Combine all reasoning into one text
  const reasoningText = [
    score.reasoning.brechaDigital,
    score.reasoning.gapOperativo,
    score.reasoning.fitNegocio,
    score.reasoning.senalesCompra,
    score.reasoning.proximidad,
  ].join(" | ");

  db.prepare(
    `INSERT INTO business_scores (
      business_id, total_score,
      score_brecha_digital, score_gap_operativo, score_fit_negocio,
      score_senales_compra, score_proximidad,
      breakdown_json, tier, reasoning_text, last_calculated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(business_id) DO UPDATE SET
      total_score = excluded.total_score,
      score_brecha_digital = excluded.score_brecha_digital,
      score_gap_operativo = excluded.score_gap_operativo,
      score_fit_negocio = excluded.score_fit_negocio,
      score_senales_compra = excluded.score_senales_compra,
      score_proximidad = excluded.score_proximidad,
      breakdown_json = excluded.breakdown_json,
      tier = excluded.tier,
      reasoning_text = excluded.reasoning_text,
      last_calculated = excluded.last_calculated`
  ).run(
    businessId,
    score.total,
    score.breakdown.brechaDigital,
    score.breakdown.gapOperativo,
    score.breakdown.fitNegocio,
    score.breakdown.senalesCompra,
    score.breakdown.proximidad,
    JSON.stringify(score),
    score.tier,
    reasoningText,
    now
  );

  return getScore(businessId)!;
}

export function deleteScore(businessId: string): boolean {
  const db = getDb();
  const result = db
    .prepare(`DELETE FROM business_scores WHERE business_id = ?`)
    .run(businessId);
  return result.changes > 0;
}
