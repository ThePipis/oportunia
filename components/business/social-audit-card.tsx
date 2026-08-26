"use client";

import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SocialAuditResult } from "@/lib/tools/agent-reach";
import { ChevronDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialAuditCardProps {
  businessId: string;
  businessName: string;
  className?: string;
}

export function SocialAuditCard({ businessId, businessName, className }: SocialAuditCardProps) {
  const { t, locale } = useT();
  const [audit, setAudit] = React.useState<SocialAuditResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Lazy load or fetch audit on mount
  React.useEffect(() => {
    let cancelled = false;
    async function fetchAudit() {
      try {
        setLoading(true);
        const res = await fetch(`/api/businesses/${businessId}/social-audit`);
        if (!res.ok) throw new Error("Failed to load audit");
        const data = await res.json();
        if (!cancelled && data.audit) {
          setAudit(data.audit);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAudit();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const handleReaudit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/businesses/${businessId}/social-audit`, { method: "POST" });
      if (!res.ok) throw new Error("Error al re-auditar");
      const data = await res.json();
      if (data.audit) {
        setAudit(data.audit);
        setIsOpen(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: "missing" | "inactive" | "active") => {
    switch (status) {
      case "active":
        return {
          label: t("social.statusActive", "Activa"),
          className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30",
        };
      case "inactive":
        return {
          label: t("social.statusInactive", "Abandonada / Inactiva"),
          className: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border-amber-300 dark:border-amber-500/30",
        };
      case "missing":
      default:
        return {
          label: t("social.statusMissing", "Sin Presencia"),
          className: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border-rose-300 dark:border-rose-500/30",
        };
    }
  };

  return (
    <Card className={cn("border-slate-200 dark:border-white/10 shadow-xs overflow-hidden", className)}>
      {/* Interactive Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all text-left group shadow-2xs cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          <span className="text-base p-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
            🌐
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-display">
                {t("social.auditTitle", "Auditoría Social 360° (Agent-Reach)")}
              </h3>
              {audit ? (
                <span
                  className={cn(
                    "text-[11px] px-2 py-0.5 rounded-full font-bold border",
                    audit.overallSocialScore < 50
                      ? "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30"
                      : "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30"
                  )}
                >
                  Social Score: {audit.overallSocialScore}/100
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {loading ? t("common.loading", "Auditando...") : t("social.readyToAudit", "Agent-Reach listo")}
                </span>
              )}
            </div>

            {/* Summary Preview Badges when Collapsed */}
            {!isOpen && audit && (
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex-wrap font-medium">
                <span className="flex items-center gap-1">
                  <span>📸 IG:</span>
                  <strong className={audit.channels.instagram.status === "active" ? "text-emerald-600" : "text-amber-600"}>
                    {audit.channels.instagram.status === "active" ? "Activo" : audit.channels.instagram.status === "inactive" ? "Inactivo" : "Sin perfil"}
                  </strong>
                </span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="flex items-center gap-1">
                  <span>📘 FB:</span>
                  <strong className={audit.channels.facebook.status === "active" ? "text-emerald-600" : "text-amber-600"}>
                    {audit.channels.facebook.status === "active" ? "Activo" : "Sin perfil"}
                  </strong>
                </span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="flex items-center gap-1">
                  <span>🎥 YT:</span>
                  <strong className={audit.channels.youtube.status === "active" ? "text-emerald-600" : "text-rose-600"}>
                    {audit.channels.youtube.status === "active" ? "Canal Activo" : "0 Shorts/Videos"}
                  </strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions & Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleReaudit}
            disabled={loading}
            className="h-7 px-2.5 text-xs font-semibold"
          >
            {loading ? (
              <>
                <span className="inline-block w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin mr-1.5" />
                {t("social.auditing", "Auditando...")}
              </>
            ) : audit ? (
              `🔄 ${t("social.reaudit", "Re-auditar")}`
            ) : (
              `⚡ ${t("social.auditAction", "Auditar Redes")}`
            )}
          </Button>

          <div className="flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 group-hover:text-sky-700 dark:group-hover:text-sky-300">
            <span className="hidden sm:inline">
              {isOpen ? t("social.hideAudit", "Plegar auditoría") : t("social.viewAudit", "Ver auditoría social")}
            </span>
            <ChevronDown
              className={cn("w-4 h-4 transition-transform duration-200", isOpen && "rotate-180 text-orange-500")}
            />
          </div>
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <CardContent className="pt-0 pb-4 px-4 border-t border-slate-100 dark:border-white/5 mt-1 space-y-4 animate-in fade-in-50 duration-200">
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 pt-3">⚠️ {error}</p>
          )}

          {audit ? (
            <div className="space-y-4 pt-3">
              {/* Verdict Banner */}
              <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-bold text-xs uppercase tracking-wide text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <span>🎯</span>
                    <span>{locale === "en" ? audit.verdictHeadlineEn : audit.verdictHeadline}</span>
                  </h4>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-black/40 border border-indigo-300 dark:border-indigo-500/30 text-indigo-800 dark:text-indigo-300">
                    BRECHA SOCIAL: {audit.socialGapScore}%
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic bg-white/60 dark:bg-black/20 p-2.5 rounded-lg border border-indigo-100 dark:border-white/5">
                  "{locale === "en" ? audit.summaryPitchEn : audit.summaryPitch}"
                </p>
              </div>

              {/* Channels Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Instagram */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>📸</span> Instagram
                      </span>
                      <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold border", getStatusBadge(audit.channels.instagram.status).className)}>
                        {getStatusBadge(audit.channels.instagram.status).label}
                      </span>
                    </div>
                    {(() => {
                      const isMissing = audit.channels.instagram.status === "missing";
                      const handleClean = audit.channels.instagram.handle ? audit.channels.instagram.handle.replace(/^@/, "").trim() : "";
                      const igUrl = audit.channels.instagram.url || (handleClean ? `https://www.instagram.com/${handleClean}/` : null);
                      return (
                        <>
                          {!isMissing && audit.channels.instagram.handle && igUrl && (
                            <a
                              href={igUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-bold truncate hover:underline hover:text-sky-700 dark:hover:text-sky-300 inline-flex items-center gap-1 cursor-pointer bg-sky-50 dark:bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-500/20"
                              title={t("social.openInNewTab", "Abrir en nueva pestaña")}
                            >
                              <span>{audit.channels.instagram.handle}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          )}
                          <ul className="text-[10.5px] text-slate-600 dark:text-slate-400 space-y-1">
                            {audit.channels.instagram.issues?.map((iss, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className={isMissing ? "text-rose-500" : "text-amber-500"}>⚠</span> {iss}
                              </li>
                            ))}
                          </ul>
                        </>
                      );
                    })()}
                  </div>
                  {(() => {
                    const isMissing = audit.channels.instagram.status === "missing";
                    const handleClean = audit.channels.instagram.handle ? audit.channels.instagram.handle.replace(/^@/, "").trim() : "";
                    const igUrl = audit.channels.instagram.url || (handleClean ? `https://www.instagram.com/${handleClean}/` : null);
                    return (
                      <div className="pt-2 mt-auto border-t border-slate-200/60 dark:border-slate-800/80">
                        {isMissing || !igUrl ? (
                          <div className="inline-flex items-center justify-center gap-1.5 w-full text-xs font-medium py-1.5 rounded-lg text-slate-400 dark:text-slate-500 bg-slate-100/60 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 select-none cursor-default">
                            <span>🚫</span>
                            <span>{t("social.noProfile", "Sin perfil registrado")}</span>
                          </div>
                        ) : (
                          <a
                            href={igUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center justify-center gap-1.5 w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg text-sky-700 dark:text-sky-200 bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/15 dark:hover:bg-sky-500/25 border border-sky-200 dark:border-sky-500/30 transition-all shadow-2xs group/btn cursor-pointer"
                          >
                            <span>📸 {t("social.viewProfile", "Ver perfil en Instagram")}</span>
                            <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                          </a>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Facebook */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>📘</span> Facebook
                      </span>
                      <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold border", getStatusBadge(audit.channels.facebook.status).className)}>
                        {getStatusBadge(audit.channels.facebook.status).label}
                      </span>
                    </div>
                    <ul className="text-[10.5px] text-slate-600 dark:text-slate-400 space-y-1">
                      {audit.channels.facebook.issues?.map((iss, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className={audit.channels.facebook.status === "missing" ? "text-rose-500" : "text-amber-500"}>⚠</span> {iss}
                        </li>
                      ))}
                      {audit.channels.facebook.highlights?.map((hl, i) => (
                        <li key={i} className="flex items-start gap-1 text-emerald-700 dark:text-emerald-300">
                          <span>✓</span> {hl}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {(() => {
                    const isMissing = audit.channels.facebook.status === "missing";
                    const fbUrl = audit.channels.facebook.url || (!isMissing ? `https://www.facebook.com/search/top?q=${encodeURIComponent(businessName)}` : null);
                    return (
                      <div className="pt-2 mt-auto border-t border-slate-200/60 dark:border-slate-800/80">
                        {isMissing || !fbUrl ? (
                          <div className="inline-flex items-center justify-center gap-1.5 w-full text-xs font-medium py-1.5 rounded-lg text-slate-400 dark:text-slate-500 bg-slate-100/60 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 select-none cursor-default">
                            <span>🚫</span>
                            <span>{t("social.noPage", "Sin página registrada")}</span>
                          </div>
                        ) : (
                          <a
                            href={fbUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center justify-center gap-1.5 w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg text-sky-700 dark:text-sky-200 bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/15 dark:hover:bg-sky-500/25 border border-sky-200 dark:border-sky-500/30 transition-all shadow-2xs group/btn cursor-pointer"
                          >
                            <span>📘 {t("social.viewPage", "Ver página en Facebook")}</span>
                            <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                          </a>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* YouTube */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>🎥</span> YouTube
                      </span>
                      <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold border", getStatusBadge(audit.channels.youtube.status).className)}>
                        {getStatusBadge(audit.channels.youtube.status).label}
                      </span>
                    </div>
                    <ul className="text-[10.5px] text-slate-600 dark:text-slate-400 space-y-1">
                      {audit.channels.youtube.issues?.map((iss, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-rose-500">⚠</span> {iss}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {(() => {
                    const isMissing = audit.channels.youtube.status === "missing";
                    const ytUrl = audit.channels.youtube.url || (!isMissing ? `https://www.youtube.com/results?search_query=${encodeURIComponent(businessName)}` : null);
                    return (
                      <div className="pt-2 mt-auto border-t border-slate-200/60 dark:border-slate-800/80">
                        {isMissing || !ytUrl ? (
                          <div className="inline-flex items-center justify-center gap-1.5 w-full text-xs font-medium py-1.5 rounded-lg text-slate-400 dark:text-slate-500 bg-slate-100/60 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 select-none cursor-default">
                            <span>🚫</span>
                            <span>{t("social.noChannel", "Sin canal registrado")}</span>
                          </div>
                        ) : (
                          <a
                            href={ytUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center justify-center gap-1.5 w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg text-sky-700 dark:text-sky-200 bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/15 dark:hover:bg-sky-500/25 border border-sky-200 dark:border-sky-500/30 transition-all shadow-2xs group/btn cursor-pointer"
                          >
                            <span>🎥 {t("social.viewChannel", "Ver canal en YouTube")}</span>
                            <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                          </a>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Reddit Discussions */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>💬</span> Reddit / Local
                      </span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-bold border",
                        (audit.channels.reddit?.mentionsCount || 0) > 0
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border-rose-300 dark:border-rose-500/30"
                      )}>
                        {(audit.channels.reddit?.mentionsCount || 0) > 0 ? `${audit.channels.reddit.mentionsCount} menciones` : "Sin menciones"}
                      </span>
                    </div>
                    {audit.channels.reddit?.sampleThreads && audit.channels.reddit.sampleThreads.length > 0 ? (
                      <div className="space-y-1">
                        {audit.channels.reddit.sampleThreads.map((th, i) => (
                          <p key={i} className="text-[10.5px] text-slate-600 dark:text-slate-400 leading-tight">
                            • {th.title}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 italic">
                        {t("social.noMentionsDesc", "Sin quejas ni menciones registradas en foros locales.")}
                      </p>
                    )}
                  </div>
                  {(() => {
                    const hasMentions = (audit.channels.reddit?.mentionsCount || 0) > 0;
                    const redditUrl = audit.channels.reddit?.sampleThreads?.[0]?.url;
                    return (
                      <div className="pt-2 mt-auto border-t border-slate-200/60 dark:border-slate-800/80">
                        {!hasMentions || !redditUrl ? (
                          <div className="inline-flex items-center justify-center gap-1.5 w-full text-xs font-medium py-1.5 rounded-lg text-slate-400 dark:text-slate-500 bg-slate-100/60 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 select-none cursor-default">
                            <span>🚫</span>
                            <span>{t("social.noMentions", "Sin menciones registradas")}</span>
                          </div>
                        ) : (
                          <a
                            href={redditUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center justify-center gap-1.5 w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg text-sky-700 dark:text-sky-200 bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/15 dark:hover:bg-sky-500/25 border border-sky-200 dark:border-sky-500/30 transition-all shadow-2xs group/btn cursor-pointer"
                          >
                            <span>💬 {t("social.viewMentions", "Ver menciones en Reddit")}</span>
                            <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                          </a>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Recommended Services Footer */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  💡 Servicios de IA recomendados para cerrar la brecha:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {audit.recommendedServices.map((svc, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/20 text-[11px]"
                    >
                      {svc}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-500">
              {loading ? t("social.auditingDesc", "Analizando huella en Instagram, YouTube, Facebook y Reddit con Agent-Reach...") : t("social.clickToAudit", "Haz clic en 'Auditar Redes' para extraer la huella social del negocio.")}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
