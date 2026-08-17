/**
 * API: /api/businesses/[id]/proposal
 * GET - returns the structured proposal JSON for in-app viewing/editing
 */

import { NextRequest, NextResponse } from "next/server";
import { getBusiness } from "@/lib/db/repositories/businesses";
import { generateProposal } from "@/lib/proposals/generator";

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
    const proposal = generateProposal(id);
    return NextResponse.json(proposal);
  } catch (error: any) {
    console.error("GET /api/businesses/[id]/proposal failed:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to generate proposal" },
      { status: 500 }
    );
  }
}
