/**
 * API: /api/businesses/[id]/full
 * GET - returns business + score + matched services in one call
 */

import { NextRequest, NextResponse } from "next/server";
import { getBusiness } from "@/lib/db/repositories/businesses";
import { getScore } from "@/lib/db/repositories/scores";
import { getMatchedServices } from "@/lib/scoring/service-matcher";

export async function GET(
  _request: NextRequest,
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
    const score = getScore(id);
    const matchedServices = getMatchedServices(id);

    return NextResponse.json({
      business,
      score,
      matchedServices,
    });
  } catch (error: any) {
    console.error("GET /api/businesses/[id]/full failed:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to load business" },
      { status: 500 }
    );
  }
}
