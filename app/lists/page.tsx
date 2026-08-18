"use client";

import * as React from "react";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface List {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: number;
}

export default function ListsPage() {
  const [lists, setLists] = React.useState<List[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showNew, setShowNew] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/lists");
    const data = await res.json();
    setLists(data.lists ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const createList = async () => {
    if (!newName.trim()) return;
    await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, description: newDesc }),
    });
    setShowNew(false);
    setNewName("");
    setNewDesc("");
    await load();
  };

  const deleteList = async (id: string) => {
    if (!confirm("¿Eliminar esta lista?")) return;
    await fetch(`/api/lists/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <main className="min-h-screen bg-gradient-radial">
      <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display text-gradient-brand">Listas</h1>
            <p className="text-sm text-slate-400 mt-1">Agrupá prospectos en listas temáticas (ej. "Q3-2026-Outreach").</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button onClick={() => setShowNew(true)}>+ Nueva lista</Button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <a href="/" className="text-sky-400">← Inicio</a>
          <span className="text-slate-700">·</span>
          <a href="/crm" className="text-sky-400">CRM</a>
          <span className="text-slate-700">·</span>
          <a href="/radar" className="text-sky-400">Radar</a>
        </div>

        {showNew && (
          <Card className="border-sky-500/30">
            <CardContent className="pt-6 space-y-3">
              <input
                placeholder="Nombre de la lista (ej. 'Q3-2026-Outreach')"
                className="w-full bg-slate-900/60 border border-white/10 rounded-md px-3 py-2 text-sm text-slate-100"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <input
                placeholder="Descripción (opcional)"
                className="w-full bg-slate-900/60 border border-white/10 rounded-md px-3 py-2 text-sm text-slate-100"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Button onClick={createList}>Crear</Button>
                <Button variant="ghost" onClick={() => setShowNew(false)}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card><CardContent className="py-12 text-center text-slate-400">Cargando...</CardContent></Card>
        ) : lists.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-300">No hay listas todavía.</p>
              <Button onClick={() => setShowNew(true)} variant="secondary" className="mt-3">+ Crear primera lista</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lists.map((list) => (
              <Card key={list.id} className="card-glass-hover">
                <CardContent className="pt-5 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-100">{list.name}</h3>
                      {list.description && <p className="text-xs text-slate-500 mt-0.5">{list.description}</p>}
                      <p className="text-[10px] text-slate-600 mt-1">
                        Creada: {new Date(list.created_at * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteList(list.id)}
                      className="text-xs text-slate-500 hover:text-red-400"
                    >
                      Eliminar
                    </button>
                  </div>
                  <a
                    href={`/lists/${list.id}`}
                    className="block text-xs text-sky-400 hover:text-sky-300 pt-2 border-t border-white/5"
                  >
                    Ver items →
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
