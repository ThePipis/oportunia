import { classifyError } from "../lib/tools/error-classifier";

// Cases that should be classified as "permanent" (billing/monthly quota)
// because retrying in 5 min won't help — the credit won't reset until next
// billing cycle. The account should be marked as 'error' and skipped.
const billingCases: Array<[string, "permanent" | "rate_limit" | "transient" | "fatal"]> = [
  // Google Maps $200/mo credit exhausted
  ['Google Places search HTTP 429: {"error":{"code":429,"message":"Rate Limit Exceeded","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaId":"PlacesAPIQueriesPerProject","quotaMetric":"Queries per month"}]}]}}', "permanent"],
  ['Google Places search HTTP 429: billing account has exceeded credit', "permanent"],
  ['Google Places search HTTP 429: payment required, billing not enabled', "permanent"],
  ['Google Places search HTTP 400: budget exceeded for project', "permanent"],
  ['Google Places search HTTP 429: monthly quota exceeded for project', "permanent"],
  ['Google Places search HTTP 429: free trial has ended', "permanent"],
  // Generic 429s without billing context are still per-minute rate limits
  ['Google Places search HTTP 429: {"violations":[{"quotaId":"PlacesAPIQueriesPerMinutePerProject","quotaMetric":"Queries per minute"}]}', "rate_limit"],
  ['Google Places search HTTP 429: rate limit exceeded', "rate_limit"],
  // Per-day rate limit
  ['Google Places search HTTP 429: per day limit reached', "permanent"],
];

// Cases that should NOT be treated as billing (transient rate limit etc.)
const transientCases: Array<[string, "permanent" | "rate_limit" | "transient" | "fatal"]> = [
  ["Google Places search HTTP 500: Internal Server Error", "transient"],
  ["Google Places search HTTP 503: Service Unavailable", "transient"],
  ["fetch failed (ECONNREFUSED)", "transient"],
  ["Google Places search HTTP 401: PERMISSION_DENIED", "permanent"],
];

let pass = 0, fail = 0;

console.log("=== Billing / monthly quota detection (should be 'permanent') ===");
for (const [msg, expected] of billingCases) {
  const result = classifyError(new Error(msg));
  const ok = result.kind === expected;
  if (ok) {
    pass++;
    console.log(`  ✓ [${expected}] "${msg.slice(0, 80).replace(/\n/g, " ")}..."`);
  } else {
    fail++;
    console.log(`  ✗ Expected ${expected}, got ${result.kind}`);
    console.log(`    "${msg.slice(0, 100)}..."`);
  }
}

console.log("\n=== Non-billing cases (should NOT be 'permanent' unless explicitly 4xx) ===");
for (const [msg, expected] of transientCases) {
  const result = classifyError(new Error(msg));
  const ok = result.kind === expected;
  if (ok) {
    pass++;
    console.log(`  ✓ [${expected}] "${msg.slice(0, 80)}..."`);
  } else {
    fail++;
    console.log(`  ✗ Expected ${expected}, got ${result.kind}`);
    console.log(`    "${msg}"`);
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
