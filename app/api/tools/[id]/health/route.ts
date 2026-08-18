/**
 * API: /api/tools/[id]/health
 * POST - Run a health check on the tool. For multi-key tools, checks ALL
 * active accounts and returns per-account results.
 */

import { NextRequest, NextResponse } from "next/server";
import { getTool, setToolStatus } from "@/lib/db/repositories/tools";
import { HEALTH_CHECKS, checkLocalLLM } from "@/lib/tools/health-checks";
import { listAccounts, markAccountUsed, markAccountRateLimited, markAccountError, getAccount } from "@/lib/db/repositories/tool-api-keys";
import { pingAccount } from "@/lib/tools/ping";
import { classifyError } from "@/lib/tools/error-classifier";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tool = getTool(id);
  if (!tool) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }

  if (!tool.api_key_encrypted && tool.supports_multiple_keys === 0 && tool.type !== "llm_endpoint") {
    return NextResponse.json(
      { error: "Tool has no API key configured" },
      { status: 400 }
    );
  }

  // Multi-key tool: ping every active account and return per-account results
  if (tool.supports_multiple_keys === 1) {
    const accounts = listAccounts(id);
    if (accounts.length === 0) {
      return NextResponse.json(
        { error: "No accounts configured" },
        { status: 400 }
      );
    }
    const perAccount: Array<{
      accountId: string;
      label: string | null;
      ok: boolean;
      latencyMs: number;
      error?: string;
    }> = [];
    let anyOk = false;
    let allPermanent = true;

    for (const acc of accounts) {
      if (acc.status === "disabled") {
        perAccount.push({ accountId: acc.id, label: acc.label, ok: false, latencyMs: 0, error: "Disabled" });
        continue;
      }
      const result = await pingAccount(acc.id);
      if (result.ok) {
        markAccountUsed(acc.id);
        anyOk = true;
        perAccount.push({ accountId: acc.id, label: acc.label, ok: true, latencyMs: result.latencyMs });
      } else {
        const cls = classifyError(new Error(result.error ?? "Unknown"));
        if (cls.kind === "rate_limit" || cls.kind === "transient") {
          markAccountRateLimited(acc.id, cls.message, 300);
        } else if (cls.kind === "permanent") {
          markAccountError(acc.id, cls.message);
        }
        if (cls.kind !== "permanent") allPermanent = false;
        perAccount.push({
          accountId: acc.id,
          label: acc.label,
          ok: false,
          latencyMs: result.latencyMs,
          error: result.error?.slice(0, 200),
        });
      }
    }

    if (anyOk) setToolStatus(tool.id, "active");
    else if (allPermanent && perAccount.length > 0) setToolStatus(tool.id, "error");
    else setToolStatus(tool.id, "rate_limited");

    return NextResponse.json({
      tool: tool.id,
      ok: anyOk,
      per_account: perAccount,
    });
  }

  // Single-key tool: use the existing per-tool health check
  let result;
  if (tool.type === "llm_endpoint") {
    const endpoint =
      tool.endpoint ?? process.env.LLM_LOCAL_URL ?? "http://srvubuntu01:8080";
    result = await checkLocalLLM(endpoint);
  } else if (HEALTH_CHECKS[tool.name]) {
    result = await HEALTH_CHECKS[tool.name](tool.api_key_encrypted!);
  } else {
    return NextResponse.json(
      { error: `No health check available for tool: ${tool.name}` },
      { status: 400 }
    );
  }

  if (result.ok) {
    setToolStatus(tool.id, "active");
  } else {
    setToolStatus(tool.id, "error");
  }

  return NextResponse.json({ tool: tool.id, ...result });
}
