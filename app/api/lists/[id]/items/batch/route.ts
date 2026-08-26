/**
 * API: /api/lists/[id]/items/batch
 * POST - batch add an array of businessIds to a list in a single SQLite transaction
 * Body: { businessIds: string[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { getList, addBatchToList } from "@/lib/db/repositories/lists";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const list = getList(id);
    if (!list) {
      return NextResponse.json({ error: "Lista no encontrada" }, { status: 404 });
    }

    const body = await request.json();
    const businessIds = Array.isArray(body?.businessIds) ? body.businessIds : [];

    if (businessIds.length === 0) {
      return NextResponse.json(
        { error: "No se proporcionaron negocios para agregar" },
        { status: 400 }
      );
    }

    const { addedCount } = addBatchToList(id, businessIds);

    return NextResponse.json({
      ok: true,
      listId: id,
      listName: list.name,
      addedCount,
      totalSubmitted: businessIds.length,
    });
  } catch (error: any) {
    console.error("POST /api/lists/[id]/items/batch failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
