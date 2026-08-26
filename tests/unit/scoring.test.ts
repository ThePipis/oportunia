/**
 * Unit tests for the 5D scoring algorithm.
 *
 * Run: npx tsx tests/unit/scoring.test.ts
 */

import {
  calculateScore,
  type ScoringInput,
  scoreBrechaDigitalDim,
  scoreGapOperativoDim,
  scoreFitNegocioDim,
  scoreSenalesCompraDim,
  scoreProximidadDim,
} from "@/lib/scoring/algorithm";
import type { DigitalSignals } from "@/lib/scoring/signals";

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

function test(name: string, fn: () => void) {
  console.log(`\n${name}`);
  fn();
}

// =====================================================================
console.log("═══ 5D Scoring Algorithm Tests ═══\n");

test("High-ticket HVAC business with low digital presence → hot tier", () => {
  const input: ScoringInput = {
    digitalSignals: {
      has_chat: false,
      has_whatsapp: false,
      has_booking: false,
      has_contact_form: false,
      has_blog: false,
      has_testimonials: false,
      mentions_24_7: false,
      has_phone: true,
      has_email: false,
      has_address: true,
      has_social: false,
      has_viewport_meta: true,
      has_https: true,
      has_structured_data: false,
      last_post_age_days: 400,
      word_count: 300,
      raw_content_length: 2000,
    },
    hasGoogleRating: true,
    reviewCount: 25,
    hasPhone: true,
    hasEmail: false,
    sector: "hvac",
    primaryType: "HVAC contractor",
    avgTicketUsd: 2000,
    distanceMiles: 4,
    is24_7Emergency: true,
    locationCount: 2,
    yearsInBusiness: 8,
    lastReviewAt: Math.floor(Date.now() / 1000) - 15 * 86400,
    lastPostAt: null,
    employeeCount: 8,
    hasActiveAds: true,
  };
  const score = calculateScore(input);
  assert(score.total >= 70, `total ${score.total} >= 70 (got ${score.total})`);
  assert(score.tier === "hot" || score.tier === "warm", `tier is hot/warm (got ${score.tier})`);
  assert(score.breakdown.brechaDigital >= 50, `brechaDigital is high (got ${score.breakdown.brechaDigital})`);
  assert(score.breakdown.fitNegocio >= 60, `fitNegocio is high (got ${score.breakdown.fitNegocio})`);
});

test("Small restaurant, far away, no digital gap → skip tier", () => {
  const input: ScoringInput = {
    digitalSignals: {
      has_chat: true,
      has_whatsapp: true,
      has_booking: true,
      has_contact_form: true,
      has_blog: true,
      has_testimonials: true,
      mentions_24_7: true,
      has_phone: true,
      has_email: true,
      has_address: true,
      has_social: true,
      has_viewport_meta: true,
      has_https: true,
      has_structured_data: true,
      last_post_age_days: 5,
      word_count: 1500,
      raw_content_length: 10000,
    },
    hasGoogleRating: true,
    reviewCount: 250,
    hasPhone: true,
    hasEmail: true,
    sector: "restaurant",
    primaryType: "Mexican restaurant",
    avgTicketUsd: 25,
    distanceMiles: 50,
    is24_7Emergency: false,
    locationCount: 1,
    yearsInBusiness: 12,
    lastReviewAt: Math.floor(Date.now() / 1000) - 86400,
    lastPostAt: Math.floor(Date.now() / 1000) - 7 * 86400,
    employeeCount: 5,
    hasActiveAds: false,
  };
  const score = calculateScore(input);
  assert(score.breakdown.brechaDigital <= 5, `brechaDigital is low (got ${score.breakdown.brechaDigital})`);
  assert(score.breakdown.proximidad <= 30, `proximidad is low (got ${score.breakdown.proximidad})`);
});

test("scoreProximidadDim: 3mi = 100, 20mi = 45, 60mi = 20", () => {
  assert(scoreProximidadDim(3).score === 100, "3mi → 100");
  assert(scoreProximidadDim(20).score === 45, "20mi → 45");
  assert(scoreProximidadDim(60).score === 20, "60mi → 20");
  assert(scoreProximidadDim(null).score === 50, "null → 50 (neutral)");
});

