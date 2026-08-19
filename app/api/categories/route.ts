/**
 * GET  /api/categories?q=&limit=&exclude=
 * POST /api/categories { use_ids: string[] }  → increments usage_count
 *
 * Categories are searched in the local DB (seeded with 12 quick picks +
 * ~50 Google Places types). The autocomplete only returns VALID existing
 * categories — never allows adding arbitrary text like "fdniefreff".
 */
import { NextRequest, NextResponse } from "next/server";
import {
  searchCategories,
  listAll,
  listQuickPicks,
  listMostUsed,
  incrementUsageBatch,
} from "@/lib/db/repositories/categories";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const q = url.searchParams.get("q")?.trim() || "";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "8", 10) || 8, 50);
  const excludeParam = url.searchParams.get("exclude") || "";
  const mode = url.searchParams.get("mode") || "search"; // "search" | "all" | "quick" | "top"
  const exclude = new Set(excludeParam.split(",").map((s) => s.trim()).filter(Boolean));

  try {
    if (mode === "all") {
      const items = listAll();
      return NextResponse.json({ results: items });
    }
    if (mode === "quick") {
      const items = listQuickPicks();
      return NextResponse.json({ results: items });
    }
    if (mode === "top") {
      const items = listMostUsed(limit, exclude);
      return NextResponse.json({ results: items });
    }
    // default: search
    const results = searchCategories(q, limit, exclude);
    return NextResponse.json({ results });
  } catch (e: any) {
    return NextResponse.json(
      { results: [], error: e?.message || "search failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // POST is used to record usage after a successful search.
  // Body: { use_ids: string[] }
  let body: { use_ids?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const ids = Array.isArray(body?.use_ids)
    ? (body.use_ids.filter((x) => typeof x === "string") as string[])
    : [];
  if (ids.length === 0) {
    return NextResponse.json({ updated: 0 });
  }
  try {
    incrementUsageBatch(ids);
    return NextResponse.json({ updated: ids.length });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "usage update failed" },
      { status: 500 }
    );
  }
}
