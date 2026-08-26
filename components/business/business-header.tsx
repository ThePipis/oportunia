import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { translateCategory } from "@/lib/categories/category-i18n";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreBadge } from "@/components/scoring/score-badge";
import { StarRatingBreakdown } from "./star-rating-breakdown";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

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
    breakdown?: {
      brechaDigital: number;
      gapOperativo: number;
      fitNegocio: number;
      senalesCompra?: number;
      proximidad?: number;
    };
    reasoning?: {
      brechaDigital?: string;
      gapOperativo?: string;
      fitNegocio?: string;
    };
  } | null;
  /** Pre-parsed star breakdown JSON (or null). See StarRatingBreakdown. */
  reviewBreakdownJson: string | null;
}

const BUSINESS_STATUS_LABEL: Record<string, { text: string; tone: string }> = {
  OPERATIONAL: { text: "🟢 Operativo", tone: "text-emerald-300" },
  CLOSED_TEMPORARILY: { text: "🟠 Cerrado temporalmente", tone: "text-amber-300" },
  CLOSED_PERMANENTLY: { text: "🔴 Cerrado permanentemente", tone: "text-red-300" },
};

/**
 * "No disponible" — a single tiny component so we don't repeat the
 * "data not invented, here's the empty state" pattern in 6 places.
 * Renders a dashed "—" pill that the user can hover/click to see
 * a Google-search fallback. This is the same pattern used in the
 * radar results table for missing data.
 */
