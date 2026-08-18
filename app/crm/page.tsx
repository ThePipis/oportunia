"use client";

import * as React from "react";
import { LanguageToggle } from "@/components/layout/language-toggle";
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
];

const TIER_BADGE = {
  hot: "bg-amber-500/20 text-amber-300",
  warm: "bg-sky-500/20 text-sky-300",
  nurture: "bg-emerald-500/20 text-emerald-300",
  skip: "bg-slate-700 text-slate-400",
};

export default function CRMPage() {
  const [kanban, setKanban] = React.useState<Record<string, KanbanCard[]> | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/crm/kanban");
    const data = await res.json();
    setKanban(data.kanban);
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const moveToStage = async (businessId: string, stage: string) => {
    await fetch("/api/crm/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id: businessId, stage }),
    });
    await load();
  };

  return (
    <main className="min-h-screen bg-gradient-radial">
      <div className="p-6 md:p-8 space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display text-gradient-brand">CRM · Pipeline</h1>
            <p className="text-sm text-slate-400 mt-1">
              Click en una card para mover al siguiente stage. Lead → Contactado → Reunión → Propuesta → Cerrado.
            </p>
          </div>
          <LanguageToggle />
        </div>

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
              return (
                <div key={stage.key} className={`rounded-lg border-t-4 ${stage.color} bg-slate-900/40 p-3 min-h-[300px]`}>
                  <div className={`${stage.headerBg} rounded px-2 py-1 mb-3`}>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      {stage.label}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">{cards.length} negocios</p>
                  </div>

                  <div className="space-y-2">
                    {cards.length === 0 ? (
                      <p className="text-xs text-slate-600 italic text-center py-4">
                        Vacío
                      </p>
                    ) : (
                      cards.map((card) => {
                        const currentIdx = STAGES.findIndex((s) => s.key === stage.key);
                        const nextStage = STAGES[currentIdx + 1];
                        const prevStage = STAGES[currentIdx - 1];
                        return (
                          <Card key={card.business_id} className="card-glass-hover">
                            <CardContent className="p-3 space-y-2">
                              <a
                                href={`/radar/${card.business_id}`}
                                className="block"
                              >
                                <p className="text-xs font-semibold text-slate-100 leading-tight line-clamp-2">
                                  {card.business_name}
                                </p>
                                {card.city && (
                                  <p className="text-[10px] text-slate-500">📍 {card.city}</p>
                                )}
                              </a>
                              {card.total_score !== null && (
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