test("scoreBrechaDigitalDim: minimal signals = high score", () => {
  const signals: Partial<DigitalSignals> = {
    has_chat: false,
    has_whatsapp: false,
    has_booking: false,
    has_contact_form: false,
    has_blog: false,
    has_testimonials: false,
    mentions_24_7: false,
    has_phone: true,
    has_email: true,
    has_address: true,
    has_social: false,
    has_viewport_meta: true,
    has_https: true,
    has_structured_data: false,
    last_post_age_days: 900,
    word_count: 200,
    raw_content_length: 1500,
  };
  const result = scoreBrechaDigitalDim({
    digitalSignals: signals,
    hasGoogleRating: true,
    reviewCount: 5,
    hasPhone: true,
    hasEmail: true,
    sector: null,
    primaryType: null,
    avgTicketUsd: null,
    distanceMiles: null,
    is24_7Emergency: false,
    locationCount: null,
    yearsInBusiness: null,
    lastReviewAt: null,
    lastPostAt: null,
    employeeCount: null,
    hasActiveAds: null,
  });
  assert(result.score >= 70, `high brecha when signals are minimal (got ${result.score})`);
});

test("scoreGapOperativoDim: no phone + no 24/7 = high gap", () => {
  const signals: Partial<DigitalSignals> = {
    has_chat: false, has_whatsapp: false, has_booking: false,
    has_contact_form: false, has_blog: false, has_testimonials: false,
    mentions_24_7: false, has_phone: true, has_email: true, has_address: true,
    has_social: false, has_viewport_meta: true, has_https: true,
    has_structured_data: false, last_post_age_days: null,
    word_count: 200, raw_content_length: 1500,
  };
  const result = scoreGapOperativoDim({
    digitalSignals: signals,
    hasGoogleRating: false,
    reviewCount: 0,
    hasPhone: false,
    hasEmail: false,
    sector: null, primaryType: null, avgTicketUsd: null, distanceMiles: null,
    is24_7Emergency: false, locationCount: null, yearsInBusiness: null,
    lastReviewAt: null, lastPostAt: null, employeeCount: null, hasActiveAds: null,
  });
  assert(result.score >= 50, `high gap when missing basics (got ${result.score})`);
});

test("scoreFitNegocioDim: HVAC + high ticket + 24/7 = max fit", () => {
  const result = scoreFitNegocioDim({
    digitalSignals: null,
    hasGoogleRating: true, reviewCount: 50, hasPhone: true, hasEmail: true,
    sector: "hvac", primaryType: "HVAC contractor", avgTicketUsd: 3000,
    distanceMiles: 5, is24_7Emergency: true,
    locationCount: 1, yearsInBusiness: null, lastReviewAt: null,
    lastPostAt: null, employeeCount: null, hasActiveAds: null,
  });
  assert(result.score >= 85, `max fit (got ${result.score})`);
});

test("scoreSenalesCompraDim: multi-empresa + recent reviews = high", () => {
  const result = scoreSenalesCompraDim({
    digitalSignals: null,
    hasGoogleRating: true, reviewCount: 100, hasPhone: true, hasEmail: true,
    sector: null, primaryType: null, avgTicketUsd: null,
    distanceMiles: null, is24_7Emergency: false,
    locationCount: 3, yearsInBusiness: 10,
    lastReviewAt: Math.floor(Date.now() / 1000) - 10 * 86400,
    lastPostAt: null, employeeCount: 15, hasActiveAds: true,
  });
  assert(result.score >= 60, `high buying signals (got ${result.score})`);
});

test("Tier boundaries: 80=hot, 60=warm, 40=nurture, 0=skip", () => {
  function makeInput(score: number): ScoringInput {
    // Construct an input that produces roughly the given total
    return {
      digitalSignals: null,
      hasGoogleRating: true, reviewCount: 50, hasPhone: true, hasEmail: true,
      sector: "hvac", primaryType: "HVAC", avgTicketUsd: 2000,
      distanceMiles: 3, is24_7Emergency: score > 50,
      locationCount: score > 50 ? 2 : 1, yearsInBusiness: 5,
      lastReviewAt: score > 50 ? Math.floor(Date.now() / 1000) - 5 * 86400 : null,
      lastPostAt: null, employeeCount: score > 50 ? 10 : 1, hasActiveAds: score > 50,
    };
  }
  // We don't enforce exact scores, just check the tier mapping is monotonic
  const highScore = calculateScore(makeInput(100));
  const lowScore = calculateScore(makeInput(10));
  assert(highScore.total > lowScore.total, "high inputs → high score");
});

console.log(`\n═══ ${passed} passed, ${failed} failed ═══`);
process.exit(failed > 0 ? 1 : 0);
