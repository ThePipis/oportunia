/**
 * API: /api/businesses/batch-scores
 * POST - given an array of business IDs, returns the latest persisted scores and tiers from SQLite.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];

    if (ids.length === 0) {
      return NextResponse.json({ scores: {} });
    }

    const db = getDb();
    // Parameterized query for all requested IDs
    const placeholders = ids.map(() => "?").join(",");
    // Query scores
    const rows = db
      .prepare(
        `SELECT business_id, total_score, tier, last_calculated 
         FROM business_scores 
         WHERE business_id IN (${placeholders})`
      )
      .all(...ids) as Array<{
        business_id: string;
        total_score: number;
        tier: string;
        last_calculated: number;
      }>;

    // Query matched services from business_services
    const serviceRows = db
      .prepare(
        `SELECT bs.business_id, COUNT(DISTINCT bs.service_id) as services_count,
                GROUP_CONCAT(sc.name, '|||') as service_names,
                GROUP_CONCAT(COALESCE(sc.name_en, sc.name), '|||') as service_names_en
         FROM business_services bs
         JOIN service_catalog sc ON sc.id = bs.service_id AND sc.active = 1
         WHERE bs.business_id IN (${placeholders})
         GROUP BY bs.business_id`
      )
      .all(...ids) as Array<{
        business_id: string;
        services_count: number;
        service_names: string | null;
        service_names_en: string | null;
      }>;

    const servicesMap: Record<
      string,
      { count: number; names: string[]; namesEn: string[] }
    > = {};

    for (const s of serviceRows) {
      servicesMap[s.business_id] = {
        count: s.services_count,
        names: s.service_names ? s.service_names.split("|||") : [],
        namesEn: s.service_names_en ? s.service_names_en.split("|||") : [],
      };
    }

    const scoresMap: Record<
      string,
      {
        total_score: number;
        tier: string;
        last_calculated: number;
        matched_services_count: number;
        matched_service_names: string[];
        matched_service_names_en: string[];
      }
    > = {};

    for (const r of rows) {
      const s = servicesMap[r.business_id];
      const count = s && s.count > 0 ? s.count : (r.total_score >= 75 ? 3 : r.total_score >= 60 ? 2 : 1);
      const names = s && s.names.length > 0 ? s.names : (
        r.total_score >= 75 ? ["AI Appointment Setter 24/7", "Review Booster 5★", "Asistente Web Lead Magnet"] :
        r.total_score >= 60 ? ["Review Booster 5★", "AI Appointment Setter 24/7"] :
        ["Google Business & Review Booster"]
      );
      const namesEn = s && s.namesEn.length > 0 ? s.namesEn : (
        r.total_score >= 75 ? ["24/7 AI Appointment Setter", "5★ Review Booster", "Web Lead Magnet Assistant"] :
        r.total_score >= 60 ? ["5★ Review Booster", "24/7 AI Appointment Setter"] :
        ["Google Business & Review Booster"]
      );

      scoresMap[r.business_id] = {
        total_score: r.total_score,
        tier: r.tier,
        last_calculated: r.last_calculated,
        matched_services_count: count,
        matched_service_names: names,
        matched_service_names_en: namesEn,
      };
    }

    return NextResponse.json({ scores: scoresMap });
  } catch (error: any) {
    console.error("POST /api/businesses/batch-scores failed:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to fetch batch scores" },
      { status: 500 }
    );
  }
}
