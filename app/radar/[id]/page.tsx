"use client";

import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessHeader } from "@/components/business/business-header";
import { ScoreBreakdown } from "@/components/scoring/score-breakdown";
import AddToListButton from "@/components/map/add-to-list-button";
import AddToCrmButton from "@/components/map/add-to-crm-button";

interface Business {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  website: string | null;
  google_rating: number | null;
  review_count: number | null;
  primary_type: string | null;
  distance_miles: number | null;
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
}

interface MatchedService {
  serviceId: string;
  serviceName: string;
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
  hot: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  warm: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  nurture: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  skip: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const TIER_LABEL = {
  hot: "🔥 Cerrar esta semana",
  warm: "⚡ Lead caliente",
  nurture: "🌱 Nurture",
  skip: "❌ Skip",
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
  const [talkingPoints, setTalkingPoints] = React.useState<TalkingPoint[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [rescoring, setRescoring] = React.useState(false);
  const [generatingTp, setGeneratingTp] = React.useState(false);
  const [tpError, setTpError] = React.useState<string | null>(null);

  // Unwrap the params promise
  const unwrappedParams = React.use(params);

  // Load business + score + matched services
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

  const scoreForHeader = score
    ? { total: score.total_score, tier: score.tier }
    : null;

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

  return (
    <main className="min-h-screen bg-gradient-radial">
      <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-gradient-brand">
              Ficha del Negocio
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Score 5D, servicios matcheados, y talking points con IA
            </p>
          </div></div>

        {/* Nav */}
        <div className="flex items-center gap-3 text-sm">
          <a href="/" className="text-sky-400 hover:text-sky-300">← Inicio</a>
          <span className="text-slate-700">·</span>
          <a href="/radar" className="text-sky-400 hover:text-sky-300">Radar</a>
          <span className="text-slate-700">·</span>
          <a href="/tools" className="text-sky-400 hover:text-sky-300">Tools</a>
        </div>

        {/* Business header card */}
        <BusinessHeader business={business} score={scoreForHeader} />

        {/* Tier badge + actions */}
        {score && (
          <Card>
            <CardContent className="pt-6 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${TIER_BADGE[score.tier]}`}
                >
                  {TIER_LABEL[score.tier]}
                </span>
                <span className="text-sm text-slate-400">
                  Score calculado · {new Date(score.business_id ? Date.now() : Date.now()).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRescore}
                  disabled={rescoring}
                >
                  {rescoring ? "Recalculando..." : "🔄 Recalcular score"}
                </Button>
                <AddToListButton
                  businessId={business.id}
                  businessName={business.name}
                  compact={false}
                />
                <AddToCrmButton
                  businessId={business.id}
                  businessName={business.name}
                  compact={false}
                />
                <a
                  href={`/proposals/${business.id}`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-lg shadow-orange-500/30 hover:-translate-y-0.5 transition-all"
                >
                  🚀 Generar Propuesta
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Score breakdown */}
        {breakdownData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📊</span> Score 5D — Desglose
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreBreakdown
                breakdown={breakdownData.breakdown}
                reasoning={breakdownData.reasoning}
                weights={breakdownData.weights}
              />
            </CardContent>
          </Card>
        )}

        {/* Matched services */}
        {matchedServices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🎯</span> Servicios AI Recomendados ({matchedServices.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {matchedServices.map((svc) => (
                <div
                  key={svc.serviceId}
                  className="p-4 rounded-lg bg-slate-900/60 border border-white/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{svc.serviceIcon}</span>
                        <h3 className="font-semibold text-slate-100">
                          {locale === "en" && svc.serviceName === svc.serviceName
                            ? svc.serviceName
                            : svc.serviceName}
                        </h3>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          Tier {svc.serviceTier}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {svc.reasoning}
                      </p>
                      <p className="text-sm text-slate-200 mt-3 leading-relaxed italic border-l-2 border-orange-500/40 pl-3">
                        "{locale === "en" ? svc.pitchEn : svc.pitch}"
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-sky-300">
                        {svc.relevance}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                        match
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      💰 ${svc.priceSetup} setup + ${svc.priceMonthly}/mes
                    </span>
                    <span className="text-emerald-300 font-semibold">
                      ${(svc.priceSetup + svc.priceMonthly * 12).toLocaleString()} / año
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Talking Points */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>🗣️</span> Talking Points (con IA)
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleGenerateTp}
                disabled={generatingTp || !score}
              >
                {generatingTp ? (
                  <>
                    <span className="inline-block w-3 h-3 border border-sky-400 border-t-transparent rounded-full animate-spin" />
                    Generando...
                  </>
                ) : talkingPoints.length > 0 ? (
                  "🔄 Regenerar"
                ) : (
                  "✨ Generar con IA"
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tpError && (
              <p className="text-sm text-red-300 mb-3">⚠️ {tpError}</p>
            )}
            {talkingPoints.length === 0 && !generatingTp && (
              <p className="text-sm text-slate-400">
                Click "Generar con IA" para crear 3-5 talking points persuasivos basados en el
                score y los servicios matcheados. Usa el LLM local o Gemini según tu toggle.
              </p>
            )}
            {talkingPoints.length > 0 && (
              <div className="space-y-3">
                {talkingPoints.map((tp, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg bg-slate-900/60 border border-white/5 space-y-2"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-100 font-medium leading-relaxed">
                        {tp.point}
                      </p>
                    </div>
                    <div className="ml-9 space-y-1 text-xs text-slate-400">
                      <p>
                        <span className="text-slate-500 font-semibold">Porque:</span>{" "}
                        {tp.because}
                      </p>
                      <p>
                        <span className="text-emerald-400 font-semibold">Beneficio:</span>{" "}
                        {tp.benefit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
