/**
 * API: /api/businesses/[id]/proposal-pptx
 * GET - generate and return a PPTX Pitch Deck (6 slides) for the business
 */

import { NextRequest, NextResponse } from "next/server";
import { getBusiness } from "@/lib/db/repositories/businesses";
import { generateProposal, type GenerateProposalOptions } from "@/lib/proposals/generator";
import { generateProposalPPTX } from "@/lib/proposals/pptx";

export async function GET(
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

    const { searchParams } = new URL(request.url);
    const servicesParam = searchParams.get("services");
    const discountParam = searchParams.get("discount");
    const ticketParam = searchParams.get("ticket");

    const options: GenerateProposalOptions = {};
    if (servicesParam) {
      options.selectedServiceIds = servicesParam.split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (discountParam) {
      options.discountPercent = Number(discountParam);
    }
    if (ticketParam) {
      options.avgTicket = Number(ticketParam);
    }

    const proposal = generateProposal(id, options);
    const pptxBuffer = await generateProposalPPTX(proposal);

    const safeName = business.name
      .replace(/[^a-zA-Z0-9-_\s]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()
      .slice(0, 50);
    const filename = `pitch-deck-${safeName}.pptx`;

    return new NextResponse(new Uint8Array(pptxBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pptxBuffer.length.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("GET /api/businesses/[id]/proposal-pptx failed:", error);
    return NextResponse.json(
      { error: error.message ?? "PPTX generation failed" },
      { status: 500 }
    );
  }
}
