"use client";

import * as React from "react";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  const unwrapped = React.use(params);
  const [data, setData] = React.useState<ListData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`/api/lists/${unwrapped.id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [unwrapped.id]);

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

  if (loading) return <div className="p-8 text-slate-400">Cargando...</div>;
  if (!data) return <div className="p-8 text-red-300">Lista no encontrada</div>;

  return (
    <main className="min-h-screen bg-gradient-radial">
      <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display text-gradient-brand">{data.list.name}</h1>
            {data.list.description && <p className="text-sm text-slate-400 mt-1">{data.list.description}</p>}
            <p className="text-xs text-slate-500 mt-2">{data.items.length} items</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button onClick={exportCSV} variant="secondary" size="sm">📥 Exportar CSV</Button>
          </div>
        </div>

        <div className="text-sm">
          <a href="/lists" className="text-sky-400">← Listas</a>
        </div>

        {data.items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-400">
              Lista vacía. Agregá negocios desde <a href="/radar" className="text-sky-400">/radar</a>.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {data.items.map((it) => (
              <Card key={it.business_id} className="card-glass-hover">
                <CardContent className="py-3 px-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <a href={`/radar/${it.business_id}`} className="block">
                      <p className="text-sm font-semibold text-slate-100 hover:text-sky-300">
                        {it.business_name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {it.city ?? "?"} {it.address ? `· ${it.address}` : ""}
                      </p>
                    </a>
                  </div>
                  {it.total_score !== null && (
                    <div className="text-right">
                      <span className="text-lg font-bold text-sky-300">{it.total_score}</span>
                      <span className="text-[10px] text-slate-500 ml-1">/100</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
