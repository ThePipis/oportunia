/**
 * API: /api/tools/[id]/keys/[keyId]/health
 * POST - ping a specific Gemini account
 */

import { NextRequest, NextResponse } from "next/server";
import { getAccount, markAccountUsed, markAccountError, markAccountRateLimited } from "@/lib/db/repositories/tool-api-keys";
import { pingGeminiAccount, classifyError } from "@/lib/llm/router";
import { getTool } from "@/lib/db/repositories/tools";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; keyId: string }> }
) {
  const { keyId } = await params;
  const account = getAccount(keyId);
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  const tool = getTool(account.tool_id);

  const result = await pingGeminiAccount(keyId);

  if (result.ok) {
    markAccountUsed(account.id);
    return NextResponse.json({
      ok: true,
      latencyMs: result.latencyMs,
      account: { ...account, api_key_encrypted: undefined },
    });
  }

  // Classify the error and update account status accordingly
  const cls = classifyError(new Error(result.error ?? "Unknown"));
  if (cls.kind === "rate_limit" || cls.kind === "transient") {
    markAccountRateLimited(account.id, cls.message, 300);
  } else if (cls.kind === "permanent") {
    markAccountError(account.id, cls.message);
  }

  return NextResponse.json(
    {
      ok: false,
      latencyMs: result.latencyMs,
      error: result.error,
      account: { ...getAccount(keyId), api_key_encrypted: undefined },
    },
    { status: 200 } // 200 because the API call itself succeeded; the account is what's unhealthy
  );
}
