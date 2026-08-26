"use client";

import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { translateServiceReason } from "@/lib/scoring/score-i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessHeader } from "@/components/business/business-header";
import { ScoreBreakdown } from "@/components/scoring/score-breakdown";
import { SocialAuditCard } from "@/components/business/social-audit-card";
import AddToListButton from "@/components/map/add-to-list-button";
import AddToCrmButton from "@/components/map/add-to-crm-button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Business {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  google_rating: number | null;
  review_count: number | null;
  /** JSON string with hours: { openNow, weekdayDescriptions[], ... } */
  hours_json: string | null;
  primary_type: string | null;
  business_types: string | null;
  source_engine: string | null;
  last_crawled: number | null;
  sector_id: string | null;
  sector_confidence: number | null;
  distance_miles: number | null;
  /** Raw Google Places payload — has editorialSummary, businessStatus, priceLevel, etc. */
  raw_data_json: string | null;
}

interface PipelineStatus {
  in_pipeline: boolean;
  stage: string | null;
}

interface ScoreData {
  business_id: string;
  total_score: number;
  score_brecha_digital: number;
  score_gap_operativo: number;
  score_fit_negocio: number;
  score_senales_compra: number;
  score_proximidad: number;
  tier: "hot" | "warm" | "nurture" | "skip";
  reasoning_text: string | null;
  breakdown_json: string | null;
  last_calculated?: number;
}

interface MatchedService {
  serviceId: string;
  serviceName: string;
  serviceNameEn?: string;
  serviceIcon: string;
  serviceTier: number;
  relevance: number;
  reasoning: string;
  pitch: string;
  pitchEn: string;
  priceSetup: number;
  priceMonthly: number;
}

interface TalkingPoint {
  point: string;
  because: string;
  benefit: string;
}

