"use client";

import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SocialOpportunity } from "@/lib/tools/social-listening";
import { ExternalLink, Radio, Sparkles, Filter, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

function RedditIcon({ className = "w-4 h-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#FF4500" />
      <path
        d="M19.5 12c0-.83-.67-1.5-1.5-1.5-.4 0-.76.16-1.03.41-1.12-.76-2.65-1.25-4.36-1.31l.88-4.13 2.87.61c.04.66.59 1.18 1.26 1.18.7 0 1.26-.56 1.26-1.26 0-.7-.56-1.26-1.26-1.26-.52 0-.96.31-1.16.76l-3.21-.68c-.1-.02-.2.03-.24.12l-1.02 4.79c-1.74.05-3.3.54-4.44 1.31-.27-.26-.64-.43-1.05-.43-.83 0-1.5.67-1.5 1.5 0 .58.33 1.08.81 1.33-.04.22-.06.45-.06.67 0 3.03 3.58 5.5 8 5.5s8-2.47 8-5.5c0-.23-.02-.45-.06-.67.48-.25.81-.75.81-1.33zM9 13.5c0-.55.45-1 1-1s1 .45 1 1-.45 1-1 1-1-.45-1-1zm6.71 3.29c-.7.7-1.92.81-2.71.81s-2.01-.11-2.71-.81c-.1-.1-.1-.26 0-.35.1-.1.26-.1.35 0 .56.56 1.63.66 2.36.66.73 0 1.8-.1 2.36-.66.1-.1.26-.1.35 0 .1.09.1.25 0 .35zm-.71-2.29c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        d="M15.12 12.75l.55-3.58h-3.44V6.84c0-.98.48-1.93 2.01-1.93h1.56V1.86s-1.41-.24-2.76-.24c-2.82 0-4.66 1.71-4.66 4.8v2.75H5.25v3.58h3.13V21.6c.63.1 1.27.15 1.92.15s1.29-.05 1.92-.15V12.75h2.9z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function XIcon({ className = "w-3.5 h-3.5 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function SocialRadarPage() {
  const { t } = useT();
  const [opportunities, setOpportunities] = React.useState<SocialOpportunity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sourceFilter, setSourceFilter] = React.useState("all");
  const [intentFilter, setIntentFilter] = React.useState("all");
  const [convertingId, setConvertingId] = React.useState<string | null>(null);
  const [convertedMap, setConvertedMap] = React.useState<Record<string, string>>({}); // oppId -> bizId

  const fetchOpportunities = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      if (intentFilter !== "all") params.set("intent", intentFilter);

      const res = await fetch(`/api/radar/social-listening?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch opportunities");
      const data = await res.json();
      setOpportunities(data.opportunities || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sourceFilter, intentFilter]);

  React.useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleConvertToCrm = async (opp: SocialOpportunity) => {
    try {
      setConvertingId(opp.id);
      const res = await fetch("/api/radar/social-listening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunity: opp }),
      });
      if (!res.ok) throw new Error("Error al convertir");
      const data = await res.json();
      if (data.businessId) {
        setConvertedMap((prev) => ({ ...prev, [opp.id]: data.businessId }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConvertingId(null);
    }
  };

  const totalPipelineValue = React.useMemo(() => {
    return opportunities.reduce((sum, opp) => sum + opp.estimatedTicket, 0);
  }, [opportunities]);

  const hotCount = React.useMemo(() => {
    return opportunities.filter((o) => o.intentLevel === "hot").length;
  }, [opportunities]);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold text-xl">
              📡
            </span>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Social Listening & Radar de Intención
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                  Agent-Reach
                </span>
              </h1>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
                Captación Inbound en tiempo real: Detecta dueños de negocios locales pidiendo automatizaciones y chatbots en Reddit, Twitter/X y Facebook Groups.
              </p>
            </div>
          </div>
        </div>

        {/* Global Stats */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <p className="text-[11px] text-slate-500 font-medium">Leads HOT Detectados</p>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">🔥 {hotCount} activos</p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <p className="text-[11px] text-slate-500 font-medium">Pipeline Social Estimado</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-display">
              ${totalPipelineValue.toLocaleString()} USD
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900/80">
        <CardContent className="p-3.5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mr-2">
              <Filter className="w-3.5 h-3.5" /> Canales:
            </span>
            {[
              { id: "all", label: "Todos los Canales", icon: null },
              { id: "reddit", label: "Reddit", icon: <RedditIcon className="w-3.5 h-3.5" /> },
              { id: "twitter", label: "Twitter / X", icon: <XIcon className="w-3 h-3" /> },
              { id: "community", label: "Facebook Groups", icon: <FacebookIcon className="w-3.5 h-3.5" /> },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setSourceFilter(btn.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all text-xs cursor-pointer",
                  sourceFilter === btn.id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                )}
              >
                {btn.icon}
                <span>{btn.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">Intención:</span>
            {[
              { id: "all", label: "Todas" },
              { id: "hot", label: "🔥 Alta (HOT)" },
              { id: "warm", label: "⚡ Moderada" },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setIntentFilter(btn.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-semibold transition-all text-xs cursor-pointer",
                  intentFilter === btn.id
                    ? "bg-orange-500 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leads Feed */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse h-48 bg-slate-100 dark:bg-slate-800/40" />
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <Card className="border-slate-200 dark:border-slate-800 p-8 text-center">
          <p className="text-sm text-slate-500">No se encontraron señales de intención con los filtros seleccionados.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opportunities.map((opp) => {
            const convertedBizId = convertedMap[opp.id];
            const sourceBadge = (() => {
              switch (opp.source) {
                case "reddit":
                  return {
                    icon: <RedditIcon className="w-4 h-4" />,
                    label: `Reddit · ${opp.sourceName}`,
                    actionLabel: "Ver hilo en Reddit",
                    className: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30",
                  };
                case "twitter":
                  return {
                    icon: <XIcon className="w-3.5 h-3.5" />,
                    label: "Twitter / X",
                    actionLabel: "Ver búsquedas en 𝕏",
                    className: "bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 border-slate-700 dark:border-slate-600",
                  };
                case "community":
                  return {
                    icon: <FacebookIcon className="w-4 h-4" />,
                    label: `Facebook Group · ${opp.sourceName}`,
                    actionLabel: "Ver grupo en Facebook",
                    className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
                  };
                default:
                  return {
                    icon: <span className="text-xs">🌐</span>,
                    label: opp.sourceName,
                    actionLabel: "Ver post original",
                    className: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
                  };
              }
            })();

            return (
              <Card
                key={opp.id}
                className="border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("px-2.5 py-1 rounded-lg text-[11px] font-bold border inline-flex items-center gap-1.5 shadow-2xs", sourceBadge.className)}>
                        {sourceBadge.icon}
                        <span>{sourceBadge.label}</span>
                      </span>
                      <a
                        href={opp.authorProfileUrl || `https://www.reddit.com/user/${opp.author.replace(/^[u@\/]+/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 font-mono hover:underline inline-flex items-center gap-1 transition-colors"
                        title="Ver perfil de usuario en Reddit (nueva pestaña)"
                      >
                        <span>{opp.author}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    </div>

                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                        opp.intentLevel === "hot"
                          ? "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30"
                          : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30"
                      )}
                    >
                      {opp.intentLevel === "hot" ? "🔥 Alta Intención" : "⚡ Interés Activo"}
                    </span>
                  </div>

                  <CardTitle className="text-base text-slate-900 dark:text-slate-100 pt-1 leading-snug">
                    {opp.title}
                  </CardTitle>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${opp.businessName} ${opp.fullAddress}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-slate-900 dark:text-slate-100 hover:text-orange-600 dark:hover:text-orange-400 inline-flex items-center gap-1 transition-colors underline decoration-slate-300 dark:decoration-slate-700 underline-offset-2"
                          title="Abrir ubicación en Google Maps (nueva pestaña)"
                        >
                          <span>🏢 {opp.businessName}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>

                        {opp.phone && (
                          <a
                            href={`tel:${opp.phone.replace(/[^0-9+]/g, '')}`}
                            className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-mono text-[11px] bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/60 inline-flex items-center gap-1 transition-colors"
                            title="Llamar al negocio"
                          >
                            <span>📞 {opp.phone}</span>
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {opp.website && (
                          <a
                            href={opp.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline bg-sky-50 dark:bg-sky-500/10 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-500/20 transition-colors"
                            title="Visitar sitio web oficial"
                          >
                            <span>🌐 Web</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${opp.businessName} ${opp.fullAddress}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20 transition-colors"
                          title="Ver en Google Maps"
                        >
                          <span>🗺️ Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${opp.businessName} ${opp.fullAddress}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 flex items-center gap-1 transition-colors"
                        title="Ver dirección en Google Maps"
                      >
                        <span>📍</span>
                        <span>{opp.fullAddress}</span>
                      </a>

                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10.5px] font-bold border inline-flex items-center gap-1 shadow-2xs",
                          opp.distanceMiles <= 3
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        )}
                        title="Distancia calculada desde 7940 Vandewater St, Eastvale, CA"
                      >
                        <span>🚗</span>
                        <span>{opp.distanceMiles} mi de tu casa</span>
                      </span>

                      <span>·</span>
                      <span>🏷️ {opp.niche}</span>
                      <span>·</span>
                      <span>⏰ {opp.postedAt}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-white/5 leading-relaxed">
                    "{opp.contentSnippet}"
                  </p>

                  {/* Detected Pain Point Box */}
                  <div className="p-2.5 rounded-lg bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-500/20 space-y-1">
                    <p className="text-[11px] font-bold text-orange-900 dark:text-orange-300 flex items-center gap-1.5">
                      <span>🎯 Dolor Detectado:</span>
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {opp.detectedPainPoint}
                    </p>
                  </div>

                  {/* Service Match & Ticket */}
                  <div className="flex items-center justify-between text-xs pt-1 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-medium">Servicio Clave:</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {opp.matchedService}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
                      ~${opp.estimatedTicket}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <a
                        href={opp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                        title="Ver post original en vivo"
                      >
                        <span>{sourceBadge.actionLabel}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      {opp.source === "reddit" && (
                        <a
                          href={opp.authorProfileUrl || `https://www.reddit.com/user/${opp.author.replace(/^[u@\/]+/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded border border-orange-200 dark:border-orange-500/20 transition-colors"
                          title="Enviar mensaje directo o ver perfil del autor en Reddit"
                        >
                          <span>💬 DM en Reddit</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {convertedBizId ? (
                      <Link
                        href={`/radar/${convertedBizId}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ver en CRM & Ficha ↗</span>
                      </Link>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConvertToCrm(opp)}
                        disabled={convertingId === opp.id}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs h-8 shadow-xs"
                      >
                        {convertingId === opp.id ? (
                          <>
                            <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                            Capturando...
                          </>
                        ) : (
                          "🚀 Capturar en CRM"
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
