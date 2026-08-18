/**
 * API: /api/settings
 * GET - read all settings
 * PUT - update settings (merge)
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";

const SETTINGS_KEYS = [
  "company_name",
  "contact_email",
  "contact_phone",
  "origin_address",
  "origin_lat",
  "origin_lng",
  "default_llm_mode",
  "default_theme",
  "default_language",
];

export async function GET() {
  try {
    const db = getDb();
    const rows = db
      .prepare(`SELECT key, value FROM settings WHERE key IN (${SETTINGS_KEYS.map(() => "?").join(",")})`)
      .all(...SETTINGS_KEYS) as { key: string; value: string }[];

    const settings: Record<string, any> = {};
    for (const row of rows) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    }
    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error("GET /api/settings failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);
    const upsert = db.prepare(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    );
    for (const [key, value] of Object.entries(body)) {
      if (!SETTINGS_KEYS.includes(key)) continue;
      upsert.run(key, JSON.stringify(value), now);
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("PUT /api/settings failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
