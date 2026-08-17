/**
 * API: /api/tools
 * GET  - list all tool configurations
 * POST - create a new tool
 */

import { NextRequest, NextResponse } from "next/server";
import { listTools, createTool, type NewTool } from "@/lib/db/repositories/tools";

export async function GET() {
  try {
    const tools = listTools();
    return NextResponse.json({ tools });
  } catch (error) {
    console.error("GET /api/tools failed:", error);
    return NextResponse.json(
      { error: "Failed to list tools" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as NewTool;
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: "Missing required fields: name, type" },
        { status: 400 }
      );
    }
    const tool = createTool(body);
    return NextResponse.json({ tool }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tools failed:", error);
    return NextResponse.json(
      { error: "Failed to create tool" },
      { status: 500 }
    );
  }
}
