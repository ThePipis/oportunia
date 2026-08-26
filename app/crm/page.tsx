"use client";

import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KanbanCard {
  business_id: string;
  business_name: string;
  city: string | null;
  total_score: number | null;
  tier: string | null;
  last_activity: string | null;
  last_activity_at: number | null;
}

const STAGES = [
  { key: "lead" as const, labelKey: "crm.stages.lead", defaultLabel: "Lead Detectado", color: "border-slate-400 dark:border-slate-500", headerBg: "bg-slate-200/70 dark:bg-slate-800/50" },
  { key: "contacted" as const, labelKey: "crm.stages.contacted", defaultLabel: "Contactado", color: "border-sky-500 dark:border-sky-500", headerBg: "bg-sky-100 dark:bg-sky-500/20" },
  { key: "meeting" as const, labelKey: "crm.stages.meeting", defaultLabel: "Reunión Agendada", color: "border-amber-500 dark:border-amber-500", headerBg: "bg-amber-100 dark:bg-amber-500/20" },
  { key: "proposal" as const, labelKey: "crm.stages.proposal", defaultLabel: "Propuesta Enviada", color: "border-violet-500 dark:border-violet-500", headerBg: "bg-violet-100 dark:bg-violet-500/20" },
  { key: "closed_won" as const, labelKey: "crm.stages.closed_won", defaultLabel: "Cerrado Ganado", color: "border-emerald-500 dark:border-emerald-500", headerBg: "bg-emerald-100 dark:bg-emerald-500/20" },
  { key: "closed_lost" as const, labelKey: "crm.stages.closed_lost", defaultLabel: "Cerrado Perdido", color: "border-rose-500 dark:border-rose-500", headerBg: "bg-rose-100 dark:bg-red-500/20" },
] as const;

/** HTML5 dataTransfer payload for drag-and-drop between columns */
const DRAG_MIME = "application/x-oportunia-business-id";

const TIER_BADGE = {
  hot: "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-transparent font-semibold",
  warm: "bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:border-transparent font-semibold",
  nurture: "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-transparent font-semibold",
  skip: "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-transparent font-medium",
};

// Module-level in-memory cache for 0ms instant switching between sections
let cachedKanbanData: Record<string, KanbanCard[]> | null = null;

