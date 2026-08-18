"use client";

import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SearchResult {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  rating: number | null;
  review_count: number | null;
  distance_miles: number | null;
  primary_type: string | null;
}

interface SearchResponse {
  results: SearchResult[];
  saved: number;
  total_found: number;
  error?: string;
}

// Default origin: 7940 Vandewater St, Eastvale, CA (user's home)
const DEFAULT_ORIGIN = {
  lat: 33.9425,
  lng: -117.5632,
};

const SECTOR_PRESETS = [
  { value: "plumbers", label: "Plomería" },
  { value: "hvac", label: "HVAC / Aire acondicionado" },
  { value: "electricians", label: "Eléctricos" },
  { value: "roofing", label: "Techado" },
  { value: "dentists", label: "Dentistas" },
  { value: "auto repair", label: "Auto repair" },
  { value: "restaurants", label: "Restaurantes" },
  { value: "beauty salons", label: "Salones de belleza" },
  { value: "lawyers", label: "Abogados" },
  { value: "real estate", label: "Bienes raíces" },
  { value: "landscaping", label: "Jardinería" },
  { value: "pest control", label: "Control de plagas" },
];

const CITY_PRESETS = [
  "Eastvale, CA",
  "Corona, CA",
  "Norco, CA",
  "Riverside, CA",
  "Ontario, CA",
  "Chino Hills, CA",
  "Rancho Cucamonga, CA",
  "Fontana, CA",
  "Moreno Valley, CA",
  "Temecula, CA",
];

export default function RadarPage() {
  const { t } = useT();

  const [query, setQuery] = React.useState("");
  const [city, setCity] = React.useState("Corona, CA");
  const [radius, setRadius] = React.useState(5);
  const [maxResults, setMaxResults] = React.useState(15);
  const [sectorPreset, setSectorPreset] = React.useState("hvac");

  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [searched, setSearched] = React.useState(false);
  const [totalFound, setTotalFound] = React.useState(0);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() && !sectorPreset) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const finalQuery = query.trim() || sectorPreset;
      const locationQuery = city ? `${sectorPreset || ""} ${finalQuery} in ${city}`.trim() : finalQuery;

      const res = await fetch("/api/radar/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: locationQuery,
          origin: DEFAULT_ORIGIN,
          radiusMiles: radius,
          maxResults,
        }),
      });

      const data: SearchResponse = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Error ${res.status}`);
        setResults([]);
        setTotalFound(0);
      } else {
        setResults(data.results ?? []);
        setTotalFound(data.total_found ?? 0);
        if (data.error) setError(data.error);
      }
    } catch (err: any) {
      setError(err.message ?? "Error desconocido");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-radial">
      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-display text-gradient-brand">
              {t("radar.title")}
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">
              {t("radar.subtitle")}
            </p>
          </div></div>

        {/* Nav */}
        <div className="flex items-center gap-3 text-sm">
          <a href="/" className="text-sky-400 hover:text-sky-300">
            ← Inicio
          </a>
          <span className="text-slate-700">·</span>
          <a href="/tools" className="text-sky-400 hover:text-sky-300">
            Tools
          </a>
        </div>

        {/* Search form */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="sector">Sector / Nicho</Label>
                  <select
                    id="sector"
                    className="flex h-10 w-full rounded-md border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                    value={sectorPreset}
                    onChange={(e) => setSectorPreset(e.target.value)}
                  >
                    {SECTOR_PRESETS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <select
                    id="city"
                    className="flex h-10 w-full rounded-md border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  >
                    {CITY_PRESETS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="radius">Radio (millas): {radius}</Label>
                  <input
                    id="radius"
                    type="range"
                    min="1"
                    max="25"
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3 space-y-2">
                  <Label htmlFor="query">Búsqueda personalizada (opcional)</Label>
                  <Input
                    id="query"
                    placeholder="ej. 'plumbers open 24/7' o 'family dentists'"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxResults">Máx resultados: {maxResults}</Label>
                  <input
                    id="maxResults"
                    type="range"
                    min="5"
                    max="40"
                    value={maxResults}
                    onChange={(e) => setMaxResults(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={loading} size="lg">
                  {loading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>🔍 Buscar negocios</>
                  )}
                </Button>
                <span className="text-xs text-slate-500">
                  Origen: 7940 Vandewater St, Eastvale, CA
                </span>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Error banner */}
        {error && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="py-3 px-4 text-sm text-red-300">
              ⚠️ {error}
              {error.includes("Google Places") && (
                <span className="block mt-1 text-xs text-red-400">
                  → Configura tu API key en <a href="/tools" className="underline">/tools</a>
                </span>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="inline-block w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              <p className="mt-3 text-slate-400">
                Buscando en Google Places y guardando resultados...
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Esto puede tomar 5-15 segundos según la cantidad de resultados
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && searched && results.length === 0 && !error && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-5xl mb-3">🤷</div>
              <p className="text-slate-300 font-medium">Sin resultados</p>
              <p className="text-sm text-slate-500 mt-1">
                {t("radar.results.noResults")}
              </p>
              <p className="text-xs text-slate-600 mt-3">
                Google Places encontró {totalFound} resultados en su búsqueda,
                pero ninguno pasó nuestros filtros de calidad.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && results.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-300">
                <span className="font-semibold text-sky-400">{results.length}</span>{" "}
                negocios guardados
                {totalFound > results.length && (
                  <span className="text-slate-500">
                    {" "}
                    (de {totalFound} encontrados en Google)
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-500">
                Próximo paso: Phase 3 (scoring 5D) y Phase 4 (fichas)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((r) => (
                <Card key={r.id} className="card-glass-hover">
                  <CardContent className="pt-6 space-y-3">
                    <div>
                      <h3 className="font-semibold text-slate-100 leading-tight">
                        {r.name}
                      </h3>
                      {r.primary_type && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {r.primary_type}
                        </p>
                      )}
                    </div>

                    {r.address && (
                      <p className="text-xs text-slate-400 leading-relaxed">
                        📍 {r.address}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs">
                      {r.rating !== null && r.rating !== undefined ? (
                        <span className="text-amber-300">
                          ⭐ {r.rating.toFixed(1)}
                          {r.review_count !== null && (
                            <span className="text-slate-500"> ({r.review_count})</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-500">Sin rating</span>
                      )}
                      {r.distance_miles !== null && r.distance_miles !== undefined && (
                        <span className="text-sky-300">
                          {r.distance_miles.toFixed(1)} mi
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-white/5">
                      <a
                        href={`/radar/${r.id}`}
                        className="text-xs text-sky-400 hover:text-sky-300"
                      >
                        Ver ficha completa →
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Initial state */}
        {!searched && !loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-5xl mb-3">◎</div>
              <p className="text-slate-300 font-medium">Radar listo</p>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Elegí un sector y ciudad, y vamos a buscar negocios reales en Google Places.
                Cada resultado se guarda con datos verificados (sin alucinar).
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
