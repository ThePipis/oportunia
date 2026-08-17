/**
 * Service Matcher - matches a business to the 1-3 best AI services.
 *
 * Uses a simple rules-based system based on the 5D score breakdown
 * and business signals.
 */

import { getDb } from "@/lib/db/client";
import type { ScoreBreakdown } from "./algorithm";

export interface MatchedService {
  serviceId: string;
  serviceName: string;
  serviceIcon: string;
  serviceTier: number;
  relevance: number; // 0-100
  reasoning: string;
  pitch: string;
  pitchEn: string;
  priceSetup: number;
  priceMonthly: number;
}

interface ServiceRow {
  id: string;
  tier: number;
  name: string;
  name_en: string;
  icon: string | null;
  signals_json: string | null;
  pitch_template: string;
  pitch_template_en: string;
  price_setup: number;
  price_monthly: number;
  active: number;
}

export interface MatchInput {
  /** Pre-computed 5D score */
  score: ScoreBreakdown;
  /** Direct accessors for the 5 dimensions */
  brechaDigital: number;
  gapOperativo: number;
  fitNegocio: number;
  senalesCompra: number;
  proximidad: number;
  /** Business sector (hvac, plumbing, dental, etc.) */
  sector: string | null;
  /** Business primary type from Google */
  primaryType: string | null;
  /** Is 24/7 emergency business */
  is24_7Emergency: boolean;
  /** Has Google reviews */
  hasGoogleRating: boolean;
  /** Number of Google reviews */
  reviewCount: number | null;
  /** Has website (we crawled it) */
  hasWebsiteCrawled: boolean;
  /** Did we detect chat widget */
  hasChat: boolean;
  /** Did we detect booking */
  hasBooking: boolean;
  /** Did we detect contact form */
  hasContactForm: boolean;
  /** Did we detect 24/7 mention */
  mentions_24_7: boolean;
  /** Has social media presence */
  hasSocial: boolean;
  /** Has active ads detected */
  hasActiveAds: boolean;
  /** Years in business */
  yearsInBusiness: number | null;
  /** Estimated ticket size */
  avgTicketUsd: number | null;
}

