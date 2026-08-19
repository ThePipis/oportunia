"use client";

import * as React from "react";
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
  { key: "lead" as const, label: "Lead", color: "border-slate-500", headerBg: "bg-slate-800/50" },
  { key: "contacted" as const, label: "Contactado", color: "border-sky-500", headerBg: "bg-sky-500/20" },
  { key: "meeting" as const, label: "Reunión agendada", color: "border-amber-500", headerBg: "bg-amber-500/20" },
  { key: "proposal" as const, label: "Propuesta enviada", color: "border-violet-500", headerBg: "bg-violet-500/20" },
  { key: "closed_won" as const, label: "✅ Cerrado ganado", color: "border-emerald-500", headerBg: "bg-emerald-500/20" },
  { key: "closed_lost" as const, label: "❌ Cerrado perdido", color: "border-red-500", headerBg: "bg-red-500/20" },
] as const;

/** HTML5 dataTransfer payload for drag-and-drop between columns */
const DRAG_MIME = "application/x-oportunia-business-id";

const TIER_BADGE = {
  hot: "bg-amber-500/20 text-amber-300",
  warm: "bg-sky-500/20 text-sky-300",
  nurture: "bg-emerald-500/20 text-emerald-300",
  skip: "bg-slate-700 text-slate-400",
};

export default function CRMPage() {
  const [kanban, setKanban] = React.useState<Record<string, KanbanCard[]> | null>(null);
  const [loading, setLoading] = React.useState(true);
  // Drag-and-drop state
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [hoverStage, setHoverStage] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/crm/kanban");
    const data = await res.json();
    setKanban(data.kanban);
    setLoading(false);
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
    <main className="min-h-screen bg-gradient-radial">
      <div className="p-6 md:p-8 space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display text-gradient-brand">CRM · Pipeline</h1>
            <p className="text-sm text-slate-400 mt-1">
              Arrastrá una card entre columnas, o usá los botones ← / →. Lead → Contactado → Reunión → Propuesta → Cerrado.
            </p>
          </div></div>

        <div className="flex items-center gap-3 text-sm">
          <a href="/" className="text-sky-400">← Inicio</a>
          <span className="text-slate-700">·</span>
          <a href="/lists" className="text-sky-400">Listas</a>
          <span className="text-slate-700">·</span>
          <a href="/radar" className="text-sky-400">Radar</a>
        </div>

        {loading ? (
          <Card><CardContent className="py-12 text-center text-slate-400">Cargando pipeline...</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto">
            {STAGES.map((stage) => {
              const cards = kanban?.[stage.key] ?? [];
              const isHover = hoverStage === stage.key;
              return (
                <div
                  key={stage.key}
                  onDragOver={(e) => onColumnDragOver(e, stage.key)}
                  onDragLeave={() => onColumnDragLeave(stage.key)}
                  onDrop={(e) => onColumnDrop(e, stage.key)}
                  className={`rounded-lg border-t-4 ${stage.color} ${
                    isHover
                      ? "bg-sky-500/10 ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-950"
                      : "bg-slate-900/40"
                  } p-3 min-h-[300px] transition-colors`}
                >
                  <div className={`${stage.headerBg} rounded px-2 py-1 mb-3`}>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      {stage.label}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">{cards.length} negocios</p>
                  </div>

                  <div className="space-y-2">
                    {cards.length === 0 ? (
                      <p
                        className={`text-xs italic text-center py-4 ${
                          isHover ? "text-sky-300" : "text-slate-600"
                        }`}
                      >
                        {isHover ? "↓ Soltá acá" : "Vacío"}
                      </p>
                    ) : (
                      cards.map((card) => {
                        const currentIdx = STAGES.findIndex((s) => s.key === stage.key);
                        const nextStage = STAGES[currentIdx + 1];
                        const prevStage = STAGES[currentIdx - 1];
                        const isDragging = draggingId === card.business_id;
                        return (
                          <Card
                            key={card.business_id}
                            className={`card-glass-hover cursor-grab active:cursor-grabbing ${
                              isDragging ? "opacity-40 scale-95" : ""
                            } transition-all`}
                            draggable
                            onDragStart={(e) => onDragStart(e, card.business_id)}
                            onDragEnd={onDragEnd}
                          >
                            <CardContent className="p-3 space-y-2">
                              <a
                                href={`/radar/${card.business_id}`}
                                className="block"
                                onClick={(e) => e.stopPropagation()}
                                draggable={false}
                              >
                                <p className="text-xs font-semibold text-slate-100 leading-tight line-clamp-2">
                                  {card.business_name}
                                </p>
                                {card.city && (
                                  <p className="text-[10px] text-slate-500">📍 {card.city}</p>
                                )}
                              </a>
                              {card.total_score !== null ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-base font-bold text-sky-300">
                                    {card.total_score}
                                  </span>
                                  {card.tier && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${TIER_BADGE[card.tier as keyof typeof TIER_BADGE] ?? TIER_BADGE.skip}`}>
                                      {card.tier}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                /* No score yet — show a "Calcular" button so
                                   the user can trigger the deterministic
                                   score inline. The API may also queue
                                   a background rescore on /api/crm/move. */
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    rescore(card.business_id);
                                  }}
                                  disabled={rescoringId === card.business_id}
                                  className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 disabled:opacity-50"
                                  title="Calcular score con los datos de Google Places"
                                >
                                  {rescoringId === card.business_id ? (
                                    <>
                                      <span
                                        className="inline-block w-2.5 h-2.5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin"
                                        aria-hidden="true"
                                      />
                                      Calculando...
                                    </>
                                  ) : (
                                    <>— Calcular</>
                                  )}
                                </button>
                              )}
                              {card.last_activity && (
                                <p className="text-[10px] text-slate-500 italic line-clamp-1">
                                  {card.last_activity}
                                </p>
                              )}
                              <div className="flex items-center gap-1 pt-1">
                                {prevStage && (
                                  <button
                                    onClick={() => moveToStage(card.business_id, prevStage.key)}
                                    className="text-[10px] text-slate-500 hover:text-slate-300 px-1"
                                    title={`Mover a ${prevStage.label}`}
                                  >
                                    ←
                                  </button>
                                )}
                                {nextStage && (
                                  <button
                                    onClick={() => moveToStage(card.business_id, nextStage.key)}
                                    className="text-[10px] text-sky-400 hover:text-sky-300 px-1 ml-auto"
                                    title={`Mover a ${nextStage.label}`}
                                  >
                                    {nextStage.label} →
                                  </button>
                                )}
                              </div>
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
    </main>
  );
}
