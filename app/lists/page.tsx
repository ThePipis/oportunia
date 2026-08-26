"use client";

import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface List {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: number;
}

// Module-level in-memory cache for 0ms instant switching between sections
let cachedListsData: List[] | null = null;

export default function ListsPage() {
  const { t } = useT();
  const [lists, setLists] = React.useState<List[]>(() => cachedListsData ?? []);
  const [loading, setLoading] = React.useState(() => !cachedListsData);
  const [showNew, setShowNew] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");

  const load = React.useCallback(async () => {
    if (!cachedListsData) setLoading(true);
    try {
      const res = await fetch("/api/lists");
      const data = await res.json();
      cachedListsData = data.lists ?? [];
      setLists(data.lists ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
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
    if (!confirm(t("common.delete", "¿Eliminar esta lista?"))) return;
    await fetch(`/api/lists/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-900 dark:text-slate-100">
            {t("lists.title", "Listas de Clientes")}
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
            {t("lists.subtitle", "Agrupa prospectos en listas temáticas para campañas de outreach y seguimiento comercial.")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowNew(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
            {t("lists.newList", "+ Nueva lista")}
          </Button>
        </div>
      </div>

        <div className="flex items-center gap-3 text-sm">
          <a href="/" className="text-sky-700 dark:text-sky-400 hover:underline font-medium">← {t("nav.dashboard", "Inicio")}</a>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <a href="/crm" className="text-sky-700 dark:text-sky-400 hover:underline font-medium">{t("nav.crm", "CRM")}</a>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <a href="/radar" className="text-sky-700 dark:text-sky-400 hover:underline font-medium">{t("nav.prospector", "Radar")}</a>
        </div>

        {showNew && (
          <Card className="border-sky-500/30">
            <CardContent className="pt-6 space-y-3">
              <input
                placeholder={t("lists.namePlaceholder", "Nombre de la lista (ej. 'Q3-2026-Outreach')")}
                className="w-full bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-white/10 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <input
                placeholder={t("lists.descPlaceholder", "Descripción (opcional)")}
                className="w-full bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-white/10 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Button onClick={createList}>{t("lists.createBtn", "Crear")}</Button>
                <Button variant="ghost" onClick={() => setShowNew(false)}>{t("common.cancel", "Cancelar")}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card><CardContent className="py-12 text-center text-slate-400">{t("lists.loading", "Cargando...")}</CardContent></Card>
        ) : lists.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-600 dark:text-slate-300">{t("lists.empty", "No hay listas todavía.")}</p>
              <Button onClick={() => setShowNew(true)} variant="secondary" className="mt-3">{t("lists.newList", "+ Crear primera lista")}</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lists.map((list) => (
              <Card key={list.id} className="card-glass-hover">
                <CardContent className="pt-5 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{list.name}</h3>
                      {list.description && <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{list.description}</p>}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        {t("lists.createdOn", { date: new Date(list.created_at * 1000).toLocaleDateString() }, `Creada el ${new Date(list.created_at * 1000).toLocaleDateString()}`)}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteList(list.id)}
                      className="text-xs text-slate-500 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors"
                    >
                      {t("common.delete", "Eliminar")}
                    </button>
                  </div>
                  <a
                    href={`/lists/${list.id}`}
                    className="block text-xs text-sky-700 dark:text-sky-400 hover:underline pt-2 border-t border-slate-200/80 dark:border-white/5 font-semibold"
                  >
                    {t("lists.viewList", "Ver items →")}
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
  );
}
