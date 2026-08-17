/**
 * API: /api/tools/[id]/health
 * POST - Run a health check on the tool's API key/endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { getTool, setToolStatus } from "@/lib/db/repositories/tools";
import { HEALTH_CHECKS, checkLocalLLM } from "@/lib/tools/health-checks";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tool = getTool(params.id);
  if (!tool) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }

  if (!tool.api_key_encrypted && tool.type !== "llm_endpoint") {
    return NextResponse.json(
      { error: "Tool has no API key configured" },
      { status: 400 }
    );
  }

  // Determine which health check to run
  let result;
  if (tool.type === "llm_endpoint") {
    // Local LLM endpoint: check via endpoint URL (not API key)
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

  // Update status based on result
  if (result.ok) {
    setToolStatus(tool.id, "active");
  } else {
    setToolStatus(tool.id, "error");
  }

  return NextResponse.json({ tool: tool.id, ...result });
}
