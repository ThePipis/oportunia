/**
 * API: /api/services
 * GET  - list services (optionally filter by tier)
 * PUT  - update a service
 */

import { NextRequest, NextResponse } from "next/server";
import { listServices, type NewService } from "@/lib/db/repositories/services";

export async function GET(request: NextRequest) {
  const tier = request.nextUrl.searchParams.get("tier");
  const activeOnly = request.nextUrl.searchParams.get("active") === "1";
  const services = listServices({
    tier: tier ? parseInt(tier, 10) : undefined,
    activeOnly,
  });
  return NextResponse.json({ services });
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as { id: string; patch: Partial<NewService> };
    if (!body.id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const { updateService } = await import("@/lib/db/repositories/services");
    const updated = updateService(body.id, body.patch);
    if (!updated) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    return NextResponse.json({ service: updated });
  } catch (error: any) {
    console.error("PUT /api/services failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
