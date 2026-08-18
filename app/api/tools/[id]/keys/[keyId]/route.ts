/**
 * API: /api/tools/[id]/keys/[keyId]
 * PATCH  - update label / api_key / status / quota_limit
 * DELETE - remove the account
 */

import { NextRequest, NextResponse } from "next/server";
import { getAccount, updateAccount, deleteAccount } from "@/lib/db/repositories/tool-api-keys";
import { pingGeminiAccount } from "@/lib/llm/router";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; keyId: string }> }
) {
  try {
    const { keyId } = await params;
    const body = (await request.json()) as {
      label?: string | null;
      api_key?: string;
      status?: "active" | "rate_limited" | "error" | "disabled" | "paused";
      quota_limit?: number | null;
    };
    const patch: any = {};
    if (body.label !== undefined) patch.label = body.label;
    if (body.api_key !== undefined) {
      if (body.api_key.length < 8) {
        return NextResponse.json(
          { error: "api_key must be at least 8 chars" },
          { status: 400 }
        );
      }
      patch.api_key = body.api_key.trim();
    }
    if (body.status !== undefined) patch.status = body.status;
    if (body.quota_limit !== undefined) patch.quota_limit = body.quota_limit;

    const updated = updateAccount(keyId, patch);
    if (!updated) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    return NextResponse.json({
      account: { ...updated, api_key_encrypted: undefined },
    });
  } catch (error) {
    console.error("PATCH /api/tools/[id]/keys/[keyId] failed:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; keyId: string }> }
) {
  try {
    const { keyId } = await params;
    const ok = deleteAccount(keyId);
    if (!ok) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/tools/[id]/keys/[keyId] failed:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
