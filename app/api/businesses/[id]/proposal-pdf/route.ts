/**
 * API: /api/businesses/[id]/proposal-pdf
 * GET / POST - generate and return a PDF attachment for the customized proposal
 */

import { NextRequest, NextResponse } from "next/server";
import { getBusiness } from "@/lib/db/repositories/businesses";
import { generateProposal, type GenerateProposalOptions } from "@/lib/proposals/generator";
import { generateProposalPDF } from "@/lib/proposals/pdf";

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
    const pdfBlob = generateProposalPDF(proposal);
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

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
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Content-Transfer-Encoding": "binary",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
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
    const pdfBlob = generateProposalPDF(proposal);
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

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
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Content-Transfer-Encoding": "binary",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("POST /api/businesses/[id]/proposal-pdf failed:", error);
    return NextResponse.json(
      { error: error.message ?? "PDF generation failed" },
      { status: 500 }
    );
  }
}
