/**
 * API: /api/llm/test
 * POST - test the LLM with a sample prompt
 * Body: { prompt: string, mode?: "local" | "gemini" | "auto" }
 */

import { NextRequest, NextResponse } from "next/server";
import { route } from "@/lib/llm/router";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt: string = body.prompt ?? "Say 'OportunIA ready' in one short sentence.";
    const mode = body.mode as "local" | "gemini" | "auto" | undefined;

    const response = await route(
      {
        messages: [
          {
            role: "system",
            content:
              "You are a concise assistant. Reply in 1 sentence, in the same language as the user.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 100,
      },
      { mode: mode ?? "auto" }
    );

    return NextResponse.json({
      ok: true,
      content: response.content,
      usedLlm: response.usedLlm,
      model: response.model,
      latencyMs: response.latencyMs,
      usage: response.usage,
    });
  } catch (error: any) {
    console.error("POST /api/llm/test failed:", error);
    return NextResponse.json(
      { ok: false, error: error.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
