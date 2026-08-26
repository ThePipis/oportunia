/**
 * API: /api/businesses/[id]/proposal
 * GET - returns default structured proposal JSON
 * POST - returns dynamically recalculated proposal with selected services, discount, and custom ticket
 */

import { NextRequest, NextResponse } from "next/server";
import { getBusiness } from "@/lib/db/repositories/businesses";
import { generateProposal, type GenerateProposalOptions } from "@/lib/proposals/generator";

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
    const body = (await request.json()) as GenerateProposalOptions;
    const proposal = generateProposal(id, body);
    return NextResponse.json(proposal);
  } catch (error: any) {
    console.error("POST /api/businesses/[id]/proposal failed:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to recalculate proposal" },
      { status: 500 }
    );
  }
}
