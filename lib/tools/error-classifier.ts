/**
 * Tool Error Classifier
 *
 * Classifies errors from external API calls so the multi-account fallback
 * helper (lib/tools/fallback.ts) knows whether to:
 *   - try the next account with a cooldown
 *   - mark the current account as errored
 *   - give up entirely
 *
 * Works generically with any tool (Google Places, Yelp, Gemini, etc.) by
 * inspecting the HTTP status code and the error message text.
 *
 * The error message format expected from clients is
 *   "<Tool name> HTTP <status>: <body excerpt>"
 * but we also do plain-text fallback detection (RESOURCE_EXHAUSTED, quota,
 * rate limit, network errors) so non-conformant clients still work.
 */

export type ErrorKind = "transient" | "rate_limit" | "permanent" | "fatal";

export interface ClassifiedError {
  kind: ErrorKind;
  message: string;
  /** Extracted HTTP status code (0 if none) */
  status: number;
}

export function classifyError(err: unknown): ClassifiedError {
  const msg = err instanceof Error ? err.message : String(err);
  const statusMatch = msg.match(/HTTP\s+(\d{3})/);
  const status = statusMatch ? parseInt(statusMatch[1], 10) : 0;

  // -------------------------------------------------------------------------
  // Detect monthly quota / billing issues BEFORE generic 429 handling.
  // These should be treated as "permanent" so the account is marked as 'error'
  // and skipped until the admin re-enables it (no point retrying in 5 min —
  // the credit doesn't reset until next billing cycle).
  // -------------------------------------------------------------------------
  // Google's Maps Platform returns these patterns when $200/mo credit is gone:
  //   - 429 + "billing" in message
  //   - 429 + "OVER_QUERY_LIMIT" + per-day or per-month quota
  //   - 200/4xx with "billing not enabled" or "budget exceeded"
  const isBillingOrMonthly =
    /billing\s+(not\s+enabled|account|disabled)|budget\s+exceeded|payment\s+required|monthly\s+quota|quota\s+limit\s+exceeded\s+for\s+the\s+month|free\s+trial\s+has\s+ended/i.test(
      msg
    );
  if (isBillingOrMonthly) {
    return { kind: "permanent", message: msg, status };
  }

  if (status === 429) {
    // Per-minute or per-day rate limit (transient, retry after cooldown)
    // unless the message specifically indicates per-day or monthly
    if (/per\s+(day|month|project)|daily|monthly|PlacesAPIQueriesPerDayPerProject/i.test(msg)) {
      return { kind: "permanent", message: msg, status };
    }
    return { kind: "rate_limit", message: msg, status };
  }
  if (status === 408 || status === 500 || status === 502 || status === 503 || status === 504) {
    return { kind: "transient", message: msg, status };
  }
  if (status === 400) {
    // 400 is usually a malformed request — but with multi-account it can also
    // happen if the key has been disabled. Try next, mark error to be safe.
    return { kind: "permanent", message: msg, status };
  }
  if (status === 401 || status === 403) {
    return { kind: "permanent", message: msg, status };
  }
  if (/RESOURCE_EXHAUSTED|QUOTA_EXCEEDED|rate.?limit|quota/i.test(msg)) {
    return { kind: "rate_limit", message: msg, status };
  }
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|fetch failed|network|aborted|ETIMEDOUT|socket hang up/i.test(msg)) {
    return { kind: "transient", message: msg, status };
  }
  // Unknown — treat as transient (try the next account) but don't mark error
  return { kind: "transient", message: msg, status };
}
