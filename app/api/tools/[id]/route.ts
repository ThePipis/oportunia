/**
 * API: /api/tools/[id]
 * GET    - get one tool
 * PUT    - update a tool
 * DELETE - delete a tool
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getTool,
  updateTool,
  deleteTool,
  type NewTool,
} from "@/lib/db/repositories/tools";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tool = getTool(params.id);
  if (!tool) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }
  return NextResponse.json({ tool });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await request.json()) as Partial<NewTool>;
    const tool = updateTool(params.id, body);
    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }
    return NextResponse.json({ tool });
  } catch (error) {
    console.error(`PUT /api/tools/${params.id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to update tool" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = deleteTool(params.id);
    if (!success) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`DELETE /api/tools/${params.id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to delete tool" },
      { status: 500 }
    );
  }
}
