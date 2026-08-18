/**
 * API: /api/tools/[id]/keys
 * GET    - list accounts for a tool
 * POST   - add a new account
 * PUT    - bulk reorder (body: { order: string[] })
 */

import { NextRequest, NextResponse } from "next/server";
import { getTool } from "@/lib/db/repositories/tools";
import {
  listAccounts,
  addAccount,
  reorderAccounts,
} from "@/lib/db/repositories/tool-api-keys";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tool = getTool(id);
  if (!tool) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }
  const accounts = listAccounts(id);
  // Never leak the full key
  const safe = accounts.map((a) => ({
    ...a,
    api_key_masked:
      "••••••••" + (a.api_key_encrypted ? a.api_key_encrypted.slice(-4) : ""),
    api_key_encrypted: undefined,
  }));
  return NextResponse.json({ tool_id: id, accounts: safe });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tool = getTool(id);
    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }
    if (!tool.supports_multiple_keys) {
      return NextResponse.json(
        { error: "This tool does not support multiple API keys" },
        { status: 400 }
      );
    }
    const body = (await request.json()) as {
      label?: string;
      api_key?: string;
      quota_limit?: number;
    };
    if (!body.api_key || body.api_key.trim().length < 8) {
      return NextResponse.json(
        { error: "api_key is required (min 8 chars)" },
        { status: 400 }
      );
    }
    const account = addAccount(id, {
      label: body.label?.trim() || undefined,
      api_key: body.api_key.trim(),
      quota_limit: body.quota_limit,
    });
    // If the tool was unconfigured, mark it active now that we have a key
    if (tool.status === "unconfigured") {
      const { setToolStatus } = await import("@/lib/db/repositories/tools");
      setToolStatus(id, "active");
    }
    return NextResponse.json({ account: { ...account, api_key_encrypted: undefined } });
  } catch (error) {
    console.error("POST /api/tools/[id]/keys failed:", error);
    return NextResponse.json(
      { error: "Failed to add account" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { order?: string[] };
    if (!body.order || !Array.isArray(body.order)) {
      return NextResponse.json(
        { error: "order: string[] is required" },
        { status: 400 }
      );
    }
    reorderAccounts(id, body.order);
    const accounts = listAccounts(id);
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("PUT /api/tools/[id]/keys failed:", error);
    return NextResponse.json(
      { error: "Failed to reorder accounts" },
      { status: 500 }
    );
  }
}