function MissingField({ label, fallbackHref, notAvailableText }: { label: string; fallbackHref?: string | null; notAvailableText: string }) {
  if (fallbackHref) {
    return (
      <a
        href={fallbackHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-dashed border-slate-300 bg-slate-50 text-slate-600 hover:text-sky-600 hover:border-sky-400 dark:border-slate-700 dark:bg-transparent dark:text-slate-400 dark:hover:text-sky-300 text-[12px] font-medium transition-colors"
        title={`${label} — ${notAvailableText}`}
      >
        <span aria-hidden="true">—</span>
        <span className="text-[10px] uppercase tracking-wide">{notAvailableText}</span>
      </a>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-dashed border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-transparent dark:text-slate-400 text-[12px] font-medium"
      title={`${label} — ${notAvailableText}`}
    >
      <span aria-hidden="true">—</span>
      <span className="text-[10px] uppercase tracking-wide">{notAvailableText}</span>
    </span>
  );
}

export function BusinessHeader({
  business,
  score,
  reviewBreakdownJson,
}: BusinessHeaderProps) {
  const { t, locale } = useT();
  const [isDiagnosticOpen, setIsDiagnosticOpen] = React.useState(false);
  const addressHasCity =
    Boolean(business.address && business.city && business.address.includes(business.city));

  const fallbackSearch = (query: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  const notAvailable = t("common.notAvailable", "No disponible");

  const formatRelativeTime = (unixSeconds: number | null): string => {
    if (unixSeconds == null) return "";
    const diff = Math.floor(Date.now() / 1000) - unixSeconds;
    if (diff < 60) return t("common.justNow", "hace segundos");
    if (diff < 3600) return t("common.minutesAgo", { count: Math.floor(diff / 60) }, `hace ${Math.floor(diff / 60)} min`);
    if (diff < 86400) return t("common.hoursAgo", { count: Math.floor(diff / 3600) }, `hace ${Math.floor(diff / 3600)} h`);
    if (diff < 86400 * 30) return t("common.daysAgo", { count: Math.floor(diff / 86400) }, `hace ${Math.floor(diff / 86400)} días`);
    if (diff < 86400 * 365) return t("common.monthsAgo", { count: Math.floor(diff / 86400 / 30) }, `hace ${Math.floor(diff / 86400 / 30)} meses`);
    return t("common.yearsAgo", { count: Math.floor(diff / 86400 / 365) }, `hace ${Math.floor(diff / 86400 / 365)} años`);
  };

  return (
    <Card className="border-slate-200 dark:border-white/10">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          {/* Left: primary info */}
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-900 dark:text-slate-100 leading-tight">
                {business.name}
              </h1>
              {business.primary_type && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
                  {translateCategory(business.primary_type, locale)}
                </p>
              )}
            </div>

            <div className="space-y-2 text-sm">
              {/* Address */}
              {business.address ? (
                <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-slate-400 mt-0.5">📍</span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-sky-600 dark:hover:text-sky-300 transition-colors"
                  >
                    {business.address}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-slate-400">📍</span>
                  <MissingField
                    label={t("radar.address", "Dirección")}
                    notAvailableText={notAvailable}
                    fallbackHref={fallbackSearch(`${business.name} dirección`)}
                  />
                </div>
              )}

              {/* City / State / Zip (only when not in address) */}
              {!addressHasCity && (business.city || business.state || business.zip) && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 ml-5 font-medium">
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
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-slate-400">📞</span>
                  <a href={`tel:${business.phone}`} className="hover:text-sky-600 dark:hover:text-sky-300 transition-colors font-medium">
                    {business.phone}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-slate-400">📞</span>
                  <MissingField
                    label={t("radar.phone", "Teléfono")}
                    notAvailableText={notAvailable}
                    fallbackHref={fallbackSearch(`${business.name} ${business.city ?? ""} teléfono`)}
                  />
                </div>
              )}

              {/* Email — high-value field the user asked for */}
              {business.email ? (
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-slate-400">✉️</span>
                  <a
                    href={`mailto:${business.email}`}
                    className="hover:text-sky-600 dark:hover:text-sky-300 transition-colors font-medium"
                    title={`Email: ${business.email}`}
                  >
                    {business.email}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-slate-400">✉️</span>
                  <MissingField
                    label={t("common.email", "Email")}
                    notAvailableText={notAvailable}
                    fallbackHref={fallbackSearch(`${business.name} ${business.city ?? ""} email contacto`)}
                  />
                </div>
              )}

              {/* Website */}
              {business.website ? (
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-slate-400">🌐</span>
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-sky-600 dark:hover:text-sky-300 truncate max-w-[200px] sm:max-w-md transition-colors font-medium"
                  >
                    {business.website}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-slate-400">🌐</span>
                  <MissingField
                    label={t("radar.website", "Sitio web")}
                    notAvailableText={notAvailable}
                    fallbackHref={fallbackSearch(`${business.name} ${business.city ?? ""} sitio web oficial`)}
                  />
                </div>
              )}

              {/* Hours */}
              {business.hours && business.hours.weekdayDescriptions.length > 0 ? (
                <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-slate-400 mt-0.5">🕐</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {business.hours.openNow != null && (
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                            business.hours.openNow
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30"
                              : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700/40 dark:text-slate-400 dark:border-slate-600/40"
                          }`}
                        >
                          {business.hours.openNow ? t("common.openNow", "Abierto ahora") : t("common.closed", "Cerrado")}
                        </span>
                      )}
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t("common.todayHours", "Horarios de hoy")}</span>
                    </div>
                    <details className="mt-1">
                      <summary className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 cursor-pointer select-none">
                        {t("common.allHours", "Ver todos los horarios")}
                      </summary>
                      <ul className="mt-1 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                        {business.hours.weekdayDescriptions.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </details>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-slate-400">🕐</span>
                  <MissingField
                    label={t("common.hours", "Horarios")}
                    notAvailableText={notAvailable}
                    fallbackHref={fallbackSearch(`${business.name} ${business.city ?? ""} horarios`)}
                  />
                </div>
              )}

              {/* Business status (operational / closed) */}
              {business.businessStatus && business.businessStatus !== "OPERATIONAL" && (
                <div className="text-xs">
                  <span className={BUSINESS_STATUS_LABEL[business.businessStatus]?.tone ?? "text-slate-600 dark:text-slate-400"}>
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
                    <span className="text-amber-500 text-lg">★</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                      {business.google_rating.toFixed(1)}
                    </span>
                    {business.review_count !== null && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        ({business.review_count.toLocaleString()} {t("radar.reviews", "reseñas")})
                      </span>
                    )}
                  </div>
                ) : (
                  <MissingField
                    label={t("radar.rating", "Rating")}
                    notAvailableText={notAvailable}
                    fallbackHref={fallbackSearch(`${business.name} ${business.city ?? ""} google rating`)}
                  />
                )}

                {business.distance_miles !== null && (
                  <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-300 font-medium">
                    <span>📏</span>
                    <span className="font-semibold">
                      {business.distance_miles.toFixed(1)} mi
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{t("profile.fromLocation", { city: "Eastvale" }, "de Eastvale")}</span>
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 dark:hover:bg-emerald-500/30 transition-colors shadow-2xs"
                >
                  📞 {t("common.call", "Llamar")}
                </a>
              )}
              {business.email && (
                <a
                  href={`mailto:${business.email}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-violet-50 text-violet-800 border border-violet-200 hover:bg-violet-100 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30 dark:hover:bg-violet-500/30 transition-colors shadow-2xs"
                >
                  ✉️ {t("common.email", "Email")}
                </a>
              )}
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30 dark:hover:bg-sky-500/30 transition-colors shadow-2xs"
                >
                  🌐 {t("common.visitWeb", "Visitar web")}
                </a>
              )}
              {business.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 dark:hover:bg-amber-500/30 transition-colors shadow-2xs"
                >
                  🗺️ {t("common.openGoogleMaps", "Google Maps")}
                </a>
              )}
            </div>

            {/* Editorial summary (Google's AI-generated description) */}
            {business.editorialSummary && (
              <div className="pt-2 border-t border-slate-200 dark:border-white/5 mt-2">
                <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                  “{business.editorialSummary}”
                  <span className="ml-1 text-slate-500 dark:text-slate-500 not-italic font-medium">— Google</span>
                </p>
              </div>
            )}

            {/* Footer meta: source + last updated */}
            {(business.sourceEngine || business.lastCrawledAt) && (
              <div className="pt-2 text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-3 flex-wrap font-medium">
                {business.sourceEngine && (
                  <span>{t("common.source", "Fuente:")} {business.sourceEngine}</span>
                )}
                {business.lastCrawledAt != null && (
                  <span title={new Date(business.lastCrawledAt * 1000).toLocaleString()}>
                    {t("common.updated", "Actualizado")} {formatRelativeTime(business.lastCrawledAt)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right: score badge */}
          {score && (
            <div className="flex flex-col items-center justify-center md:border-l md:border-slate-200/80 md:dark:border-white/10 md:pl-6 shrink-0">
              <ScoreBadge score={score.total} tier={score.tier} size="lg" />
            </div>
          )}
        </div>

        {/* Diagnóstico Rápido 5D + Triaje Comercial (Plegable por Defecto) */}
        {score && score.breakdown && (
          <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-white/10 space-y-3">
            {/* Interactive Collapsible Header Bar */}
            <button
              type="button"
              onClick={() => setIsDiagnosticOpen((prev) => !prev)}
              aria-expanded={isDiagnosticOpen}
              className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/90 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-white/10 transition-all text-left group shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                <span className="text-base p-1 rounded-lg bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold shrink-0">
                  📊
                </span>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-display flex items-center gap-2 flex-wrap">
                    <span>{t("scoring.diagnosticSnapshotTitle", "Diagnóstico Rápido de OportunIA (Score 5D)")}</span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0",
                        score.tier === "hot" && "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30",
                        score.tier === "warm" && "bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30",
                        score.tier === "nurture" && "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30",
                        score.tier === "skip" && "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                      )}
                    >
                      {score.tier === "hot" && "🔥 HOT"}
                      {score.tier === "warm" && "⚡ WARM"}
                      {score.tier === "nurture" && "🌱 NURTURE"}
                      {score.tier === "skip" && "⚪ SKIP"}
                    </span>
                  </h3>
                  {/* Summary preview badges when collapsed */}
                  {!isDiagnosticOpen && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex-wrap font-medium">
                      <span>🌐 {t("scoring.digitalGap", "Brecha Digital")}: <strong className="text-orange-600 dark:text-orange-400">{score.breakdown.brechaDigital}%</strong></span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span>⏰ {t("scoring.operationalGap", "Gap Operativo")}: <strong className="text-amber-600 dark:text-amber-400">{score.breakdown.gapOperativo}%</strong></span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span>🎯 {t("scoring.businessFit", "Fit")}: <strong className="text-sky-600 dark:text-sky-400">{score.breakdown.fitNegocio}%</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Toggle indicator button */}
              <div className="flex items-center gap-1.5 shrink-0 text-xs font-semibold text-sky-600 dark:text-sky-400 group-hover:text-sky-700 dark:group-hover:text-sky-300">
                <span className="hidden sm:inline">
                  {isDiagnosticOpen
                    ? t("scoring.hideDiagnosticDetails", "Plegar diagnóstico")
                    : t("scoring.viewDiagnosticDetails", "Ver diagnóstico y triaje")}
                </span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    isDiagnosticOpen && "rotate-180 text-orange-500"
                  )}
                />
              </div>
            </button>

            {/* Collapsible Content */}
            {isDiagnosticOpen && (
              <div className="space-y-4 pt-1 animate-in fade-in-50 duration-200">
                {/* 3 Dimension Indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                      <span>🌐</span> {t("scoring.digitalGap", "Brecha Digital")}
                    </span>
                    <p className="text-lg font-extrabold text-orange-600 dark:text-orange-400 mt-1 font-display">
                      {score.breakdown.brechaDigital}%
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium leading-tight">
                      {t("scoring.brechaDigitalSubtitle", "Atraso web / sin chat / sin WhatsApp")}
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                      <span>⏰</span> {t("scoring.operationalGap", "Gap Operativo")}
                    </span>
                    <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-1 font-display">
                      {score.breakdown.gapOperativo}%
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium leading-tight">
                      {t("scoring.gapOperativoSubtitle", "Fuga de llamadas fuera de horario")}
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                      <span>🎯</span> {t("scoring.businessFit", "Fit del Negocio")}
                    </span>
                    <p className="text-lg font-extrabold text-sky-600 dark:text-sky-400 mt-1 font-display">
                      {score.breakdown.fitNegocio}%
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium leading-tight">
                      {t("scoring.fitNegocioSubtitle", "Ticket promedio y rentabilidad")}
                    </p>
                  </div>
                </div>

                {/* Estrategia Comercial & Triaje de Cierre (Score 5D Unificado) */}
                <div className="rounded-xl bg-slate-50/90 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-4 space-y-4 shadow-2xs">
                  {/* Header with Title & Context */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-sm font-bold">🎯</span>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-display">
                          {t("scoring.commercialStrategyTitle", "Estrategia Comercial & Triaje de Cierre (Score 5D)")}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {t("scoring.commercialStrategySubtitle", "Veredicto del prospecto y directiva de cierre para el socio comercial")}
                        </p>
                      </div>
                    </div>

                    {/* Active Tier Pill */}
                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t("scoring.currentStatus", "Diagnóstico:")}</span>
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-2xs",
                          score.tier === "hot" && "bg-amber-100/90 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30",
                          score.tier === "warm" && "bg-sky-100/90 text-sky-900 border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30",
                          score.tier === "nurture" && "bg-emerald-100/90 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30",
                          score.tier === "skip" && "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                        )}
                      >
                        {score.tier === "hot" && "🔥 HOT (75-100)"}
                        {score.tier === "warm" && "⚡ WARM (60-74)"}
                        {score.tier === "nurture" && "🌱 NURTURE (40-59)"}
                        {score.tier === "skip" && "⚪ SKIP (<40)"}
                      </span>
                    </div>
                  </div>

                  {/* Active Prospect Diagnostic & Strategic Directive */}
                  <div
                    className={cn(
                      "p-3.5 rounded-xl border transition-all shadow-xs",
                      score.tier === "hot" && "bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-500/30 text-amber-950 dark:text-amber-200",
                      score.tier === "warm" && "bg-sky-50/90 dark:bg-sky-950/30 border-sky-300 dark:border-sky-500/30 text-sky-950 dark:text-sky-200",
                      score.tier === "nurture" && "bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/30 text-emerald-950 dark:text-emerald-200",
                      score.tier === "skip" && "bg-slate-100/90 dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-xl shrink-0 mt-0.5">
                        {score.tier === "hot" ? "🔥" : score.tier === "warm" ? "⚡" : score.tier === "nurture" ? "🌱" : "⚪"}
                      </span>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h5 className="font-bold text-xs uppercase tracking-wide">
                            {score.tier === "hot" && t("scoring.activeHotHeadline", "Oportunidad de Alto Ticket · Cierre Inmediato")}
                            {score.tier === "warm" && t("scoring.activeWarmHeadline", "Lead Calificado con Fuga Operativa Clara")}
                            {score.tier === "nurture" && t("scoring.activeNurtureHeadline", "Oportunidad Moderada · Nurturing / Seguimiento")}
                            {score.tier === "skip" && t("scoring.activeSkipHeadline", "Baja Probabilidad de Conversión · Descartar")}
                          </h5>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/90 dark:bg-black/40 border border-current/20">
                            SCORE: {score.total}/100
                          </span>
                        </div>

                        <p className="text-xs leading-relaxed opacity-95 font-medium">
                          {score.tier === "hot" && t("scoring.activeHotDesc", "El negocio cuenta con ticket elevado, alta demanda de clientes y brechas evidentes de atención donde pierde ventas diariamente.")}
                          {score.tier === "warm" && t("scoring.activeWarmDesc", "Presenta dolor operativo claro (sin chat web 24/7 o respuesta fuera de horario). Excelente candidato para automatizaciones iniciales.")}
                          {score.tier === "nurture" && t("scoring.activeNurtureDesc", "El negocio opera de forma estándar pero su ticket o urgencia actual no justifican visitas presenciales inmediatas.")}
                          {score.tier === "skip" && t("scoring.activeSkipDesc", "Sector de muy bajo ticket, baja densidad de clientes o volumen insuficiente para amortizar soluciones de IA.")}
                        </p>

                        {/* Closing Action for the Sales Partner */}
                        <div className="pt-2.5 mt-1.5 border-t border-current/15 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 text-xs">
                          <span className="font-bold shrink-0 flex items-center gap-1 text-slate-900 dark:text-white">
                            💼 {t("scoring.actionDirectiveLabel", "Directiva para tu Socio:")}
                          </span>
                          <span className="font-bold leading-relaxed underline decoration-current/30 underline-offset-2 flex-1">
                            {score.tier === "hot" && t("scoring.activeHotAction", "Visitar hoy mismo en persona. Presentar el Pitch Deck y cerrar el piloto presencialmente.")}
                            {score.tier === "warm" && t("scoring.activeWarmAction", "Enviar mensaje WhatsApp personalizado y coordinar llamada de 10 min para demostración.")}
                            {score.tier === "nurture" && t("scoring.activeNurtureAction", "Incluir en lista de nutrición por email/WhatsApp y revisar nuevamente el próximo mes.")}
                            {score.tier === "skip" && t("scoring.activeSkipAction", "No invertir tiempo ni gasolina en prospección manual. Enfocarse en prospectos HOT/WARM.")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4-Tier Strategic Framework Matrix */}
                  <div className="pt-1">
                    <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span>📐</span> {t("scoring.matrixTitle", "Matriz de Triaje Comercial de la Agencia:")}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
                      {/* Tier HOT */}
                      <div
                        className={cn(
                          "p-2.5 rounded-lg border transition-all space-y-1 relative",
                          score.tier === "hot"
                            ? "bg-amber-100/80 dark:bg-amber-950/50 border-amber-400 dark:border-amber-500/50 ring-2 ring-amber-500/40 shadow-xs"
                            : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-85 hover:opacity-100"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                            🔥 HOT <span className="font-mono text-[10px] font-normal text-slate-500 dark:text-slate-400">[75-100]</span>
                          </span>
                          {score.tier === "hot" && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-500 text-white animate-pulse">
                              {t("scoring.activeBadge", "ACTUAL")}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[10.5px] leading-tight font-medium">
                          {t("scoring.matrixHotDesc", "Ticket alto + fuga de leads. Visita presencial hoy.")}
                        </p>
                      </div>

                      {/* Tier WARM */}
                      <div
                        className={cn(
                          "p-2.5 rounded-lg border transition-all space-y-1 relative",
                          score.tier === "warm"
                            ? "bg-sky-100/80 dark:bg-sky-950/50 border-sky-400 dark:border-sky-500/50 ring-2 ring-sky-500/40 shadow-xs"
                            : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-85 hover:opacity-100"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1">
                            ⚡ WARM <span className="font-mono text-[10px] font-normal text-slate-500 dark:text-slate-400">[60-74]</span>
                          </span>
                          {score.tier === "warm" && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-sky-500 text-white animate-pulse">
                              {t("scoring.activeBadge", "ACTUAL")}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[10.5px] leading-tight font-medium">
                          {t("scoring.matrixWarmDesc", "Dolor digital claro. Outreach inmediato por WhatsApp.")}
                        </p>
                      </div>

                      {/* Tier NURTURE */}
                      <div
                        className={cn(
                          "p-2.5 rounded-lg border transition-all space-y-1 relative",
                          score.tier === "nurture"
                            ? "bg-emerald-100/80 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-500/50 ring-2 ring-emerald-500/40 shadow-xs"
                            : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-85 hover:opacity-100"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            🌱 NURTURE <span className="font-mono text-[10px] font-normal text-slate-500 dark:text-slate-400">[40-59]</span>
                          </span>
                          {score.tier === "nurture" && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-500 text-white animate-pulse">
                              {t("scoring.activeBadge", "ACTUAL")}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[10.5px] leading-tight font-medium">
                          {t("scoring.matrixNurtureDesc", "Oportunidad media. Nutrición por email o goteo.")}
                        </p>
                      </div>

                      {/* Tier SKIP */}
                      <div
                        className={cn(
                          "p-2.5 rounded-lg border transition-all space-y-1 relative",
                          score.tier === "skip"
                            ? "bg-slate-200/90 dark:bg-slate-800 border-slate-400 dark:border-slate-600 ring-2 ring-slate-400 shadow-xs"
                            : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-85 hover:opacity-100"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            ⚪ SKIP <span className="font-mono text-[10px] font-normal text-slate-500 dark:text-slate-400">[&lt;40]</span>
                          </span>
                          {score.tier === "skip" && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-slate-500 text-white animate-pulse">
                              {t("scoring.activeBadge", "ACTUAL")}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[10.5px] leading-tight font-medium">
                          {t("scoring.matrixSkipDesc", "Sin urgencia ni ticket. Descartar de prospección.")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
