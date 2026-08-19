"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LocationSearch from "@/components/map/location-search";
import CategoryMultiSelect from "@/components/map/category-multi-select";
import type { BusinessMarker } from "@/lib/map/types";
import { milesToMeters, metersToMiles } from "@/lib/utils/distance";
import {
  useRadarSearchState,
  type SearchResult,
} from "@/lib/hooks/use-radar-search-state";

// Leaflet uses `window`, so the map must be dynamically imported with ssr:false
const RadarMap = dynamic(() => import("@/components/map/radar-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-slate-900/50 rounded-lg">
      <div className="inline-block w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      <span className="ml-3 text-slate-400">Cargando mapa...</span>
    </div>
  ),
});

interface SearchResponse {
  results: SearchResult[];
  saved: number;
  total_found: number;
  error?: string;
}

/**
 * Strip the protocol prefix from a URL so it fits in a tight column.
 * e.g. "https://www.example.com/path" -> "www.example.com/path"
 */
function shortUrl(url: string | null | undefined): string {
  if (!url) return "";
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
}

export default function RadarPage() {
  const { t } = useT();
  const { state, update, clear, hydrated } = useRadarSearchState();

  // Destructure the persisted state for convenient access in JSX / handlers
  const {
    query,
    selectedCategoryIds,
    city,
    radiusMiles,
    maxResults,
    origin,
    selectedBusinessId,
    results,
    totalFound,
    searched,
  } = state;

  // Transient (not persisted): loading + error. These reset on every mount.
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Hover highlight — purely visual, does NOT persist. Allows the user to
  // sweep the mouse down the list and see the corresponding pin glow on
  // the map without committing to a selection.
  const [hoveredBusinessId, setHoveredBusinessId] = React.useState<
    string | null
  >(null);
  const effectiveSelectedId = hoveredBusinessId ?? selectedBusinessId;

  const canSearch = selectedCategoryIds.length > 0 || query.trim().length > 0;

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSearch) return;

    setLoading(true);
    setError(null);
    update({ searched: true, selectedBusinessId: null });

    try {
      const res = await fetch("/api/radar/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          categoryIds: selectedCategoryIds,
          origin,
          radiusMiles,
          maxResults,
        }),
      });

      const data: SearchResponse = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Error ${res.status}`);
        update({ results: [], totalFound: 0 });
      } else {
        update({
          results: data.results ?? [],
          totalFound: data.total_found ?? 0,
        });
        if (data.error) setError(data.error);
      }
    } catch (err: any) {
      setError(err.message ?? "Error desconocido");
      update({ results: [] });
    } finally {
      setLoading(false);
    }
  };

  // Map the search results into BusinessMarker shape for the map
  const mapMarkers: BusinessMarker[] = React.useMemo(() => {
    return results
      .filter((r) => r.lat != null && r.lng != null)
      .map((r) => ({
        id: r.id,
        name: r.name,
        lat: r.lat!,
        lng: r.lng!,
        category: r.primary_type,
        rating: r.rating,
        reviewCount: r.review_count,
        address: r.address,
        phone: r.phone,
        website: r.website,
        distanceMiles: r.distance_miles,
      }));
  }, [results]);

  return (
    <main className="min-h-screen bg-gradient-radial">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-gradient-brand">
              {t("radar.title")}
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              {t("radar.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <a href="/" className="text-sky-400 hover:text-sky-300">← Inicio</a>
            <span className="text-slate-700">·</span>
            <a href="/tools" className="text-sky-400 hover:text-sky-300">Tools</a>
          </div>
        </div>

        {/* Restored-search banner */}
        {hydrated && searched && results.length > 0 && (
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-sky-500/10 border border-sky-500/30 text-xs text-sky-300">
            <span>
              🔁 Búsqueda anterior restaurada ({results.length} resultados)
            </span>
            <button
              onClick={clear}
              className="text-sky-300 hover:text-sky-100 underline underline-offset-2"
            >
              Limpiar y empezar de nuevo
            </button>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="py-3 px-4 text-sm text-red-300 flex items-start justify-between gap-2">
              <span>
                ⚠️ {error}
                {error.includes("Google Places") && (
                  <span className="block mt-1 text-xs text-red-400">
                    → Configura tu API key en <a href="/tools" className="underline">/tools</a>
                  </span>
                )}
              </span>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-200 text-lg leading-none"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </CardContent>
          </Card>
        )}

        {/* ───────── Top section: Map + Form (2-column on tablet+) ───────── */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-4">
          {/* Map (left, larger) — fixed height so the form aligns with it */}
          <div className="relative h-[500px] lg:h-[620px] rounded-lg overflow-hidden border border-white/10 bg-slate-900/40">
            <RadarMap
              center={origin}
              radiusMeters={milesToMeters(radiusMiles)}
              onRadiusChange={(m) =>
                update({ radiusMiles: metersToMiles(m) })
              }
              businesses={mapMarkers}
              selectedId={effectiveSelectedId}
              onCenterChange={(lat, lng) => update({ origin: { lat, lng } })}
              onSelectBusiness={(id) =>
                update({ selectedBusinessId: id })
              }
            />
          </div>

          {/* Form (right, compact) */}
          <Card>
            <CardContent className="pt-5 space-y-3">
              <form onSubmit={handleSearch} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-xs">Ubicación</Label>
                  <LocationSearch
                    value={hydrated ? city : ""}
                    onChange={(v) => update({ city: v })}
                    onLocationSelect={(lat, lng) =>
                      update({ origin: { lat, lng } })
                    }
                    placeholder="Ciudad, dirección o lugar..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Categoría</Label>
                  <CategoryMultiSelect
                    value={selectedCategoryIds}
                    onChange={(v) => update({ selectedCategoryIds: v })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="query" className="text-xs">
                    Búsqueda personalizada
                    <span className="ml-1 text-slate-500 font-normal">(opcional)</span>
                  </Label>
                  <Input
                    id="query"
                    placeholder="ej. 'abierto 24/7'"
                    value={query}
                    onChange={(e) => update({ query: e.target.value })}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <Label htmlFor="maxResults" className="text-slate-400 text-[11px]">
                      Máx resultados
                    </Label>
                    <span className="font-mono text-slate-300 text-[11px]">{maxResults}</span>
                  </div>
                  <input
                    id="maxResults"
                    type="range"
                    min="5"
                    max="40"
                    value={maxResults}
                    onChange={(e) =>
                      update({ maxResults: parseInt(e.target.value) })
                    }
                    className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-sky-500"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    type="submit"
                    disabled={loading}
                    size="default"
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      <>🔍 Buscar en el mapa</>
                    )}
                  </Button>
                  {(searched || query || selectedCategoryIds.length > 0) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={clear}
                      aria-label="Limpiar búsqueda"
                      title="Limpiar búsqueda"
                      className="shrink-0 px-3"
                    >
                      ✕
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* ───────── Bottom section: Results table (full width) ───────── */}
        {loading && (
          <Card>
            <CardContent className="py-10 text-center">
              <div className="inline-block w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              <p className="mt-2 text-sm text-slate-400">
                Buscando en Google Places...
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && searched && results.length === 0 && !error && (
          <Card>
            <CardContent className="py-10 text-center">
              <div className="text-3xl mb-2">🤷</div>
              <p className="text-sm text-slate-400">Sin resultados</p>
            </CardContent>
          </Card>
        )}

        {!loading && results.length > 0 && (
          <Card>
            <CardContent className="pt-5 pb-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p className="text-sm">
                  <span className="font-bold text-sky-400 text-lg">{results.length}</span>
                  <span className="text-slate-400"> de </span>
                  <span className="font-mono text-slate-500">{totalFound}</span>
                  <span className="text-slate-400"> encontrados</span>
                </p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500 hidden sm:inline">
                    Pasá el mouse por una fila para resaltar el pin en el mapa
                  </span>
                  <button
                    onClick={clear}
                    className="text-sky-300 hover:text-sky-100 underline underline-offset-2"
                  >
                    Nueva búsqueda
                  </button>
                </div>
              </div>

              {/* Wide results table */}
              <div className="overflow-x-auto rounded-md border border-white/5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-900/60 text-[11px] uppercase tracking-wide text-slate-400 border-b border-white/5">
                      <th className="text-left font-semibold py-2.5 pl-3 pr-2 w-[28%]">
                        Negocio
                      </th>
                      <th className="text-left font-semibold py-2.5 px-2 w-[20%]">
                        Dirección
                      </th>
                      <th className="text-left font-semibold py-2.5 px-2 w-[14%]">
                        Teléfono
                      </th>
                      <th className="text-left font-semibold py-2.5 px-2 w-[16%]">
                        Web
                      </th>
                      <th className="text-center font-semibold py-2.5 px-2 w-[8%]">
                        ⭐ Rating
                      </th>
                      <th className="text-right font-semibold py-2.5 px-2 w-[7%]">
                        Distancia
                      </th>
                      <th className="text-right font-semibold py-2.5 pl-2 pr-3 w-[7%]">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => {
                      const isSelected = r.id === effectiveSelectedId;
                      const webShort = shortUrl(r.website);
                      const mapsHref = r.lat != null && r.lng != null
                        ? `https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}`
                        : null;
                      return (
                        <tr
                          key={r.id}
                          onMouseEnter={() => setHoveredBusinessId(r.id)}
                          onMouseLeave={() => setHoveredBusinessId(null)}
                          onClick={() => update({ selectedBusinessId: r.id })}
                          className={`border-b border-white/5 transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-orange-500/10"
                              : "hover:bg-slate-800/40"
                          }`}
                        >
                          {/* Name + category */}
                          <td className="py-2.5 pl-3 pr-2 align-top">
                            <div className="font-medium text-slate-100 truncate">
                              {r.name}
                            </div>
                            {r.primary_type && (
                              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                {r.primary_type.replace(/_/g, " ")}
                              </div>
                            )}
                          </td>

                          {/* Address */}
                          <td className="py-2.5 px-2 align-top text-slate-300 text-[12px]">
                            {r.address ? (
                              <span className="line-clamp-2">{r.address}</span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>

                          {/* Phone (click-to-call, stops row click) */}
                          <td className="py-2.5 px-2 align-top text-[12px]">
                            {r.phone ? (
                              <a
                                href={`tel:${r.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-sky-400 hover:text-sky-300 hover:underline tabular-nums"
                              >
                                {r.phone}
                              </a>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>

                          {/* Web (click-to-open, stops row click) */}
                          <td className="py-2.5 px-2 align-top text-[12px]">
                            {webShort ? (
                              <a
                                href={r.website!}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-sky-400 hover:text-sky-300 hover:underline truncate inline-block max-w-full align-middle"
                                title={r.website ?? undefined}
                              >
                                {webShort}
                              </a>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>

                          {/* Rating */}
                          <td className="py-2.5 px-2 align-top text-center">
                            {r.rating != null ? (
                              <div className="inline-flex items-baseline gap-1">
                                <span className="text-amber-400 font-bold text-[13px]">
                                  {r.rating.toFixed(1)}
                                </span>
                                {r.review_count != null && (
                                  <span className="text-[10px] text-slate-500 tabular-nums">
                                    ({r.review_count})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>

                          {/* Distance */}
                          <td className="py-2.5 px-2 align-top text-right">
                            {r.distance_miles != null ? (
                              <span className="font-mono text-[12px] text-sky-300 tabular-nums">
                                {r.distance_miles.toFixed(1)} mi
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-2.5 pl-2 pr-3 align-top text-right">
                            <div
                              className="inline-flex items-center gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {mapsHref && (
                                <a
                                  href={mapsHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Abrir en Google Maps"
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white text-[14px] border border-white/5"
                                >
                                  🗺️
                                </a>
                              )}
                              <Link
                                href={`/radar/${r.id}`}
                                title="Ver perfil completo + talking points"
                                className="inline-flex items-center gap-1 px-2.5 h-7 rounded-md bg-orange-500/90 hover:bg-orange-500 text-white text-[11px] font-semibold border border-orange-400/50"
                              >
                                Perfil
                                <span aria-hidden="true">→</span>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {!searched && !loading && hydrated && (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="text-3xl mb-2">◎</div>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Configurá la búsqueda arriba y vas a ver los resultados en el mapa y en la tabla.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
