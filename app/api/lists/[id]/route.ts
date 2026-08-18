/**
 * API: /api/lists/[id]
 * GET    - get list with items
 * DELETE - delete list
 */

import { NextRequest, NextResponse } from "next/server";
import { getList, getListItems, deleteList } from "@/lib/db/repositories/lists";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const list = getList(id);
  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }
  const items = getListItems(id);
  return NextResponse.json({ list, items });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const success = deleteList(id);
  if (!success) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
