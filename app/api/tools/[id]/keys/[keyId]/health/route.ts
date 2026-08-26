/**
 * API: /api/tools/[id]/keys/[keyId]/health
 * POST - ping a specific account (works for any tool, not just Gemini).
 *
 * The right protocol is inferred from the tool name in lib/tools/ping.ts.
 * Updates the account's status based on the result (rate_limited on 429,
 * error on 4xx, success clears any prior error).
 */

import { NextRequest, NextResponse } from "next/server";
import { getAccount, markAccountUsed, markAccountError, markAccountRateLimited } from "@/lib/db/repositories/tool-api-keys";
import { pingAccount } from "@/lib/tools/ping";
import { classifyError } from "@/lib/tools/error-classifier";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; keyId: string }> }
) {
  const { keyId } = await params;
  const account = getAccount(keyId);
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const result = await pingAccount(keyId);

  if (result.ok) {
    markAccountUsed(account.id);
    return NextResponse.json({
      ok: true,
      latencyMs: result.latencyMs,
      meta: result.meta,
      account: { ...getAccount(keyId), api_key_encrypted: undefined },
    });
  }

  // Classify the error and update account status accordingly
  const cls = classifyError(new Error(result.error ?? "Unknown"));
  if (cls.kind === "rate_limit") {
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
