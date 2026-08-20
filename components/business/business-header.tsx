import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreBadge } from "@/components/scoring/score-badge";
import { StarRatingBreakdown } from "./star-rating-breakdown";

/**
 * Fields used by the header. Some are passed through from the
 * Business row (city/state/zip/email/hours_json/source_engine/…)
 * and some are derived from raw_data_json by the parent page
 * (openNow, weekdayDescriptions, businessStatus, priceLevel,
 * editorialSummary) so the component stays JSON-agnostic and
 * can be reused in other surfaces.
 */
export interface BusinessHeaderProps {
  business: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    phone: string | null;
    website: string | null;
    email: string | null;
    google_rating: number | null;
    review_count: number | null;
    /** Pre-parsed hours payload (or null). Shape:
     *  { openNow: boolean, weekdayDescriptions: string[] } */
    hours: {
      openNow: boolean | null;
      weekdayDescriptions: string[];
    } | null;
    primary_type: string | null;
    distance_miles: number | null;
    /** Pre-extracted from raw_data_json. null when unavailable. */
    priceLevel: string | null;
    businessStatus: string | null;
    editorialSummary: string | null;
    sourceEngine: string | null;
    /** Last-crawled timestamp (unix seconds). null when unknown. */
    lastCrawledAt: number | null;
  };
  score: {
    total: number;
    tier: "hot" | "warm" | "nurture" | "skip";
  } | null;
  /** Pre-parsed star breakdown JSON (or null). See StarRatingBreakdown. */
  reviewBreakdownJson: string | null;
}

const PRICE_LEVEL_LABEL: Record<string, string> = {
  PRICE_LEVEL_FREE: "Gratis",
  PRICE_LEVEL_INEXPENSIVE: "$ (Económico)",
  PRICE_LEVEL_MODERATE: "$$ (Moderado)",
  PRICE_LEVEL_EXPENSIVE: "$$$ (Caro)",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$ (Muy caro)",
};

const BUSINESS_STATUS_LABEL: Record<string, { text: string; tone: string }> = {
  OPERATIONAL: { text: "🟢 Operativo", tone: "text-emerald-300" },
  CLOSED_TEMPORARILY: { text: "🟠 Cerrado temporalmente", tone: "text-amber-300" },
  CLOSED_PERMANENTLY: { text: "🔴 Cerrado permanentemente", tone: "text-red-300" },
};

function timeAgo(unixSeconds: number | null): string {
  if (unixSeconds == null) return "";
  const diff = Math.floor(Date.now() / 1000) - unixSeconds;
  if (diff < 60) return "hace segundos";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 30) return `hace ${Math.floor(diff / 86400)} días`;
  if (diff < 86400 * 365) return `hace ${Math.floor(diff / 86400 / 30)} meses`;
  return `hace ${Math.floor(diff / 86400 / 365)} años`;
}

/**
 * "No disponible" — a single tiny component so we don't repeat the
 * "data not invented, here's the empty state" pattern in 6 places.
 * Renders a dashed "—" pill that the user can hover/click to see
 * a Google-search fallback. This is the same pattern used in the
 * radar results table for missing data.
 */
