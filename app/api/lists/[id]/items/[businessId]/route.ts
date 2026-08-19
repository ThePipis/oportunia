/**
 * API: /api/lists/[id]/items/[businessId]
 * POST   - add a business to a list
 * DELETE - remove a business from a list
 *
 * Body for POST: { notes?: string }
 *
 * These endpoints are the bridge that lets the user add businesses
 * discovered in the radar to their saved lists (and remove them later).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  addToList,
  removeFromList,
  getList,
} from "@/lib/db/repositories/lists";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; businessId: string }> }
) {
  try {
    const { id, businessId } = await params;
    // Verify the list exists so we don't silently add to nothing
    const list = getList(id);
    if (!list) {
      return NextResponse.json({ error: "Lista no encontrada" }, { status: 404 });
    }

    // Optional notes from the request body
    let notes: string | undefined;
    try {
      const body = await request.json();
      if (typeof body?.notes === "string" && body.notes.trim()) {
        notes = body.notes.trim();
      }
    } catch {
      // empty body is fine
    }

    const { added } = addToList(id, businessId, notes);
    // 201 for a fresh add, 200 for a no-op duplicate — the body always
    // includes `added: boolean` so the AddToListButton popover can show
    // the right feedback ("Agregado" vs "Ya está en esta lista").
    return NextResponse.json(
      { ok: true, added, listId: id, businessId },
      { status: added ? 201 : 200 }
    );
  } catch (error: any) {
    console.error("POST /api/lists/[id]/items/[businessId] failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; businessId: string }> }
) {
  try {
    const { id, businessId } = await params;
    const removed = removeFromList(id, businessId);
    if (!removed) {
      return NextResponse.json(
        { error: "El negocio no estaba en esta lista" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE /api/lists/[id]/items/[businessId] failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
