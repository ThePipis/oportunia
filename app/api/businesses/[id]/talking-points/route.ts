/**
 * API: /api/businesses/[id]/talking-points
 * POST - generate talking points using LLM
 *
 * Body (optional): { language: "es" | "en" }
 * Returns: { talkingPoints: TalkingPoint[], usedLlm: string, latencyMs: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { getBusiness } from "@/lib/db/repositories/businesses";
import { getScore, saveTalkingPoints, getTalkingPoints } from "@/lib/db/repositories/scores";
import { getMatchedServices } from "@/lib/scoring/service-matcher";
import { chat } from "@/lib/llm/router";
import {
  buildTalkingPointsPrompt,
  TalkingPointsSchema,
  type TalkingPoint,
} from "@/lib/llm/prompts/talking-points";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const talkingPoints = getTalkingPoints(id);
    return NextResponse.json({ talkingPoints: talkingPoints ?? [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Failed to fetch talking points" },
      { status: 500 }
    );
  }
}

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

    // Parse and validate with resilient fallback
    let talkingPoints: TalkingPoint[] = [];
    try {
      let raw = response.content.trim();
      // Strip markdown code blocks if present
      raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

      let parsed: any;
      const arrayMatch = raw.match(/\[[\s\S]*\]/);
      const objectMatch = raw.match(/\{[\s\S]*\}/);

      if (arrayMatch) {
        parsed = JSON.parse(arrayMatch[0]);
      } else if (objectMatch) {
        const obj = JSON.parse(objectMatch[0]);
        parsed = obj.talkingPoints || obj.points || obj.talking_points || [];
      } else {
        parsed = JSON.parse(raw);
      }

      if (Array.isArray(parsed)) {
        talkingPoints = parsed
          .map((item: any) => ({
            point: String(item.point || item.topic || "").trim(),
            because: String(item.because || item.reason || "").trim(),
            benefit: String(item.benefit || item.outcome || "").trim(),
          }))
          .filter((tp) => tp.point.length > 5);
      }
    } catch (parseError: any) {
      console.error("Failed to parse LLM talking points response:", parseError);
    }

    // If parsing was empty, synthesize from matched services so the UI never crashes
    if (talkingPoints.length === 0) {
      talkingPoints = matchedServices.slice(0, 3).map((svc) => ({
        point: `Oportunidad clave para implementar ${svc.serviceName} en su negocio.`,
        because: `porque el diagnóstico detectó que ${svc.reasoning}.`,
        benefit: `Incrementa su captación y ahorra tiempo operativo desde el primer mes.`,
      }));
    }

    // Persist to database so they survive reloads and tab switches
    saveTalkingPoints(id, talkingPoints);

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
