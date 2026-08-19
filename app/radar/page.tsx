"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BusinessSidePanel from "@/components/map/business-side-panel";
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

  // The active search query: prefer the multi-select categories; if none
  // selected, fall back to free-text `query`. The actual category queries
  // are resolved by the API by looking up the selected ids in the DB.
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

  const selectedBusiness = mapMarkers.find((b) => b.id === selectedBusinessId) ?? null;

  // Track which business is "highlighted" because the user just clicked it
  // in the list. The highlight survives navigation back to the radar even
  // though the list item itself is now a Link to the full profile.
  const [hoveredBusinessId, setHoveredBusinessId] = React.useState<
    string | null
  >(null);

  // After hydration, if there was a selected business from the persisted
  // state, keep it visible (e.g. so the map marker stays highlighted after
  // the user returns from a profile page).
  const effectiveSelectedId = hoveredBusinessId ?? selectedBusinessId;

  return (
    <main className="min-h-screen bg-gradient-radial">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
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

        {/* Restored-search banner — only visible right after hydration
            if there's a previously-saved search to show. Tells the user
            "we remembered your last search" so they aren't confused. */}
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

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4">
          {/* Map (left, larger) */}
          <div className="relative h-[500px] lg:h-[700px] rounded-lg overflow-hidden border border-white/10">
            <RadarMap
              center={origin}
              radiusMeters={milesToMeters(radiusMiles)}
              onRadiusChange={(m) =>
                update({ radiusMiles: metersToMiles(m) })
              }
              businesses={mapMarkers}
              selectedId={effectiveSelectedId}
              onCenterChange={(lat, lng) => update({ origin: { lat, lng } })}
              onSelectBusiness={(id) => {
                setHoveredBusinessId(id);
                update({ selectedBusinessId: id });
              }}
            />
            <BusinessSidePanel
              business={selectedBusiness}
              origin={origin}
              onClose={() => {
                setHoveredBusinessId(null);
                update({ selectedBusinessId: null });
              }}
            />
          </div>

          {/* Sidebar (right, narrower) */}
          <div className="space-y-4">
            {/* Search controls */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ubicación</Label>
                    <LocationSearch
                      value={hydrated ? city : ""}
                      onChange={(v) => update({ city: v })}
                      onLocationSelect={(lat, lng) =>
                        update({ origin: { lat, lng } })
                      }
                      placeholder="Ciudad, dirección, avenida o lugar..."
                    />
                    <p className="text-[11px] text-slate-500">
                      Escribí cualquier ciudad, calle o lugar del mundo. El pin del mapa se mueve al seleccionar.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <CategoryMultiSelect
                      value={selectedCategoryIds}
                      onChange={(v) => update({ selectedCategoryIds: v })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="query">Búsqueda personalizada (opcional)</Label>
                    <Input
                      id="query"
                      placeholder="ej. 'abierto 24/7' o 'acepta efectivo'"
                      value={query}
                      onChange={(e) => update({ query: e.target.value })}
                    />
                    <p className="text-[11px] text-slate-500">
                      Se agrega a cada categoría seleccionada. Ej: HVAC + "abierto 24/7".
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <Label htmlFor="maxResults" className="text-slate-400">Máx resultados</Label>
                      <span className="font-mono text-slate-300">{maxResults}</span>
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
                      className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-sky-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={loading}
                      size="lg"
                      className="flex-1"
                    >
                      {loading ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                        size="lg"
                        onClick={clear}
                        aria-label="Limpiar búsqueda"
                        title="Limpiar búsqueda"
                        className="shrink-0"
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Results list */}
            {loading && (
              <Card>
                <CardContent className="py-8 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                  <p className="mt-2 text-sm text-slate-400">
                    Buscando en Google Places...
                  </p>
                </CardContent>
              </Card>
            )}

            {!loading && searched && results.length === 0 && !error && (
              <Card>
                <CardContent className="py-8 text-center">
                  <div className="text-3xl mb-2">🤷</div>
                  <p className="text-sm text-slate-400">Sin resultados</p>
                </CardContent>
              </Card>
            )}

            {!loading && results.length > 0 && (
              <Card>
                <CardContent className="pt-4 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm">
                      <span className="font-bold text-sky-400">{results.length}</span>{" "}
                      <span className="text-slate-400">de </span>
                      <span className="font-mono text-xs text-slate-500">{totalFound}</span>{" "}
                      <span className="text-slate-400">encontrados</span>
                    </p>
                    <button
                      onClick={clear}
                      className="text-[11px] text-slate-400 hover:text-slate-100 underline underline-offset-2"
                    >
                      Nueva búsqueda
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                    {results.map((r) => {
                      const isSelected = r.id === effectiveSelectedId;
                      return (
                        <Link
                          key={r.id}
                          href={`/radar/${r.id}`}
                          onMouseEnter={() => setHoveredBusinessId(r.id)}
                          onMouseLeave={() => setHoveredBusinessId(null)}
                          onClick={() => update({ selectedBusinessId: r.id })}
                          className={`block w-full text-left p-2 rounded-md border transition-colors ${
                            isSelected
                              ? "bg-orange-500/15 border-orange-500/40"
                              : "bg-slate-900/40 border-white/5 hover:bg-slate-800/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-slate-100 truncate">
                                {r.name}
                              </div>
                              {r.address && (
                                <div className="text-[11px] text-slate-500 truncate">
                                  {r.address}
                                </div>
                              )}
                            </div>
                            <div className="text-right shrink-0 text-[10px]">
                              {r.rating != null && (
                                <div className="text-amber-400">⭐ {r.rating.toFixed(1)}</div>
                              )}
                              {r.distance_miles != null && (
                                <div className="text-sky-300 font-mono">
                                  {r.distance_miles.toFixed(1)}mi
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {!searched && !loading && hydrated && (
              <Card>
                <CardContent className="py-6 text-center">
                  <div className="text-2xl mb-2">◎</div>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Configurá la búsqueda y vas a ver los resultados en el mapa.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
