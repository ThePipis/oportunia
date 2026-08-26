"use client";

import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AddToCrmButton from "@/components/map/add-to-crm-button";

interface ListItem {
  list_id: string;
  business_id: string;
  business_name: string;
  address: string | null;
  city: string | null;
  total_score: number | null;
  tier: string | null;
  notes: string | null;
  added_at: number;
}

interface ListData {
  list: { id: string; name: string; description: string | null };
  items: ListItem[];
}

export default function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = useT();
  const unwrapped = React.use(params);
  const [data, setData] = React.useState<ListData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  const reload = React.useCallback(() => {
    fetch(`/api/lists/${unwrapped.id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [unwrapped.id]);

  React.useEffect(() => {
    reload();
  }, [reload]);

  const removeItem = async (businessId: string, name: string) => {
    if (!confirm(`¿Quitar "${name}" de esta lista?`)) return;
    setRemovingId(businessId);
    try {
      const res = await fetch(
        `/api/lists/${unwrapped.id}/items/${businessId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      reload();
    } catch (e: any) {
      alert(`Error al quitar: ${e.message}`);
    } finally {
      setRemovingId(null);
    }
  };

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ["Business", "Address", "City", "Score", "Tier", "Notes"].join(","),
      ...data.items.map((it) =>
        [
          `"${it.business_name.replace(/"/g, '""')}"`,
          `"${(it.address ?? "").replace(/"/g, '""')}"`,
          `"${it.city ?? ""}"`,
          it.total_score ?? "",
          it.tier ?? "",
          `"${(it.notes ?? "").replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.list.name.replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8 text-slate-400">{t("common.loading", "Cargando...")}</div>;
  if (!data) return <div className="p-8 text-red-300">{t("lists.notFound", "Lista no encontrada")}</div>;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-900 dark:text-slate-100">
            {data.list.name}
          </h1>
          {data.list.description && (
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
              {data.list.description}
            </p>
          )}
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-2 font-bold">
            {t("lists.prospectsInList", { count: data.items.length }, `${data.items.length} prospectos en esta lista`)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportCSV} variant="outline" size="sm" className="font-semibold">
            📥 {t("radar.exportCsv", "Exportar CSV")}
          </Button>
        </div>
      </div>

        {data.items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              {t("lists.emptyList", "Lista vacía. Agregá negocios desde el Radar.")}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {data.items.map((it) => (
              <Card key={it.business_id} className="card-glass-hover">
                <CardContent className="py-3 px-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <a href={`/radar/${it.business_id}`} className="block group">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors">
                        {it.business_name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {it.city ?? "?"} {it.address ? `· ${it.address}` : ""}
                      </p>
                    </a>
                  </div>
                  {it.total_score !== null && (
                    <div className="text-right">
                      <span className="text-lg font-bold text-sky-700 dark:text-sky-300 font-mono">{it.total_score}</span>
                      <span className="text-[10px] text-slate-500 ml-1">/100</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 shrink-0">
                    <AddToCrmButton
                      businessId={it.business_id}
                      businessName={it.business_name}
                    />
                    <button
                      onClick={() => removeItem(it.business_id, it.business_name)}
                      disabled={removingId === it.business_id}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-900 dark:bg-red-500/10 dark:hover:bg-red-500/25 dark:border-red-500/30 dark:text-red-300 dark:hover:text-red-100 transition-colors disabled:opacity-50 text-[14px]"
                      title={t("lists.removeFromList", "Quitar de la lista")}
                      aria-label={`${t("lists.removeFromList", "Quitar de la lista")} ${it.business_name}`}
                    >
                      {removingId === it.business_id ? (
                        <span
                          className="inline-block w-3 h-3 border-2 border-rose-600 dark:border-red-300 border-t-transparent rounded-full animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <span aria-hidden="true">✕</span>
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
  );
}
