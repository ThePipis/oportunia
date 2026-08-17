/**
 * API: /api/businesses/[id]/talking-points
 * POST - generate talking points using LLM
 *
 * Body (optional): { language: "es" | "en" }
 * Returns: { talkingPoints: TalkingPoint[], usedLlm: string, latencyMs: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { getBusiness } from "@/lib/db/repositories/businesses";
import { getScore } from "@/lib/db/repositories/scores";
import { getMatchedServices } from "@/lib/scoring/service-matcher";
import { chat } from "@/lib/llm/router";
import {
  buildTalkingPointsPrompt,
  TalkingPointsSchema,
  type TalkingPoint,
} from "@/lib/llm/prompts/talking-points";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const business = getBusiness(id);
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const language = (body.language === "en" ? "en" : "es") as "es" | "en";

    const score = getScore(id);
    const matchedServices = getMatchedServices(id);

    if (!score) {
      return NextResponse.json(
        { error: "Business has no score yet. Run /api/businesses/[id]/rescore first." },
        { status: 400 }
      );
    }

    const scoreData = JSON.parse(score.breakdown_json ?? "{}");

    const { system, user } = buildTalkingPointsPrompt({
      businessName: business.name,
      businessType: business.primary_type,
      city: business.city,
      state: business.state,
      rating: business.google_rating,
      reviewCount: business.review_count,
      hasWebsite: !!business.website,
      hasPhone: !!business.phone,
      hasEmail: !!business.email,
      score: scoreData,
      matchedServices,
      language,
    });

    const response = await chat(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      {
        requiresJson: true,
        complexity: 0.7, // Force Gemini if available
      }
    );

    // Parse and validate
    let talkingPoints: TalkingPoint[];
    try {
      // Try to extract JSON from the response (some LLMs add markdown)
      let jsonText = response.content.trim();
      const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
      if (jsonMatch) jsonText = jsonMatch[0];
      const parsed = JSON.parse(jsonText);
      talkingPoints = TalkingPointsSchema.parse(parsed);
    } catch (parseError: any) {
      console.error("Failed to parse LLM response:", parseError);
      return NextResponse.json(
        {
          error: "LLM output did not match expected schema",
          raw: response.content,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      talkingPoints,
      usedLlm: response.usedLlm,
      latencyMs: response.latencyMs,
    });
  } catch (error: any) {
    console.error("POST /api/businesses/[id]/talking-points failed:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to generate talking points" },
      { status: 500 }
    );
  }
}
