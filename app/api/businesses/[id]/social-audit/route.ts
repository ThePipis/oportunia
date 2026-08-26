/**
 * API: /api/businesses/[id]/social-audit
 * GET & POST: Performs a 360° Social Footprint Audit using Agent-Reach.
 */

import { NextRequest, NextResponse } from "next/server";
import { getBusiness } from "@/lib/db/repositories/businesses";
import { auditBusinessSocialFootprint, SocialAuditResult } from "@/lib/tools/agent-reach";

// In-memory cache for fast subsequent visits
const socialAuditCache = new Map<string, SocialAuditResult>();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const business = getBusiness(id);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (socialAuditCache.has(id)) {
      return NextResponse.json({ audit: socialAuditCache.get(id) });
    }

    const audit = await auditBusinessSocialFootprint({
      id: business.id,
      name: business.name,
      website: business.website,
      city: business.city,
      primary_type: business.primary_type,
    });

    socialAuditCache.set(id, audit);
    return NextResponse.json({ audit });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to audit social footprint" },
      { status: 500 }
    );
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const business = getBusiness(id);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const audit = await auditBusinessSocialFootprint({
      id: business.id,
      name: business.name,
      website: business.website,
      city: business.city,
      primary_type: business.primary_type,
    });

    socialAuditCache.set(id, audit);
    return NextResponse.json({ audit });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to audit social footprint" },
      { status: 500 }
    );
  }
}