export default function CRMPage() {
  const { t } = useT();
  const [kanban, setKanban] = React.useState<Record<string, KanbanCard[]> | null>(() => cachedKanbanData);
  const [loading, setLoading] = React.useState(() => !cachedKanbanData);
  // Drag-and-drop state
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [hoverStage, setHoverStage] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!cachedKanbanData) setLoading(true);
    try {
      const res = await fetch("/api/crm/kanban");
      const data = await res.json();
      cachedKanbanData = data.kanban ?? null;
      setKanban(data.kanban);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const moveToStage = async (businessId: string, stage: string) => {
    // Optimistic update — move the card in the local state immediately,
    // then call the API. If the API fails, reload() will restore the
    // authoritative state.
    setKanban((prev) => {
      if (!prev) return prev;
      const next: Record<string, KanbanCard[]> = {
        lead: [], contacted: [], meeting: [], proposal: [],
        closed_won: [], closed_lost: [],
      };
      let movedCard: KanbanCard | null = null;
      for (const k of Object.keys(prev)) {
        for (const card of prev[k]) {
          if (card.business_id === businessId) {
            movedCard = card;
          } else {
            (next[k] as KanbanCard[]).push(card);
          }
        }
      }
      if (movedCard && next[stage]) {
        next[stage].push(movedCard as KanbanCard);
      } else if (movedCard) {
        // shouldn't happen, but fall back to lead
        next.lead.push(movedCard as KanbanCard);
      }
      return next;
    });

    try {
      const res = await fetch("/api/crm/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId, stage }),
      });
      if (!res.ok) {
        await load(); // restore from server on failure
      } else {
        // The server may have queued a background rescore for this
        // business. Give it a moment, then refresh so the card shows
        // the new score instead of "—".
        setTimeout(() => load(), 600);
      }
    } catch {
      await load();
    }
  };

  // Inline rescore for cards that don't have a score yet. Used by the
  // "Calcular" button in the card.
  const [rescoringId, setRescoringId] = React.useState<string | null>(null);
  const rescore = async (businessId: string) => {
    setRescoringId(businessId);
    try {
      await fetch(`/api/businesses/${businessId}/rescore`, { method: "POST" });
      await load();
    } catch (e) {
      console.error("rescore failed", e);
    } finally {
      setRescoringId(null);
    }
  };

  // Remove from pipeline (only allowed in the LEAD stage). Creates a
  // "pipeline_removed" activity; the kanban query hides the business
  // once that becomes its latest activity.
  const [removingId, setRemovingId] = React.useState<string | null>(null);
  const removeFromPipeline = async (
    businessId: string,
    businessName: string
  ) => {
    if (
      !confirm(
        `¿Eliminar "${businessName}" del pipeline?\n\n` +
          `El negocio va a desaparecer del kanban. Lo podés volver a agregar desde el radar con el botón +Pipeline.`
      )
    )
      return;
    setRemovingId(businessId);
    try {
      const res = await fetch("/api/crm/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      await load();
    } catch (e: any) {
      alert(`Error al eliminar: ${e?.message}`);
    } finally {
      setRemovingId(null);
    }
  };

  // Drag-and-drop handlers — HTML5 native, no extra deps
  const onDragStart = (e: React.DragEvent, businessId: string) => {
    e.dataTransfer.setData(DRAG_MIME, businessId);
    e.dataTransfer.setData("text/plain", businessId); // fallback for browsers that ignore custom mime
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(businessId);
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setHoverStage(null);
  };

  const onColumnDragOver = (e: React.DragEvent, stage: string) => {
    // Only accept our payload type
    if (
      e.dataTransfer.types.includes(DRAG_MIME) ||
      e.dataTransfer.types.includes("text/plain")
    ) {
      e.preventDefault(); // necessary to allow drop
      e.dataTransfer.dropEffect = "move";
      if (hoverStage !== stage) setHoverStage(stage);
    }
  };

  const onColumnDragLeave = (stage: string) => {
    if (hoverStage === stage) setHoverStage(null);
  };

  const onColumnDrop = async (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    const businessId =
      e.dataTransfer.getData(DRAG_MIME) ||
      e.dataTransfer.getData("text/plain");
    setHoverStage(null);
    setDraggingId(null);
    if (!businessId) return;
    // Don't do anything if dropping on the same column
    if (kanban && kanban[stage]?.some((c) => c.business_id === businessId)) {
      return;
    }
    await moveToStage(businessId, stage);
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-900 dark:text-slate-100">
            {t("crm.title", "Pipeline CRM")}
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
            {t("crm.subtitle", "Arrastra una tarjeta entre columnas, o usa los botones ← / → para avanzar de etapa comercial.")}
          </p>
        </div>
      </div>

        {loading ? (
          <Card><CardContent className="py-12 text-center text-slate-400">{t("crm.loading", "Cargando pipeline...")}</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto">
            {STAGES.map((stage) => {
              const stageLabel = t(stage.labelKey, stage.defaultLabel);
              const cards = kanban?.[stage.key] ?? [];
              const isHover = hoverStage === stage.key;
              return (
                <div
                  key={stage.key}
                  onDragOver={(e) => onColumnDragOver(e, stage.key)}
                  onDragLeave={() => onColumnDragLeave(stage.key)}
                  onDrop={(e) => onColumnDrop(e, stage.key)}
                  className={`rounded-lg border ${stage.color} ${
                    isHover
                      ? "bg-sky-50 dark:bg-sky-500/10 ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-950"
                      : "bg-slate-100/70 dark:bg-slate-900/40"
                  } p-3 min-h-[300px] transition-colors`}
                >
                  <div className={`${stage.headerBg} rounded-md px-2 py-1.5 mb-3 border border-slate-200/60 dark:border-white/5`}>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      {stageLabel}
                    </h3>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                      {t("crm.leadCount", { count: cards.length }, `${cards.length} prospectos`)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {cards.length === 0 ? (
                      <p
                        className={`text-xs italic text-center py-4 ${
                          isHover ? "text-sky-700 dark:text-sky-300" : "text-slate-400 dark:text-slate-600"
                        }`}
                      >
                        {isHover ? "↓ Soltá acá" : t("crm.emptyStage", "Sin prospectos")}
                      </p>
                    ) : (
                      cards.map((card) => {
                        const currentIdx = STAGES.findIndex((s) => s.key === stage.key);
                        const nextStage = STAGES[currentIdx + 1];
                        const prevStage = STAGES[currentIdx - 1];
                        const nextLabel = nextStage ? t(nextStage.labelKey, nextStage.defaultLabel) : "";
                        const prevLabel = prevStage ? t(prevStage.labelKey, prevStage.defaultLabel) : "";
                        const isDragging = draggingId === card.business_id;
                        return (
                          <Card
                            key={card.business_id}
                            className={`card-glass-hover kanban-grab ${
                              isDragging ? "opacity-40 scale-95 kanban-grabbing ring-2 ring-sky-500" : ""
                            } transition-all select-none`}
                            draggable
                            onDragStart={(e) => onDragStart(e, card.business_id)}
                            onDragEnd={onDragEnd}
                          >
                            <CardContent className="p-3 space-y-2">
                              <a
                                href={`/radar/${card.business_id}`}
                                className="block group"
                                onClick={(e) => e.stopPropagation()}
                                draggable={false}
                              >
                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-300 leading-tight line-clamp-2 transition-colors">
                                  {card.business_name}
                                </p>
                                {card.city && (
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">📍 {card.city}</p>
                                )}
                              </a>
                              {card.total_score !== null ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-base font-bold text-sky-700 dark:text-sky-300 font-mono">
                                    {card.total_score}
                                  </span>
                                  {card.tier && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${TIER_BADGE[card.tier as keyof typeof TIER_BADGE] ?? TIER_BADGE.skip}`}>
                                      {card.tier}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    rescore(card.business_id);
                                  }}
                                  disabled={rescoringId === card.business_id}
                                  className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 disabled:opacity-50 font-medium"
                                  title={t("crm.rescoreTooltip", "Calcular score con los datos de Google Places")}
                                >
                                  {rescoringId === card.business_id ? (
                                    <>
                                      <span
                                        className="inline-block w-2.5 h-2.5 border-2 border-amber-600 dark:border-amber-300 border-t-transparent rounded-full animate-spin"
                                        aria-hidden="true"
                                      />
                                      {t("crm.calculating", "Calculando...")}
                                    </>
                                  ) : (
                                    <>{t("crm.calculate", "— Calcular")}</>
                                  )}
                                </button>
                              )}
                              {card.last_activity && (
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 italic line-clamp-1">
                                  {card.last_activity}
                                </p>
                              )}
                              <div className="flex items-center gap-1 pt-1">
                                {prevStage && (
                                  <button
                                    onClick={() => moveToStage(card.business_id, prevStage.key)}
                                    className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 px-1 font-medium"
                                    title={`${t("crm.moveLeft", "← Mover")} ${prevLabel}`}
                                  >
                                    ←
                                  </button>
                                )}
                                {nextStage && (
                                  <button
                                    onClick={() => moveToStage(card.business_id, nextStage.key)}
                                    className="text-[10px] text-sky-700 dark:text-sky-400 hover:underline px-1 ml-auto font-medium"
                                    title={`${t("crm.moveRight", "Mover →")} ${nextLabel}`}
                                  >
                                    {nextLabel} →
                                  </button>
                                )}
                              </div>
                              {/* "Eliminar del pipeline" — only visible in the LEAD
                                  stage. Once the business has progressed to
                                  Contactado/Reunión/Propuesta the user should mark
                                  it as closed_lost instead, not delete. The button
                                  reappears if the card is moved back to LEAD.
                                  Destructive action — visually separated from the
                                  forward-arrows and clearly marked in red. */}
                              {stage.key === "lead" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFromPipeline(card.business_id, card.business_name);
                                  }}
                                  disabled={removingId === card.business_id}
                                  className="w-full text-[11px] font-medium text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 hover:border-red-400 dark:hover:border-red-500/60 disabled:opacity-50 disabled:cursor-wait mt-1 py-1 rounded transition-colors flex items-center justify-center gap-1.5"
                                  title={t("crm.deleteTooltip", "Quitar este prospecto del pipeline comercial")}
                                >
                                  {removingId === card.business_id ? (
                                    <>
                                      <span
                                        className="inline-block w-3 h-3 border-2 border-red-300 border-t-transparent rounded-full animate-spin"
                                        aria-hidden="true"
                                      />
                                      {t("common.loading", "Eliminando...")}
                                    </>
                                  ) : (
                                    <>
                                      <span aria-hidden="true">🗑️</span>
                                      <span>{t("crm.deleteFromPipeline", "Eliminar del pipeline")}</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && kanban && Object.values(kanban).every((arr) => arr.length === 0) && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-300">No hay negocios en el pipeline todavía.</p>
              <p className="text-xs text-slate-500 mt-2">
                Buscá negocios en <a href="/radar" className="text-sky-400">/radar</a> y empezá a moverlos entre stages.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
  );
}
