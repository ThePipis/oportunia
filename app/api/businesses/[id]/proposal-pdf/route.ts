/**
 * API: /api/businesses/[id]/proposal-pdf
 * GET - generate and return a PDF for the proposal
 */

import { NextRequest, NextResponse } from "next/server";
import { getBusiness } from "@/lib/db/repositories/businesses";
import { generateProposal } from "@/lib/proposals/generator";
import { generateProposalPDF } from "@/lib/proposals/pdf";

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
    const pdfBlob = generateProposalPDF(proposal);
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    // Sanitize filename
    const safeName = business.name
      .replace(/[^a-zA-Z0-9-_\s]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()
      .slice(0, 50);
    const filename = `propuesta-${safeName}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("GET /api/businesses/[id]/proposal-pdf failed:", error);
    return NextResponse.json(
      { error: error.message ?? "PDF generation failed" },
      { status: 500 }
    );
  }
}