export function matchServices(input: MatchInput): MatchedService[] {
  const db = getDb();
  const services = db
    .prepare(`SELECT * FROM service_catalog WHERE active = 1`)
    .all() as ServiceRow[];

  const matches: MatchedService[] = [];

  for (const svc of services) {
    const signals: string[] = JSON.parse(svc.signals_json ?? "[]");
    let relevance = 0;
    const reasons: string[] = [];

    // High brecha digital → AI Web Chat, AI Review Booster
    if (input.brechaDigital >= 60) {
      if (svc.id === "ai_review_booster") {
        relevance += 30;
        reasons.push("alta brecha digital detectada");
      }
      if (svc.id === "ai_web_chat_24_7") {
        relevance += 25;
        reasons.push("sin chat en web");
      }
      if (svc.id === "ai_content_social") {
        relevance += 15;
        reasons.push("redes sociales inactivas");
      }
    }

    // High gap operativo → Receptionist, Speed-to-Lead
    if (input.gapOperativo >= 60) {
      if (svc.id === "ai_receptionist_24_7") {
        relevance += 35;
        reasons.push("alto gap operativo");
      }
      if (svc.id === "speed_to_lead") {
        relevance += 25;
        reasons.push("responde leads tarde");
      }
      if (svc.id === "ai_appointment_setter") {
        relevance += 20;
        if (!input.hasBooking) reasons.push("sin booking online");
      }
    }

    // 24/7 emergency business → Receptionist
    if (input.is24_7Emergency && svc.id === "ai_receptionist_24_7") {
      relevance += 30;
      reasons.push("es negocio de emergencia");
    }

    // High ticket + active ads → Ads Optimization
    if (input.hasActiveAds && input.avgTicketUsd && input.avgTicketUsd >= 1000) {
      if (svc.id === "ai_ads_optimization") {
        relevance += 35;
        reasons.push("invierte en ads con ticket alto");
      }
    }

    // Many reviews → Reputation Manager
    if (input.reviewCount !== null && input.reviewCount >= 50) {
      if (svc.id === "ai_reputation_manager") {
        relevance += 30;
        reasons.push(`${input.reviewCount} reseñas que gestionar`);
      }
    }

    // Few reviews → Review Booster
    if (input.reviewCount !== null && input.reviewCount < 10) {
      if (svc.id === "ai_review_booster") {
        relevance += 25;
        reasons.push(`solo ${input.reviewCount} reseñas`);
      }
    }

    // Established business (3+ years) → Outbound Reactivator
    if (input.yearsInBusiness !== null && input.yearsInBusiness >= 3) {
      if (svc.id === "ai_outbound_reactivator") {
        relevance += 30;
        reasons.push(`${input.yearsInBusiness} años de clientes pasados reactivables`);
      }
      if (svc.id === "ai_follow_up_nurture") {
        relevance += 15;
      }
    }

    // Multi-tech or 24/7 → Dispatching
    if (input.is24_7Emergency && svc.id === "ai_dispatching_routing") {
      relevance += 20;
      reasons.push("negocio de despacho");
    }

    // Service business with contact form → Follow-Up Nurture
    if (input.hasContactForm && svc.id === "ai_follow_up_nurture") {
      relevance += 20;
      reasons.push("genera leads pero no los nurtures");
    }

    // If service signals array matches generic "mentions_24_7" etc.
    for (const sig of signals) {
      if (sig === "mentions_24_7" && !input.mentions_24_7 && svc.id === "ai_receptionist_24_7") {
        relevance += 10;
        reasons.push("no menciona 24/7 en su web");
      }
      if (sig === "has_phone" && !input.hasChat && svc.id === "ai_receptionist_24_7") {
        relevance += 5;
      }
    }

    // Tier-based relevance boost (Tier 1 is more accessible)
    if (svc.tier === 1) relevance += 5;

    // Cap at 100
    relevance = Math.min(100, relevance);

    // Only include if relevance >= 30
    if (relevance >= 30) {
      const pitch = customizePitch(svc.pitch_template, input);
      const pitchEn = customizePitch(svc.pitch_template_en, input);
      matches.push({
        serviceId: svc.id,
        serviceName: svc.name,
        serviceIcon: svc.icon ?? "🔧",
        serviceTier: svc.tier,
        relevance,
        reasoning: reasons.join("; ") || "Match general",
        pitch,
        pitchEn,
        priceSetup: svc.price_setup,
        priceMonthly: svc.price_monthly,
      });
    }
  }

  // Sort by relevance desc, return top 3
  matches.sort((a, b) => b.relevance - a.relevance);
  return matches.slice(0, 3);
}

/**
 * Personalize the pitch template with the business's actual data.
 */
function customizePitch(template: string, input: MatchInput): string {
  let pitch = template;
  // Could replace placeholders here in the future
  return pitch;
}

/**
 * Save matched services for a business to the database.
 */
export function saveMatchedServices(
  businessId: string,
  matches: MatchedService[]
): void {
  const db = getDb();
  // Clear existing matches
  db.prepare(`DELETE FROM business_services WHERE business_id = ?`).run(
    businessId
  );
  // Insert new ones
  const insert = db.prepare(
    `INSERT INTO business_services (
      business_id, service_id, relevance, reasoning, pitch, status
    ) VALUES (?, ?, ?, ?, ?, 'pending')`
  );
  for (const m of matches) {
    insert.run(
      businessId,
      m.serviceId,
      m.relevance,
      m.reasoning,
      m.pitch
    );
  }
}

export function getMatchedServices(businessId: string): MatchedService[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT bs.*, sc.name as service_name, sc.name_en, sc.icon, sc.tier,
              sc.price_setup, sc.price_monthly, sc.pitch_template, sc.pitch_template_en
       FROM business_services bs
       JOIN service_catalog sc ON sc.id = bs.service_id
       WHERE bs.business_id = ?
       ORDER BY bs.relevance DESC`
    )
    .all(businessId) as any[];

  return rows.map((r) => ({
    serviceId: r.service_id,
    serviceName: r.service_name,
    serviceIcon: r.icon ?? "🔧",
    serviceTier: r.tier,
    relevance: r.relevance,
    reasoning: r.reasoning ?? "",
    pitch: r.pitch ?? "",
    pitchEn: r.pitch_template_en ?? "",
    priceSetup: r.price_setup,
    priceMonthly: r.price_monthly,
  }));
}
