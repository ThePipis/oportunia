import { classifyError } from "../lib/llm/router";

const cases: Array<[string, "transient" | "rate_limit" | "permanent" | "fatal"]> = [
  // Gemini error format: "Gemini HTTP {status}: {body}"
  ["Gemini HTTP 429: {\"error\":{\"code\":\"RESOURCE_EXHAUSTED\"}}", "rate_limit"],
  ["Gemini HTTP 400: {\"error\":{\"code\":\"INVALID_ARGUMENT\"}}", "permanent"],
  ["Gemini HTTP 401: {\"error\":{\"code\":\"UNAUTHENTICATED\"}}", "permanent"],
  ["Gemini HTTP 403: {\"error\":{\"code\":\"PERMISSION_DENIED\"}}", "permanent"],
  ["Gemini HTTP 500: Internal Server Error", "transient"],
  ["Gemini HTTP 502: Bad Gateway", "transient"],
  ["Gemini HTTP 503: Service Unavailable", "transient"],
  ["Gemini HTTP 504: Gateway Timeout", "transient"],
  ["Gemini HTTP 408: Request Timeout", "transient"],
  // Network errors
  ["fetch failed (ECONNREFUSED)", "transient"],
  ["aborted", "transient"],
  // Quota-related text
  ["API quota exceeded for this project", "rate_limit"],
  ["rate limit exceeded", "rate_limit"],
  // Unknown
  ["Something weird happened", "transient"],
];

let passed = 0;
let failed = 0;
for (const [msg, expected] of cases) {
  const result = classifyError(new Error(msg));
  const ok = result.kind === expected;
  if (ok) {
    passed++;
    console.log(`  ✓ "${msg.slice(0, 50)}" → ${result.kind}`);
  } else {
    failed++;
    console.log(`  ✗ "${msg.slice(0, 50)}" → expected ${expected}, got ${result.kind}`);
  }
}
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
