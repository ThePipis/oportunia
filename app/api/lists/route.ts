/**
 * API: /api/lists
 * GET  - list all lists
 *        Optional query param `business_id` — when present, each
 *        returned list is annotated with `contains_business: true|false`
 *        so the AddToListButton popover can mark which lists the
 *        business already belongs to (a business can be in many lists
 *        so this is per-list, not per-business).
 * POST - create a list
 */

import { NextRequest, NextResponse } from "next/server";
import { listLists, createList, isBusinessInList } from "@/lib/db/repositories/lists";

export async function GET(request: NextRequest) {
  const businessId = request.nextUrl.searchParams.get("business_id") || undefined;
  const lists = listLists();
  if (businessId) {
    for (const l of lists) {
      (l as any).contains_business = isBusinessInList(l.id, businessId);
    }
  }
  return NextResponse.json({ lists });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: "Missing name" }, { status: 400 });
    }
    const list = createList(body);
    return NextResponse.json({ list }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
