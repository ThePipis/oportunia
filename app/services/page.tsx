"use client";

import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Service {
  id: string;
  tier: 1 | 2 | 3;
  name: string;
  name_en: string | null;
  icon: string | null;
  description: string;
  description_en: string | null;
  example: string | null;
  example_en: string | null;
  pain_solved: string | null;
  pain_solved_en: string | null;
  price_setup: number;
  price_monthly: number;
  pitch_template: string;
  pitch_template_en: string | null;
  category: string | null;
  active: number;
}

const TIER_META = {
  1: { label: "Tier 1 · Alta demanda", color: "from-orange-500 to-rose-500", badge: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  2: { label: "Tier 2 · Alto impacto", color: "from-sky-500 to-cyan-500", badge: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  3: { label: "Tier 3 · Premium", color: "from-violet-500 to-purple-500", badge: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
};

export default function ServicesPage() {
  const { t, locale } = useT();
  const [services, setServices] = React.useState<Service[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingService, setEditingService] = React.useState<Service | null>(null);
  const [editForm, setEditForm] = React.useState<Partial<Service>>({});
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/services");
    const data = await res.json();
    setServices(data.services ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const startEdit = (svc: Service) => {
    setEditingService(svc);
    setEditForm({
      name: svc.name,
      description: svc.description,
      price_setup: svc.price_setup,
      price_monthly: svc.price_monthly,
      pitch_template: svc.pitch_template,
    });
  };

  const cancelEdit = () => {
    setEditingService(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingService) return;
    setSaving(true);
    try {
      await fetch("/api/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingService.id, patch: editForm }),
      });
      await load();
      cancelEdit();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (svc: Service) => {
    await fetch("/api/services", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: svc.id, patch: { active: !svc.active } }),
    });
    await load();
  };

  const grouped = {
    1: services.filter((s) => s.tier === 1),
    2: services.filter((s) => s.tier === 2),
    3: services.filter((s) => s.tier === 3),
  };

  return (
    <main className="min-h-screen bg-gradient-radial">
      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-display text-gradient-brand">
              Catálogo de Servicios AI
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">
              Los 12 servicios que OportunIA matchea con cada negocio. Editá nombres, descripciones, precios y pitches.
            </p>
          </div>
          <LanguageToggle />
        </div>

        {/* Nav */}
        <div className="flex items-center gap-3 text-sm">
          <a href="/" className="text-sky-400 hover:text-sky-300">← Inicio</a>
          <span className="text-slate-700">·</span>
          <a href="/radar" className="text-sky-400 hover:text-sky-300">Radar</a>
          <span className="text-slate-700">·</span>
          <a href="/tools" className="text-sky-400 hover:text-sky-300">Tools</a>
          <span className="text-slate-700">·</span>
          <a href="/settings" className="text-sky-400 hover:text-sky-300">Settings</a>
        </div>

        {loading ? (
          <Card><CardContent className="py-12 text-center text-slate-400">Cargando servicios...</CardContent></Card>
        ) : (
          <>
            {([1, 2, 3] as const).map((tier) => {
              const meta = TIER_META[tier];
              const items = grouped[tier];
              if (items.length === 0) return null;
              return (
                <section key={tier}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${meta.badge}`}>
                      {meta.label}
                    </span>
                    <span className="text-xs text-slate-500">{items.length} servicios</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((svc) => (
                      <Card key={svc.id} className={`card-glass-hover ${!svc.active ? "opacity-50" : ""}`}>
                        <CardContent className="pt-6 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-3xl">{svc.icon ?? "🔧"}</span>
                              <div>
                                <h3 className="font-bold text-slate-100">{svc.name}</h3>
                                {svc.name_en && svc.name_en !== svc.name && (
                                  <p className="text-xs text-slate-500">{svc.name_en}</p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => toggleActive(svc)}
                              className="text-xs text-slate-500 hover:text-slate-300"
                              title={svc.active ? "Click para desactivar" : "Click para activar"}
                            >
                              {svc.active ? "🟢" : "⚫"}
                            </button>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                            {svc.description}
                          </p>

                          {svc.pain_solved && (
                            <p className="text-xs text-slate-500 italic">
                              💡 {svc.pain_solved.slice(0, 120)}{svc.pain_solved.length > 120 ? "..." : ""}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <span className="text-sm font-semibold text-sky-300">
                              ${svc.price_setup} + ${svc.price_monthly}/mo
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(svc)}
                            >
                              ✏️ Editar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}

        {/* Edit modal (simple inline) */}
        {editingService && (
          <Card className="border-orange-500/30">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-100">
                  Editando: {editingService.name}
                </h2>
                <button onClick={cancelEdit} className="text-slate-500 hover:text-slate-300">✕</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Nombre</label>
                  <input
                    className="w-full bg-slate-900/60 border border-white/10 rounded-md px-3 py-2 text-sm text-slate-100"
                    value={editForm.name ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Setup ($)</label>
                    <input
                      type="number"
                      className="w-full bg-slate-900/60 border border-white/10 rounded-md px-3 py-2 text-sm text-slate-100"
                      value={editForm.price_setup ?? 0}
                      onChange={(e) => setEditForm({ ...editForm, price_setup: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Mensual ($)</label>
                    <input
                      type="number"
                      className="w-full bg-slate-900/60 border border-white/10 rounded-md px-3 py-2 text-sm text-slate-100"
                      value={editForm.price_monthly ?? 0}
                      onChange={(e) => setEditForm({ ...editForm, price_monthly: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Descripción</label>
                <textarea
                  rows={3}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-md px-3 py-2 text-sm text-slate-100"
                  value={editForm.description ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Pitch Template (con placeholders)</label>
                <textarea
                  rows={4}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-md px-3 py-2 text-sm text-slate-100"
                  value={editForm.pitch_template ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, pitch_template: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button onClick={saveEdit} disabled={saving}>
                  {saving ? "Guardando..." : "💾 Guardar"}
                </Button>
                <Button variant="ghost" onClick={cancelEdit}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
