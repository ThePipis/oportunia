/**
 * API: /api/radar/social-listening
 * GET: Returns real-time social intent leads.
 * POST: Converts a social lead directly into the CRM pipeline.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSocialIntentOpportunities } from "@/lib/tools/social-listening";
import { upsertBusiness } from "@/lib/db/repositories/businesses";
import { createActivity } from "@/lib/db/repositories/activities";
import { saveScore } from "@/lib/db/repositories/scores";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source") || "all";
    const intent = searchParams.get("intent") || "all";
    const niche = searchParams.get("niche") || "all";

    const opportunities = await getSocialIntentOpportunities({
      source,
      intent,
      niche,
    });

    return NextResponse.json({ opportunities });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch social opportunities" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { opportunity } = body;

    if (!opportunity || !opportunity.title) {
      return NextResponse.json({ error: "Missing opportunity payload" }, { status: 400 });
    }

    // 1. Create or upsert the business in the DB
    const cleanName = opportunity.businessName || `${opportunity.author.replace(/^[u@\/]+/, "")} (${opportunity.niche})`;
    const business = upsertBusiness({
      name: cleanName,
      address: opportunity.fullAddress || opportunity.street || opportunity.location || "California, CA",
      city: opportunity.city || opportunity.location.split(",")[0] || "Eastvale",
      state: opportunity.state || "CA",
      zip: opportunity.zipCode,
      lat: opportunity.lat,
      lng: opportunity.lng,
      distance_miles: opportunity.distanceMiles,
      phone: opportunity.phone,
      website: opportunity.website,
      source_url: opportunity.url,
      source_engine: `agent-reach-${opportunity.source}`,
      primary_type: opportunity.niche,
      google_rating: 4.8,
      review_count: 35,
    });

    // 2. Assign high opportunity Score (HOT Lead)
    saveScore(business.id, {
      total: opportunity.intentLevel === "hot" ? 94 : 82,
      tier: "hot",
      breakdown: {
        brechaDigital: 88,
        gapOperativo: 95,
        fitNegocio: 90,
        senalesCompra: 95,
        proximidad: 85,
      },
      reasoning: {
        brechaDigital: "Brecha omnicanal y redes",
        gapOperativo: "Fuga de leads fuera de horario",
        fitNegocio: "Servicio de alta demanda y ROI",
        senalesCompra: `Intención explícita en ${opportunity.sourceName}`,
        proximidad: "Cobertura regional",
      },
    });

    // 3. Move directly to CRM Pipeline as "lead"
    createActivity({
      business_id: business.id,
      type: "status_change",
      pipeline_stage: "lead",
      title: `⚡ Lead Social Inbound (${opportunity.sourceName})`,
      notes: `Captado por Agent-Reach Social Listening.\nPost: "${opportunity.title}"\nServicio sugerido: ${opportunity.matchedService} (~$${opportunity.estimatedTicket})`,
      status: "completed",
    });

    return NextResponse.json({ success: true, businessId: business.id });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to convert social opportunity" },
      { status: 500 }
    );
  }
}
