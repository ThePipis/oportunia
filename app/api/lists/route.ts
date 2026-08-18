/**
 * API: /api/lists
 * GET  - list all lists
 * POST - create a list
 */

import { NextRequest, NextResponse } from "next/server";
import { listLists, createList } from "@/lib/db/repositories/lists";

export async function GET() {
  return NextResponse.json({ lists: listLists() });
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
