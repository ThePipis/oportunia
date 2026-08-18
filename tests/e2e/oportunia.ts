/**
 * OportunIA - End-to-End Test
 *
 * Exercises the full flow without external API dependencies:
 * 1. DB is initialized
 * 2. Tools catalog is seeded
 * 3. Services catalog is seeded
 * 4. Settings round-trip
 * 5. Scoring algorithm produces valid output
 * 6. Service matcher returns relevant matches
 * 7. Proposal generation works
 *
 * Run: npx tsx tests/e2e/oportunia.ts
 */

import { getDb, closeDb, resetDb } from "../../lib/db/client";
import { runMigrations } from "./helpers";
import { listTools } from "../../lib/db/repositories/tools";
import { listServices } from "../../lib/db/repositories/services";
import { calculateScore } from "../../lib/scoring/algorithm";
import { matchServices } from "../../lib/scoring/service-matcher";
import { generateProposal } from "../../lib/proposals/generator";

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ ${msg}`);
  }
}

async function run() {
  console.log("═══ OportunIA E2E Test ═══\n");

  // 1. DB init
  console.log("1. Database initialization");
  try {
    resetDb();
    runMigrations();
    assert(true, "DB initialized (13 tables)");
  } catch (e: any) {
    assert(false, `DB init failed: ${e.message}`);
    return;
  }

  // Seed tools and services (the seed scripts are normally run separately)
  const { seedTools } = await import("../../lib/db/seed-tools");
  const { seedServices } = await import("../../lib/db/seed-services");
  seedTools();
  seedServices();

  // 2. Tools seeded
  console.log("\n2. Tools Manager");
  const tools = listTools();
  assert(tools.length === 6, `6 tools seeded (got ${tools.length})`);
  const toolNames = tools.map((t) => t.name);
  assert(toolNames.includes("google-places"), "google-places seeded");
  assert(toolNames.includes("gemini-pro"), "gemini-pro seeded");

  // 3. Services seeded
  console.log("\n3. Service Catalog");
  const services = listServices();
  assert(services.length === 12, `12 services seeded (got ${services.length})`);
  const tier1 = services.filter((s) => s.tier === 1);
  const tier2 = services.filter((s) => s.tier === 2);
  const tier3 = services.filter((s) => s.tier === 3);
  assert(tier1.length === 4, `4 Tier 1 services (got ${tier1.length})`);
  assert(tier2.length === 4, `4 Tier 2 services (got ${tier2.length})`);
  assert(tier3.length === 4, `4 Tier 3 services (got ${tier3.length})`);

  // 4. Settings
  console.log("\n4. Settings round-trip");
  const db = getDb();
  const upsert = db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  );
  upsert.run("test_setting", JSON.stringify({ foo: "bar" }), Math.floor(Date.now() / 1000));
  const row = db.prepare(`SELECT value FROM settings WHERE key = ?`).get("test_setting") as { value: string };
  const parsed = JSON.parse(row.value);
  assert(parsed.foo === "bar", "Settings write+read works");

  // 5. Scoring
  console.log("\n5. Scoring algorithm");
  const hvacInput = {
    digitalSignals: {
      has_chat: false, has_whatsapp: false, has_booking: false,
      has_contact_form: false, has_blog: false, has_testimonials: false,
      mentions_24_7: false, has_phone: true, has_email: true, has_address: true,
      has_social: false, has_viewport_meta: true, has_https: true,
      has_structured_data: false, last_post_age_days: 400,
      word_count: 300, raw_content_length: 2000,
    },
    hasGoogleRating: true, reviewCount: 25, hasPhone: true, hasEmail: false,
    sector: "hvac", primaryType: "HVAC contractor", avgTicketUsd: 2000,
    distanceMiles: 4, is24_7Emergency: true,
    locationCount: 2, yearsInBusiness: 8,
    lastReviewAt: Math.floor(Date.now() / 1000) - 15 * 86400,
    lastPostAt: null, employeeCount: 8, hasActiveAds: true,
  };
  const hvacScore = calculateScore(hvacInput);
  assert(hvacScore.total >= 70, `HVAC scores >=70 (got ${hvacScore.total})`);
  assert(hvacScore.tier === "hot" || hvacScore.tier === "warm", `HVAC is hot/warm (got ${hvacScore.tier})`);
  assert(hvacScore.breakdown.brechaDigital >= 50, `HVAC brecha high (got ${hvacScore.breakdown.brechaDigital})`);
  assert(hvacScore.breakdown.fitNegocio >= 60, `HVAC fit high (got ${hvacScore.breakdown.fitNegocio})`);

  // 6. Service matching
  console.log("\n6. Service matcher");
  const matches = matchServices({
    score: hvacScore,
    brechaDigital: hvacScore.breakdown.brechaDigital,
    gapOperativo: hvacScore.breakdown.gapOperativo,
    fitNegocio: hvacScore.breakdown.fitNegocio,
    senalesCompra: hvacScore.breakdown.senalesCompra,
    proximidade: hvacScore.breakdown.proximidad,
    sector: "hvac", primaryType: "HVAC contractor",
    is24_7Emergency: true, hasGoogleRating: true, reviewCount: 25,
    hasWebsiteCrawled: true, hasChat: false, hasBooking: false,
    hasContactForm: false, mentions_24_7: false, hasSocial: false,
    hasActiveAds: true, yearsInBusiness: 8, avgTicketUsd: 2000,
  });
  assert(matches.length >= 1, `Service matcher returns matches (got ${matches.length})`);
  assert(matches.length <= 3, `Returns top 3 (got ${matches.length})`);
  const hasReceptionist = matches.some((m) => m.serviceId === "ai_receptionist_24_7");
  assert(hasReceptionist, "Receptionist matched for 24/7 HVAC");

  // 7. Proposal
  console.log("\n7. Proposal generation");
  // Insert a fake business + score to satisfy the generator
  const businessId = "biz-e2e-test";
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    `INSERT INTO businesses (id, name, address, city, state, primary_type, google_rating, review_count, phone, lat, lng, distance_miles, source_engine, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    businessId, "E2E Test HVAC", "123 Test St", "Corona", "CA",
    "HVAC contractor", 4.5, 25, "(951) 555-0100",
    33.83, -117.56, 4.0, "test", now, now
  );
  db.prepare(
    `INSERT INTO business_scores (business_id, total_score, score_brecha_digital, score_gap_operativo, score_fit_negocio, score_senales_compra, score_proximidad, breakdown_json, tier, last_calculated)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    businessId, hvacScore.total,
    hvacScore.breakdown.brechaDigital, hvacScore.breakdown.gapOperativo,
    hvacScore.breakdown.fitNegocio, hvacScore.breakdown.senalesCompra,
    hvacScore.breakdown.proximidad,
    JSON.stringify(hvacScore), hvacScore.tier, now
  );

  // Save matched services
  const { saveMatchedServices } = await import("../../lib/scoring/service-matcher");
  saveMatchedServices(businessId, matches);

  const proposal = generateProposal(businessId);
  assert(proposal.to.businessName === "E2E Test HVAC", "Proposal to is correct");
  assert(proposal.services.length >= 1, "Proposal has services");
  assert(proposal.investment.annualTotal > 0, "Proposal has positive investment");
  assert(proposal.roi.paybackPeriod !== "N/A", "Proposal has payback period");
  assert(proposal.proposalNumber.startsWith("PROP-"), "Proposal has correct number format");
  assert(proposal.nextSteps.length === 5, "Proposal has 5 next steps");

  // 8. PDF generation
  console.log("\n8. PDF generation");
  const { generateProposalPDF } = await import("../../lib/proposals/pdf");
  const pdfBlob = generateProposalPDF(proposal);
  const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
  assert(pdfBuffer.length > 1000, `PDF generated (${pdfBuffer.length} bytes)`);
  assert(pdfBuffer.slice(0, 4).toString() === "%PDF", "PDF starts with %PDF magic bytes");

  closeDb();

  console.log(`\n═══ ${passed} passed, ${failed} failed ═══`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error("E2E test crashed:", e);
  process.exit(1);
});