const TIER_BADGE = {
  hot: "bg-amber-100/90 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30",
  warm: "bg-sky-100/90 text-sky-900 border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30",
  nurture: "bg-emerald-100/90 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30",
  skip: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

const TIER_LABEL = {
  hot: "🔥 HOT (75-100) · Cerrar esta semana",
  warm: "⚡ WARM (60-74) · Lead Calificado",
  nurture: "🌱 NURTURE (40-59) · Seguimiento",
  skip: "⚪ SKIP (<40) · Descartar",
};

export default function BusinessProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t, locale } = useT();
  const [business, setBusiness] = React.useState<Business | null>(null);
  const [score, setScore] = React.useState<ScoreData | null>(null);
  const [matchedServices, setMatchedServices] = React.useState<MatchedService[]>([]);
  const [isServicesOpen, setIsServicesOpen] = React.useState(false);
  const [talkingPoints, setTalkingPoints] = React.useState<TalkingPoint[]>([]);
  const [isTalkingPointsOpen, setIsTalkingPointsOpen] = React.useState(false);
  const [isScoreBreakdownOpen, setIsScoreBreakdownOpen] = React.useState(false);
  const [pipeline, setPipeline] = React.useState<PipelineStatus>({ in_pipeline: false, stage: null });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [rescoring, setRescoring] = React.useState(false);
  const [justUpdated, setJustUpdated] = React.useState(false);
  const [generatingTp, setGeneratingTp] = React.useState(false);
  const [tpError, setTpError] = React.useState<string | null>(null);

  const totalAnnualPotential = React.useMemo(() => {
    return matchedServices.reduce((sum, svc) => sum + (svc.priceSetup + svc.priceMonthly * 12), 0);
  }, [matchedServices]);

  // Unwrap the params promise
  const unwrappedParams = React.use(params);

  // Load business + score + matched services + pipeline status
  React.useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/businesses/${unwrappedParams.id}/full`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        const data = await res.json();
        setBusiness(data.business);
        setScore(data.score);
        setMatchedServices(data.matchedServices ?? []);
        setTalkingPoints(data.talkingPoints ?? []);
        setPipeline(data.pipeline ?? { in_pipeline: false, stage: null });
        setError(null);
      } catch (e: any) {
        setError(e.message ?? "Error al cargar negocio");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [unwrappedParams.id]);

  // Re-score
  const handleRescore = async () => {
    setRescoring(true);
    setJustUpdated(false);
    try {
      const res = await fetch(`/api/businesses/${unwrappedParams.id}/rescore`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      // Reload everything
      const fullRes = await fetch(`/api/businesses/${unwrappedParams.id}/full`);
      if (fullRes.ok) {
        const data = await fullRes.json();
        setScore(data.score);
        setMatchedServices(data.matchedServices ?? []);
        setTalkingPoints(data.talkingPoints ?? []);
        setPipeline(data.pipeline ?? { in_pipeline: false, stage: null });
        setJustUpdated(true);
        setTimeout(() => setJustUpdated(false), 3000);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRescoring(false);
    }
  };

  // Generate talking points
  const handleGenerateTp = async () => {
    setGeneratingTp(true);
    setTpError(null);
    try {
      const res = await fetch(
        `/api/businesses/${unwrappedParams.id}/talking-points`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: locale }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setTalkingPoints(data.talkingPoints ?? []);
      setIsTalkingPointsOpen(true);
    } catch (e: any) {
      setTpError(e.message);
    } finally {
      setGeneratingTp(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-radial flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-slate-400">Cargando negocio...</p>
        </div>
      </main>
    );
  }

  if (error || !business) {
    return (
      <main className="min-h-screen bg-gradient-radial p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="py-8 text-center">
              <p className="text-red-300 text-lg">⚠️ {error ?? "Negocio no encontrado"}</p>
              <a href="/radar" className="mt-4 inline-block text-sky-400 hover:text-sky-300">
                ← Volver al Radar
              </a>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Parse raw_data_json once to extract a few convenience fields
  // (hours, businessStatus, priceLevel, editorialSummary). We never
  // pass raw_data_json to the child — the child works with clean,
  // typed values. If the parse fails or the field is missing, the
  // child renders "No disponible" for that field.
  type RawExtras = {
    openNow?: boolean | null;
    weekdayDescriptions?: string[];
    businessStatus?: string | null;
    priceLevel?: string | null;
    editorialSummary?: string | null;
  };
  let rawExtras: RawExtras = {};
  if (business?.raw_data_json) {
    try {
      const raw = JSON.parse(business.raw_data_json);
      // Google Places stores hours in BOTH regularOpeningHours and
      // currentOpeningHours. Prefer regular (the canonical schedule)
      // and fall back to current.
      const hours =
        raw.regularOpeningHours ?? raw.currentOpeningHours ?? null;
      rawExtras = {
        openNow: hours?.openNow ?? null,
        weekdayDescriptions: Array.isArray(hours?.weekdayDescriptions)
          ? hours.weekdayDescriptions
          : [],
        businessStatus: raw.businessStatus ?? null,
        priceLevel: raw.priceLevel ?? null,
        editorialSummary:
          raw.editorialSummary?.text ??
          (typeof raw.editorialSummary === "string" ? raw.editorialSummary : null),
      };
    } catch {
      // Malformed JSON — leave defaults; child shows "No disponible".
    }
  }

  // hours_json is also stored as a top-level column; prefer that
  // for backwards-compat with businesses that didn't have raw_data
  // populated. Fall back to raw_extras.
  let hoursForHeader: {
    openNow: boolean | null;
    weekdayDescriptions: string[];
  } | null = null;
  if (business?.hours_json) {
    try {
      const h = JSON.parse(business.hours_json);
      hoursForHeader = {
        openNow: typeof h.openNow === "boolean" ? h.openNow : null,
        weekdayDescriptions: Array.isArray(h.weekdayDescriptions)
          ? h.weekdayDescriptions
          : [],
      };
    } catch {
      /* fall through */
    }
  }
  if (
    !hoursForHeader ||
    (hoursForHeader.weekdayDescriptions.length === 0 &&
      rawExtras.weekdayDescriptions &&
      rawExtras.weekdayDescriptions.length > 0)
  ) {
    hoursForHeader = {
      openNow:
        hoursForHeader?.openNow ?? rawExtras.openNow ?? null,
      weekdayDescriptions:
        hoursForHeader?.weekdayDescriptions.length
          ? hoursForHeader.weekdayDescriptions
          : rawExtras.weekdayDescriptions ?? [],
    };
  }

  const breakdownData = score
    ? {
        breakdown: {
          brechaDigital: score.score_brecha_digital,
          gapOperativo: score.score_gap_operativo,
          fitNegocio: score.score_fit_negocio,
          senalesCompra: score.score_senales_compra,
          proximidad: score.score_proximidad,
        },
        reasoning: score.breakdown_json
          ? JSON.parse(score.breakdown_json).reasoning
          : undefined,
        weights: { brechaDigital: 0.25, gapOperativo: 0.25, fitNegocio: 0.25, senalesCompra: 0.15, proximidad: 0.10 },
      }
    : null;

  const tierLabels = {
    hot: t("scoring.tierHot", "🔥 HOT (75-100) · Cerrar esta semana"),
    warm: t("scoring.tierWarm", "⚡ WARM (60-74) · Lead Calificado"),
    nurture: t("scoring.tierNurture", "🌱 NURTURE (40-59) · Seguimiento"),
    skip: t("scoring.tierSkip", "⚪ SKIP (<40) · Descartar"),
  };

  const scoreForHeader = score
    ? {
        total: score.total_score,
        tier: score.tier as "hot" | "warm" | "nurture" | "skip",
        breakdown: {
          brechaDigital: score.score_brecha_digital,
          gapOperativo: score.score_gap_operativo,
          fitNegocio: score.score_fit_negocio,
          senalesCompra: score.score_senales_compra,
          proximidad: score.score_proximidad,
        },
        reasoning: score.breakdown_json
          ? JSON.parse(score.breakdown_json).reasoning
          : undefined,
      }
    : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* 2-Column Responsive Executive Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Business Profile, Intelligence & Matchmaking (7 cols on LG, 8 cols on XL) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Business header card with 5D diagnostic and commercial triage matrix */}
          <BusinessHeader
            business={{
              id: business.id,
              name: business.name,
              address: business.address,
              city: business.city,
              state: business.state,
              zip: business.zip,
              phone: business.phone,
              website: business.website,
              email: business.email,
              google_rating: business.google_rating,
              review_count: business.review_count,
              hours: hoursForHeader,
              primary_type: business.primary_type,
              distance_miles: business.distance_miles,
              priceLevel: rawExtras.priceLevel ?? null,
              businessStatus: rawExtras.businessStatus ?? null,
              editorialSummary: rawExtras.editorialSummary ?? null,
              sourceEngine: business.source_engine,
              lastCrawledAt: business.last_crawled,
            }}
            score={scoreForHeader}
            reviewBreakdownJson={null}
          />

          {/* Matched services (Plegable por Defecto) */}
          {matchedServices.length > 0 && (
            <Card className="border-slate-200 dark:border-white/10 shadow-xs overflow-hidden">
              {/* Interactive Collapsible Header Bar */}
              <button
                type="button"
                onClick={() => setIsServicesOpen((prev) => !prev)}
                aria-expanded={isServicesOpen}
                className="w-full flex items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all text-left group shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-wrap">
                  <span className="text-base p-1.5 rounded-xl bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold shrink-0">
                    🎯
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-display">
                        {t("profile.matchedServicesTitle", { count: matchedServices.length })}
                      </h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 font-bold">
                        💰 ${totalAnnualPotential.toLocaleString()} / {t("profile.perYear", "año")}
                      </span>
                    </div>

                    {/* Summary preview badges when collapsed */}
                    {!isServicesOpen && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex-wrap font-medium">
                        {matchedServices.map((svc) => (
                          <span
                            key={svc.serviceId}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/5 text-slate-700 dark:text-slate-300"
                          >
                            <span>{svc.serviceIcon}</span>
                            <span className="font-semibold">{locale === "en" && svc.serviceNameEn ? svc.serviceNameEn : svc.serviceName}</span>
                            <span className="text-sky-600 dark:text-sky-400 font-mono font-bold">({svc.relevance} match)</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Toggle indicator button */}
                <div className="flex items-center gap-1.5 shrink-0 text-xs font-semibold text-sky-600 dark:text-sky-400 group-hover:text-sky-700 dark:group-hover:text-sky-300">
                  <span className="hidden sm:inline">
                    {isServicesOpen
                      ? t("profile.hideServicesDetails", "Plegar servicios")
                      : t("profile.viewServicesDetails", "Ver servicios y pitch")}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      isServicesOpen && "rotate-180 text-orange-500"
                    )}
                  />
                </div>
              </button>

              {/* Collapsible Content */}
              {isServicesOpen && (
                <CardContent className="space-y-3 pt-0 pb-4 px-4 border-t border-slate-100 dark:border-white/5 mt-1 animate-in fade-in-50 duration-200">
                  {matchedServices.map((svc) => (
                    <div
                      key={svc.serviceId}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 transition-all hover:border-slate-300 dark:hover:border-white/15"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-2xl">{svc.serviceIcon}</span>
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                              {locale === "en" && svc.serviceNameEn ? svc.serviceNameEn : svc.serviceName}
                            </h3>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 font-semibold">
                              Tier {svc.serviceTier}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 font-medium">
                            {translateServiceReason(svc.reasoning, locale)}
                          </p>
                          <p className="text-xs text-slate-700 dark:text-slate-200 mt-2.5 leading-relaxed italic border-l-2 border-orange-500/60 pl-3 bg-orange-500/5 py-1 rounded-r-md">
                            "{locale === "en" ? svc.pitchEn : svc.pitch}"
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xl font-extrabold text-sky-600 dark:text-sky-400 font-display">
                            {svc.relevance}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                            {t("profile.match", "match")}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">
                          💰 ${svc.priceSetup} setup + ${svc.priceMonthly}/{t("profile.perMonth", "mes")}
                        </span>
                        <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                          ${(svc.priceSetup + svc.priceMonthly * 12).toLocaleString()} / {t("profile.perYear", "año")}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          )}

          {/* Talking Points (Plegable por Defecto) */}
          <Card className="border-slate-200 dark:border-white/10 shadow-xs overflow-hidden">
            {/* Interactive Collapsible Header Bar */}
            <button
              type="button"
              onClick={() => setIsTalkingPointsOpen((prev) => !prev)}
              aria-expanded={isTalkingPointsOpen}
              className="w-full flex items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all text-left group shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0 flex-wrap">
                <span className="text-base p-1.5 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold shrink-0">
                  🗣️
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-display">
                      {t("profile.talkingPointsTitle", "Talking Points para la Llamada / Reunión")}
                    </h3>
                    <span
                      className={cn(
                        "text-[11px] px-2 py-0.5 rounded-full font-bold",
                        talkingPoints.length > 0
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      )}
                    >
                      {talkingPoints.length > 0
                        ? `✨ ${t("profile.keyArgumentsCount", { count: talkingPoints.length })}`
                        : `💡 ${t("profile.noTalkingPoints", "No generados")}`}
                    </span>
                  </div>

                  {/* Summary preview badges when collapsed */}
                  {!isTalkingPointsOpen && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium flex items-center gap-1.5 flex-wrap">
                      {talkingPoints.length > 0 ? (
                        <span className="inline-flex items-center gap-1.5 truncate max-w-lg">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            💡 1. {talkingPoints[0].point}
                          </span>
                          {talkingPoints.length > 1 && (
                            <span className="text-slate-400 dark:text-slate-500 font-normal">
                              (+{talkingPoints.length - 1} más)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span>
                          {t("profile.emptyDescription", "Haz clic en \"Generar con IA\" para crear argumentos persuasivos basados en el score y los servicios.")}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Actions & Toggle */}
              <div className="flex items-center gap-2.5 shrink-0">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateTp();
                  }}
                  disabled={generatingTp || !score}
                  className="h-7 px-2.5 text-xs font-semibold"
                >
                  {generatingTp ? (
                    <>
                      <span className="inline-block w-3 h-3 border border-sky-400 border-t-transparent rounded-full animate-spin mr-1.5" />
                      {t("profile.generating", "Generando...")}
                    </>
                  ) : talkingPoints.length > 0 ? (
                    `🔄 ${t("profile.regenerate", "Regenerar")}`
                  ) : (
                    `✨ ${t("profile.generateWithAi", "Generar con IA")}`
                  )}
                </Button>

                <div className="flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 group-hover:text-sky-700 dark:group-hover:text-sky-300">
                  <span className="hidden sm:inline">
                    {isTalkingPointsOpen
                      ? t("profile.hideTalkingPointsDetails", "Plegar talking points")
                      : t("profile.viewTalkingPointsDetails", "Ver talking points")}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      isTalkingPointsOpen && "rotate-180 text-orange-500"
                    )}
                  />
                </div>
              </div>
            </button>

            {/* Collapsible Content */}
            {isTalkingPointsOpen && (
              <CardContent className="pt-0 pb-4 px-4 border-t border-slate-100 dark:border-white/5 mt-1 animate-in fade-in-50 duration-200">
                {tpError && (
                  <p className="text-sm text-red-600 dark:text-red-300 mb-3 mt-3 font-medium">⚠️ {tpError}</p>
                )}
                {talkingPoints.length === 0 && !generatingTp && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 py-3">
                    {t("profile.emptyDescription", "Haz clic en \"Generar con IA\" para crear 3-5 talking points persuasivos basados en el score y los servicios matcheados.")}
                  </p>
                )}
                {talkingPoints.length > 0 && (
                  <div className="space-y-3 mt-3">
                    {talkingPoints.map((tp, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 space-y-2 transition-all hover:border-slate-300 dark:hover:border-white/15"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 text-[11px] font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-xs text-slate-900 dark:text-slate-100 font-semibold leading-relaxed">
                            {tp.point}
                          </p>
                        </div>
                        <div className="ml-7 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                          <p>
                            <span className="text-slate-700 dark:text-slate-300 font-bold">{t("profile.because", "Porque:")}</span>{" "}
                            {tp.because}
                          </p>
                          <p>
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold">{t("profile.benefit", "Beneficio:")}</span>{" "}
                            {tp.benefit}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* 360° Social Footprint Audit (Agent-Reach) */}
          <SocialAuditCard businessId={business.id} businessName={business.name} />
        </div>

        {/* Right Column: Sticky Executive Actions Hub & 5D Score Breakdown (5 cols on LG, 4 cols on XL) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-6 self-start">
          {/* Executive Action Hub (overflow-visible to allow popovers to float cleanly) */}
          {score && (
            <Card className="border-slate-200 dark:border-white/10 shadow-sm relative z-20 bg-white dark:bg-slate-900/90">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <span>⚡</span> {t("profile.executiveActionsTitle", "Acciones de Cierre & Pipeline")}
                  </CardTitle>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-2xs ${TIER_BADGE[score.tier]}`}
                  >
                    {tierLabels[score.tier]}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  {t("profile.calculatedOn", {
                    date: score.last_calculated
                      ? new Date(score.last_calculated * 1000).toLocaleString(locale === "en" ? "en-US" : "es-ES")
                      : new Date().toLocaleDateString(locale === "en" ? "en-US" : "es-ES"),
                  })}
                </p>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {/* Primary Proposal Action Button */}
                <a
                  href={`/proposals/${business.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/25 hover:shadow-lg transition-all text-center tracking-wide"
                >
                  🚀 {t("profile.generateProposal", "Generar Propuesta Comercial")}
                </a>

                {/* Secondary Actions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2 pt-1">
                  <Button
                    variant={justUpdated ? "default" : "secondary"}
                    size="sm"
                    onClick={handleRescore}
                    disabled={rescoring}
                    className={`w-full justify-center text-xs h-9 ${justUpdated ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""}`}
                  >
                    {rescoring ? (
                      <>
                        <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
                        {t("profile.recalculating", "Recalculando...")}
                      </>
                    ) : justUpdated ? (
                      t("common.updated", "✓ Actualizado")
                    ) : (
                      `🔄 ${t("profile.recalculateScore", "Recalcular score")}`
                    )}
                  </Button>
                  <AddToListButton
                    businessId={business.id}
                    businessName={business.name}
                    className="w-full justify-center text-xs h-9"
                  />
                  <AddToCrmButton
                    businessId={business.id}
                    businessName={business.name}
                    className="w-full justify-center text-xs h-9"
                    inPipeline={pipeline.in_pipeline}
                    currentStage={pipeline.stage}
                    onPipelineChange={(inPipeline, stage) => {
                      setPipeline({ in_pipeline: inPipeline, stage });
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Score 5D Breakdown Card (Plegable por Defecto) */}
          {breakdownData && (
            <Card className="border-slate-200 dark:border-white/10 shadow-sm overflow-hidden bg-white dark:bg-slate-900/90">
              {/* Interactive Collapsible Header Bar */}
              <button
                type="button"
                onClick={() => setIsScoreBreakdownOpen((prev) => !prev)}
                aria-expanded={isScoreBreakdownOpen}
                className="w-full flex items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all text-left group shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-wrap">
                  <span className="text-base p-1.5 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold shrink-0">
                    📊
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-display">
                        {t("profile.scoreBreakdownTitle", "Score 5D — Desglose")}
                      </h3>
                      {score && (
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                          {score.total_score}/100
                        </span>
                      )}
                    </div>

                    {/* Summary preview metrics when collapsed */}
                    {!isScoreBreakdownOpen && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex-wrap font-medium">
                        <span>🌐 {score?.score_brecha_digital ?? breakdownData.breakdown.brechaDigital}</span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span>⏰ {score?.score_gap_operativo ?? breakdownData.breakdown.gapOperativo}</span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span>🎯 {score?.score_fit_negocio ?? breakdownData.breakdown.fitNegocio}</span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span>💰 {score?.score_senales_compra ?? breakdownData.breakdown.senalesCompra}</span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span>📍 {score?.score_proximidad ?? breakdownData.breakdown.proximidad}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Toggle indicator button */}
                <div className="flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 group-hover:text-sky-700 dark:group-hover:text-sky-300 shrink-0">
                  <span className="hidden sm:inline">
                    {isScoreBreakdownOpen
                      ? t("profile.hideScoreBreakdownDetails", "Plegar desglose 5D")
                      : t("profile.viewScoreBreakdownDetails", "Ver desglose 5D")}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      isScoreBreakdownOpen && "rotate-180 text-orange-500"
                    )}
                  />
                </div>
              </button>

              {/* Collapsible Content */}
              {isScoreBreakdownOpen && (
                <CardContent className="pt-0 pb-4 px-4 border-t border-slate-100 dark:border-white/5 mt-1 animate-in fade-in-50 duration-200">
                  <div className="pt-3">
                    <ScoreBreakdown
                      breakdown={breakdownData.breakdown}
                      reasoning={breakdownData.reasoning}
                      weights={breakdownData.weights}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
