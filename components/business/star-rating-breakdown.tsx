"use client";

/**
 * StarRatingBreakdown — horizontal bars showing the count of
 * reviews per star level (5★, 4★, 3★, 2★, 1★), like Google Maps
 * shows on a business profile.
 *
 * Reads from a `review_breakdown_json` string of the shape
 *
 *   { "5": 42, "4": 10, "3": 3, "2": 1, "1": 0 }
 *
 * (or any other key shape: we render the keys in descending order).
 *
 * IMPORTANT — data source reality
 * --------------------------------
 * The Google Places API (New) BASIC endpoint does NOT return a
 * star-by-star breakdown. The full Place Details (with reviews)
 * endpoint does, but it's a separate call and we'd need to enable
 * the reviews field mask in the dev console. Until we wire that
 * up (or hook in Yelp Fusion, which DOES return this data
 * natively), the breakdown is unavailable and the component
 * shows an honest "No disponible" message — never an invented
 * count.
 *
 * We never fabricate data here. If the field is missing or
 * malformed, the user sees a clear "dato no disponible" line
 * with a "buscar en Google" link as a manual fallback, matching
 * the empty-cell pattern used elsewhere in the app.
 */

import * as React from "react";

export interface StarRatingBreakdownProps {
  /** JSON string with the breakdown. null/undefined → unavailable. */
  breakdownJson: string | null;
  /** Total review count (used to compute % bar widths). */
  totalReviews: number | null;
  /** Business name — used in the Google-search fallback href. */
  businessName?: string;
  /** City for a more targeted Google search. */
  city?: string | null;
}

interface ParsedBreakdown {
  /** Map of star level (1-5) → count. Missing levels are 0. */
  counts: Record<1 | 2 | 3 | 4 | 5, number>;
  /** True if at least one level had a non-zero count. */
  hasAny: boolean;
}

function parseBreakdown(json: string | null): ParsedBreakdown | null {
  if (!json || !json.trim()) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;

  // Accept any of these shapes:
  //   { "5": 42, "4": 10, ... }
  //   { "five_star": 42, ... }
  //   [ { "star": 5, "count": 42 }, ... ]
  //   { "rating_5": 42, "rating_4": 10, ... }
  const counts: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      if (item && typeof item === "object") {
        const it = item as Record<string, unknown>;
        const starRaw = it.star ?? it.rating ?? it.level;
        const countRaw = it.count ?? it.value ?? it.n;
        const star = Number(starRaw);
        const count = Number(countRaw);
        if (Number.isFinite(star) && star >= 1 && star <= 5 && Number.isFinite(count)) {
          counts[star as 1 | 2 | 3 | 4 | 5] = Math.max(0, Math.round(count));
        }
      }
    }
  } else {
    const map: Record<string, number> = {};
    const obj = parsed as Record<string, unknown>;
    for (const [k, v] of Object.entries(obj)) {
      const norm = k.toLowerCase().replace(/[^0-9]/g, "");
      if (!norm) continue;
      const star = Number(norm);
      if (Number.isFinite(star) && star >= 1 && star <= 5) {
        map[star] = Number(v);
      }
    }
    for (const [star, count] of Object.entries(map)) {
      const s = Number(star) as 1 | 2 | 3 | 4 | 5;
      const c = Number(count);
      if (Number.isFinite(c)) counts[s] = Math.max(0, Math.round(c));
    }
  }

  const hasAny = Object.values(counts).some((c) => c > 0);
  return { counts, hasAny };
}

function formatCount(n: number): string {
  // Compact format for big numbers, like Google Maps does.
  if (n >= 1000) {
    const k = n / 1000;
    return k.toFixed(k >= 10 ? 0 : 1) + "K";
  }
  return String(n);
}

export function StarRatingBreakdown({
  breakdownJson,
  totalReviews,
  businessName,
  city,
}: StarRatingBreakdownProps) {
  const parsed = React.useMemo(() => parseBreakdown(breakdownJson), [breakdownJson]);

  // Use the per-level counts as the source of truth for bar widths
  // (more accurate than computing % from the top-level total).
  const localTotal = parsed
    ? Object.values(parsed.counts).reduce((a, b) => a + b, 0)
    : 0;
  const maxBar = Math.max(localTotal, totalReviews ?? 0, 1);

  const fallbackHref =
    businessName
      ? `https://www.google.com/search?q=${encodeURIComponent(
          `${businessName}${city ? " " + city : ""} reseñas google maps`
        )}`
      : null;

  if (!parsed || !parsed.hasAny) {
    return (
      <div className="mt-2 text-[11px] text-slate-500 flex items-start gap-1.5">
        <span aria-hidden="true">ℹ️</span>
        <span>
          Desglose por estrellas no disponible.{" "}
          {fallbackHref ? (
            <a
              href={fallbackHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 underline decoration-dotted"
            >
              Buscar en Google →
            </a>
          ) : (
            "Requiere llamada adicional a Google Places API o Yelp Fusion."
          )}
        </span>
      </div>
    );
  }

  // Render 5★ first, 1★ last
  const rows: Array<{ star: 1 | 2 | 3 | 4 | 5; count: number }> = [
    { star: 5, count: parsed.counts[5] },
    { star: 4, count: parsed.counts[4] },
    { star: 3, count: parsed.counts[3] },
    { star: 2, count: parsed.counts[2] },
    { star: 1, count: parsed.counts[1] },
  ];

  return (
    <div className="mt-2.5 space-y-1.5" aria-label="Desglose de reseñas por estrellas">
      {rows.map((row) => {
        const pct = maxBar > 0 ? (row.count / maxBar) * 100 : 0;
        return (
          <div
            key={row.star}
            className="flex items-center gap-2 text-[11px] text-slate-400"
            aria-label={`${row.star} estrellas: ${row.count} reseñas`}
          >
            <span className="w-3 text-right font-mono text-slate-300">
              {row.star}
            </span>
            <span className="text-amber-400" aria-hidden="true">★</span>
            <div
              className="flex-1 h-1.5 rounded-full bg-slate-800/80 overflow-hidden"
              role="presentation"
            >
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
              />
            </div>
            <span className="w-10 text-right text-slate-500 font-mono">
              {formatCount(row.count)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
