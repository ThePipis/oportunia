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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tool = getTool(id);
  if (!tool) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }
  return NextResponse.json({ tool });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Partial<NewTool>;
    const tool = updateTool(id, body);
    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }
    return NextResponse.json({ tool });
  } catch (error) {
    console.error("PUT /api/tools/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to update tool" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = deleteTool(id);
    if (!success) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/tools/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to delete tool" },
      { status: 500 }
    );
  }
}