function MissingField({ label, fallbackHref }: { label: string; fallbackHref?: string | null }) {
  if (fallbackHref) {
    return (
      <a
        href={fallbackHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-dashed border-slate-700 text-slate-500 hover:text-sky-300 hover:border-sky-500/50 text-[12px]"
        title={`${label} no disponible — buscar en Google`}
      >
        <span aria-hidden="true">—</span>
        <span className="text-[10px] uppercase tracking-wide">no disponible</span>
      </a>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-dashed border-slate-700 text-slate-500 text-[12px]"
      title={`${label} no disponible`}
    >
      <span aria-hidden="true">—</span>
      <span className="text-[10px] uppercase tracking-wide">no disponible</span>
    </span>
  );
}

export function BusinessHeader({ business, score, reviewBreakdownJson }: BusinessHeaderProps) {
  // If address already includes the city/state, avoid showing them twice.
  const addressHasCity = business.address && business.city
    ? business.address.toLowerCase().includes(business.city.toLowerCase())
    : false;

  const fallbackSearch = (q: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(q)}`;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left: name + info */}
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-100 leading-tight">
                {business.name}
              </h1>
              {business.primary_type && (
                <p className="text-sm text-slate-400 mt-1 capitalize">
                  {business.primary_type.replace(/_/g, " ")}
                </p>
              )}
            </div>

            <div className="space-y-2 text-sm">
              {/* Address */}
              {business.address ? (
                <div className="flex items-start gap-2 text-slate-300">
                  <span className="text-slate-500 mt-0.5">📍</span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-sky-300"
                  >
                    {business.address}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-500">📍</span>
                  <MissingField
                    label="Dirección"
                    fallbackHref={fallbackSearch(`${business.name} dirección`)}
                  />
                </div>
              )}

              {/* City / State / Zip (only when not in address) */}
              {!addressHasCity && (business.city || business.state || business.zip) && (
                <div className="flex items-center gap-2 text-xs text-slate-500 ml-5">
                  <span>
                    {[
                      business.city,
                      business.state,
                      business.zip,
                    ].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}

              {/* Phone */}
              {business.phone ? (
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-500">📞</span>
                  <a href={`tel:${business.phone}`} className="hover:text-sky-300">
                    {business.phone}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-500">📞</span>
                  <MissingField
                    label="Teléfono"
                    fallbackHref={fallbackSearch(`${business.name} ${business.city ?? ""} teléfono`)}
                  />
                </div>
              )}

              {/* Email — high-value field the user asked for */}
              {business.email ? (
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-500">✉️</span>
                  <a
                    href={`mailto:${business.email}`}
                    className="hover:text-sky-300"
                    title={`Enviar email a ${business.email}`}
                  >
                    {business.email}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-500">✉️</span>
                  <MissingField
                    label="Email"
                    fallbackHref={fallbackSearch(`${business.name} ${business.city ?? ""} email contacto`)}
                  />
                </div>
              )}

              {/* Website */}
              {business.website ? (
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-500">🌐</span>
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-sky-300 truncate max-w-md"
                  >
                    {business.website}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-500">🌐</span>
                  <MissingField
                    label="Sitio web"
                    fallbackHref={fallbackSearch(`${business.name} ${business.city ?? ""} sitio web oficial`)}
                  />
                </div>
              )}

              {/* Hours */}
              {business.hours && business.hours.weekdayDescriptions.length > 0 ? (
                <div className="flex items-start gap-2 text-slate-300">
                  <span className="text-slate-500 mt-0.5">🕐</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {business.hours.openNow != null && (
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                            business.hours.openNow
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : "bg-slate-700/40 text-slate-400 border-slate-600/40"
                          }`}
                        >
                          {business.hours.openNow ? "Abierto ahora" : "Cerrado"}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">Horarios de hoy</span>
                    </div>
                    <details className="mt-1">
                      <summary className="text-[11px] text-slate-500 hover:text-slate-300 cursor-pointer select-none">
                        Ver todos los horarios
                      </summary>
                      <ul className="mt-1 space-y-0.5 text-[11px] text-slate-400">
                        {business.hours.weekdayDescriptions.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </details>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-500">🕐</span>
                  <MissingField
                    label="Horarios"
                    fallbackHref={fallbackSearch(`${business.name} ${business.city ?? ""} horarios`)}
                  />
                </div>
              )}

              {/* Business status (operational / closed) */}
              {business.businessStatus && business.businessStatus !== "OPERATIONAL" && (
                <div className="text-xs">
                  <span className={BUSINESS_STATUS_LABEL[business.businessStatus]?.tone ?? "text-slate-400"}>
                    {BUSINESS_STATUS_LABEL[business.businessStatus]?.text ?? business.businessStatus}
                  </span>
                </div>
              )}
            </div>

            {/* Rating row + star breakdown */}
            <div className="pt-2">
              <div className="flex items-center gap-4 flex-wrap">
                {business.google_rating !== null ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-400 text-lg">★</span>
                    <span className="font-bold text-slate-100 text-lg">
                      {business.google_rating.toFixed(1)}
                    </span>
                    {business.review_count !== null && (
                      <span className="text-xs text-slate-500">
                        ({business.review_count.toLocaleString()} reseñas)
                      </span>
                    )}
                  </div>
                ) : (
                  <MissingField
                    label="Rating"
                    fallbackHref={fallbackSearch(`${business.name} ${business.city ?? ""} google rating`)}
                  />
                )}

                {business.distance_miles !== null && (
                  <div className="flex items-center gap-1.5 text-sky-300">
                    <span>📏</span>
                    <span className="font-semibold">
                      {business.distance_miles.toFixed(1)} mi
                    </span>
                    <span className="text-xs text-slate-500">de Eastvale</span>
                  </div>
                )}

                {business.priceLevel && PRICE_LEVEL_LABEL[business.priceLevel] && (
                  <div className="text-xs text-slate-400">
                    💲 {PRICE_LEVEL_LABEL[business.priceLevel]}
                  </div>
                )}
              </div>

              {/* Star breakdown — bars 5★ to 1★, only if data is available */}
              {business.google_rating !== null && (
                <StarRatingBreakdown
                  breakdownJson={reviewBreakdownJson}
                  totalReviews={business.review_count}
                  businessName={business.name}
                  city={business.city}
                />
              )}
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-2 pt-3 flex-wrap">
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                >
                  📞 Llamar
                </a>
              )}
              {business.email && (
                <a
                  href={`mailto:${business.email}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30"
                >
                  ✉️ Email
                </a>
              )}
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30"
                >
                  🌐 Visitar web
                </a>
              )}
              {business.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
                >
                  🗺️ Google Maps
                </a>
              )}
            </div>

            {/* Editorial summary (Google's AI-generated description) */}
            {business.editorialSummary && (
              <div className="pt-2 border-t border-white/5 mt-2">
                <p className="text-xs text-slate-500 italic leading-relaxed">
                  “{business.editorialSummary}”
                  <span className="ml-1 text-slate-600 not-italic">— Google</span>
                </p>
              </div>
            )}

            {/* Footer meta: source + last updated */}
            {(business.sourceEngine || business.lastCrawledAt) && (
              <div className="pt-2 text-[10px] text-slate-600 uppercase tracking-wider flex items-center gap-3 flex-wrap">
                {business.sourceEngine && (
                  <span>Fuente: {business.sourceEngine}</span>
                )}
                {business.lastCrawledAt != null && (
                  <span title={new Date(business.lastCrawledAt * 1000).toLocaleString()}>
                    Actualizado {timeAgo(business.lastCrawledAt)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right: score badge */}
          {score && (
            <div className="flex flex-col items-center justify-center md:border-l md:border-white/10 md:pl-6">
              <ScoreBadge score={score.total} tier={score.tier} size="lg" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
