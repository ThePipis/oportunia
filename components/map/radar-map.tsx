"use client";

/**
 * RadarMap — interactive Leaflet map for the radar search.
 *
 * Features:
 * - OpenStreetMap tiles (no API key required)
 * - Draggable center pin (sets new search origin)
 * - Adjustable radius circle (m/km slider controlled from parent)
 * - Business markers with auto-clustering at low zoom
 * - Click on marker opens side panel via onSelectBusiness
 *
 * Leaflet uses `window` so this component must be dynamically imported
 * with ssr: false in the page that uses it.
 */

import { useEffect, useRef, useMemo, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import type { BusinessMarker } from "@/lib/map/types";
import MapRadiusControl from "./map-radius-control";

interface RadarMapProps {
  /** Map center (lat/lng) — also the search origin */
  center: { lat: number; lng: number };
  /** Radius in meters */
  radiusMeters: number;
  /** Businesses to display as markers */
  businesses: BusinessMarker[];
  /** Currently selected/hovered business id (for visual highlight color) */
  selectedId?: string | null;
  /** Currently focused business id (triggers flyTo, auto-zoom, and unclustering) */
  focusedBusinessId?: string | null;
  /** Fired when the user drags the center pin to a new location */
  onCenterChange: (lat: number, lng: number) => void;
  /** Fired when the user clicks a business marker */
  onSelectBusiness: (id: string) => void;
  /** Fired when the user changes the radius from the map's overlay control */
  onRadiusChange?: (meters: number) => void;
}

/** Default Leaflet markers don't work with bundlers; use a custom DivIcon */
const centerIcon = L.divIcon({
  className: "",
  html: '<div class="center-pin"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const businessIcon = (
  isSelected: boolean,
  score?: number | null,
  tier?: string | null
) => {
  // Reasignación de colores según requerimiento:
  // HOT (>= 75): Rojo
  // WARM (60 - 74): Verde
  // NURTURE (40 - 59): Naranja
  // SKIP (< 40): Amarillo
  let bgGradient = "linear-gradient(135deg, #22c55e, #16a34a)";
  let shadowGlow = "0 2px 6px rgba(0,0,0,0.35)";
  let textColor = "#ffffff";
  let haloColor = "rgba(34, 197, 94, 0.55)";

  const effectiveTier = tier?.toLowerCase();

  if (score != null) {
    if (score >= 75 || effectiveTier === "hot") {
      // Hot: Rojo
      bgGradient = "linear-gradient(135deg, #ef4444, #dc2626)";
      haloColor = "rgba(239, 68, 68, 0.55)";
      shadowGlow = isSelected
        ? `0 0 0 6px ${haloColor}, 0 4px 14px rgba(0,0,0,0.6)`
        : "0 2px 8px rgba(220, 38, 38, 0.45)";
    } else if (score >= 60 || effectiveTier === "warm") {
      // Warm: Verde
      bgGradient = "linear-gradient(135deg, #22c55e, #16a34a)";
      haloColor = "rgba(34, 197, 94, 0.55)";
      shadowGlow = isSelected
        ? `0 0 0 6px ${haloColor}, 0 4px 14px rgba(0,0,0,0.6)`
        : "0 2px 8px rgba(22, 163, 74, 0.4)";
    } else if (score >= 40 || effectiveTier === "nurture") {
      // Nurture: Naranja
      bgGradient = "linear-gradient(135deg, #f97316, #ea580c)";
      haloColor = "rgba(249, 115, 22, 0.55)";
      shadowGlow = isSelected
        ? `0 0 0 6px ${haloColor}, 0 4px 14px rgba(0,0,0,0.6)`
        : "0 2px 8px rgba(234, 88, 12, 0.4)";
    } else {
      // Skip: Amarillo
      bgGradient = "linear-gradient(135deg, #eab308, #ca8a04)";
      haloColor = "rgba(234, 179, 8, 0.55)";
      textColor = "#0f172a";
      shadowGlow = isSelected
        ? `0 0 0 6px ${haloColor}, 0 4px 14px rgba(0,0,0,0.6)`
        : "0 2px 8px rgba(202, 138, 4, 0.4)";
    }
  } else if (effectiveTier) {
    if (effectiveTier === "hot") {
      bgGradient = "linear-gradient(135deg, #ef4444, #dc2626)";
      haloColor = "rgba(239, 68, 68, 0.55)";
    } else if (effectiveTier === "warm") {
      bgGradient = "linear-gradient(135deg, #22c55e, #16a34a)";
      haloColor = "rgba(34, 197, 94, 0.55)";
    } else if (effectiveTier === "nurture") {
      bgGradient = "linear-gradient(135deg, #f97316, #ea580c)";
      haloColor = "rgba(249, 115, 22, 0.55)";
    } else {
      bgGradient = "linear-gradient(135deg, #eab308, #ca8a04)";
      haloColor = "rgba(234, 179, 8, 0.55)";
      textColor = "#0f172a";
    }
    shadowGlow = isSelected
      ? `0 0 0 6px ${haloColor}, 0 4px 14px rgba(0,0,0,0.6)`
      : "0 2px 8px rgba(0,0,0,0.35)";
  }

  const scoreText = score != null ? `${score}` : "•";
  const size = isSelected ? 34 : 27;

  return L.divIcon({
    className: "",
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: ${size}px;
        height: ${size}px;
        background: ${bgGradient};
        border: ${isSelected ? "3px solid #ffffff" : "2px solid #ffffff"};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: ${shadowGlow};
        transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        cursor: pointer;
      ">
        <span style="
          transform: rotate(45deg);
          color: ${textColor};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: ${isSelected ? "11.5px" : "10px"};
          font-weight: 800;
          letter-spacing: -0.3px;
          line-height: 1;
          user-select: none;
        ">${scoreText}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

/** Helper to calculate LatLngBounds for a center + radius circle */
function getCircleBounds(lat: number, lng: number, radiusMeters: number): L.LatLngBounds {
  return L.latLng(lat, lng).toBounds(radiusMeters * 2);
}

/** Inner component: listens for map events and updates the circle */
function MapController({
  center,
  radiusMeters,
  onCenterChange,
}: {
  center: { lat: number; lng: number };
  radiusMeters: number;
  onCenterChange: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  // Track whether the next center change came from the user clicking/dragging
  // the map (no need to fly) vs. from an external source like a search result
  // selection (we want to fly there). We use a ref to avoid re-renders.
  const lastInternalCenter = useRef<{ lat: number; lng: number } | null>(null);
  const prevRadiusRef = useRef<number>(radiusMeters);

  // Recenter and fit bounds when center prop changes externally
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([center.lat, center.lng]);
    }
    const internal = lastInternalCenter.current;
    if (
      internal &&
      Math.abs(internal.lat - center.lat) < 1e-7 &&
      Math.abs(internal.lng - center.lng) < 1e-7
    ) {
      // User-driven change — don't fly, just update the marker (already done)
      lastInternalCenter.current = null;
      return;
    }
    if (!map) return;
    const currentCenter = map.getCenter();
    const movedMeters = currentCenter.distanceTo([center.lat, center.lng]);
    if (movedMeters > 50) {
      try {
        const bounds = getCircleBounds(center.lat, center.lng, radiusMeters);
        map.fitBounds(bounds, {
          padding: [50, 50],
          animate: true,
          duration: 0.6,
          maxZoom: 16,
        });
      } catch {
        map.flyTo([center.lat, center.lng], radiusToZoom(radiusMeters), { duration: 0.6 });
      }
    } else {
      map.panTo([center.lat, center.lng], { animate: true, duration: 0.3 });
    }
  }, [center.lat, center.lng, map, radiusMeters]);

  // Synchronize zoom & viewport automatically whenever the search radius changes
  useEffect(() => {
    if (!map) return;
    if (prevRadiusRef.current !== radiusMeters) {
      prevRadiusRef.current = radiusMeters;
      try {
        const bounds = getCircleBounds(center.lat, center.lng, radiusMeters);
        map.fitBounds(bounds, {
          padding: [50, 50],
          animate: true,
          duration: 0.4,
          maxZoom: 16,
        });
      } catch {
        const targetZoom = radiusToZoom(radiusMeters);
        map.flyTo([center.lat, center.lng], targetZoom, { duration: 0.4 });
      }
    }
  }, [radiusMeters, center.lat, center.lng, map]);

  // Map click moves the center pin (no fly — user is already there)
  useMapEvents({
    click(e) {
      lastInternalCenter.current = { lat: e.latlng.lat, lng: e.latlng.lng };
      onCenterChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return (
    <Marker
      draggable
      position={[center.lat, center.lng]}
      icon={centerIcon}
      ref={markerRef}
      eventHandlers={{
        dragend: (e) => {
          const m = e.target;
          const pos = m.getLatLng();
          lastInternalCenter.current = { lat: pos.lat, lng: pos.lng };
          onCenterChange(pos.lat, pos.lng);
        },
      }}
    />
  );
}

/** Convert radius (meters) to a sensible zoom level as backup */
function radiusToZoom(meters: number): number {
  if (meters <= 500) return 16;
  if (meters <= 1000) return 15;
  if (meters <= 2000) return 14;
  if (meters <= 4000) return 13;
  if (meters <= 8000) return 12;
  if (meters <= 16000) return 11;
  if (meters <= 32000) return 10;
  if (meters <= 64000) return 9;
  if (meters <= 128000) return 8;
  return 7;
}

/**
 * LocateControl — adds a "Mi ubicación" button to the map's bottom-right
 * corner. Uses the browser's Geolocation API to fly to the user's current
 * position and updates the search origin via onLocate.
 *
 * Button states:
 *   idle     → crosshair icon
 *   loading  → spinner + disabled
 *   error    → red flash + tooltip with reason (auto-clears after 3s)
 */
function LocateControl({
  onLocate,
}: {
  onLocate: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const ICON_CROSSHAIR = `
      <svg class="oportunia-locate-icon" viewBox="0 0 24 24" width="18" height="18"
           fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3"/>
        <line x1="12" y1="2" x2="12" y2="6"/>
        <line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="2" y1="12" x2="6" y2="12"/>
        <line x1="18" y1="12" x2="22" y2="12"/>
      </svg>`;
    const ICON_SPINNER = `
      <svg class="oportunia-locate-icon oportunia-locate-spin" viewBox="0 0 24 24" width="18" height="18"
           fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>`;
    const ICON_ERROR = `
      <svg class="oportunia-locate-icon" viewBox="0 0 24 24" width="18" height="18"
           fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>`;

    // Cast: L.control exists as both a factory function and a class in the
    // @types/leaflet definitions, so TS sometimes picks the class type.
    const locateCtl = (L.control as unknown as (opts: { position: L.ControlPosition }) => L.Control)({
      position: "bottomright",
    });

    locateCtl.onAdd = () => {
      const container = L.DomUtil.create(
        "div",
        "oportunia-locate-container leaflet-bar"
      );
      const btn = L.DomUtil.create(
        "button",
        "oportunia-locate-btn",
        container
      ) as HTMLButtonElement;
      btn.type = "button";
      btn.title = "Centrar en mi ubicación";
      btn.setAttribute("aria-label", "Centrar en mi ubicación");
      btn.innerHTML = ICON_CROSSHAIR;

      // Stop click from propagating to the map (which would move the
      // center pin via MapController's onMapClick handler).
      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);

      let errorTimer: ReturnType<typeof setTimeout> | null = null;

      const setError = (msg: string) => {
        btn.innerHTML = ICON_ERROR;
        btn.classList.add("oportunia-locate-error");
        btn.title = msg;
        if (errorTimer) clearTimeout(errorTimer);
        errorTimer = setTimeout(() => {
          btn.classList.remove("oportunia-locate-error");
          btn.innerHTML = ICON_CROSSHAIR;
          btn.title = "Centrar en mi ubicación";
        }, 3000);
      };

      const handleClick = (e: Event) => {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);

        if (typeof navigator === "undefined" || !navigator.geolocation) {
          setError("Geolocalización no soportada en este navegador");
          return;
        }

        btn.disabled = true;
        btn.innerHTML = ICON_SPINNER;
        btn.classList.add("oportunia-locate-loading");
        btn.title = "Obteniendo ubicación…";

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            // Fly to user location, then update search origin.
            // Using flyTo with a slightly tighter zoom for "where I am" UX.
            map.flyTo([latitude, longitude], 14, { duration: 0.8 });
            onLocate(latitude, longitude);
            btn.innerHTML = ICON_CROSSHAIR;
            btn.classList.remove("oportunia-locate-loading");
            btn.title = "Centrar en mi ubicación";
            btn.disabled = false;
          },
          (err) => {
            console.error("[Locate] geolocation error:", err);
            btn.innerHTML = ICON_CROSSHAIR;
            btn.classList.remove("oportunia-locate-loading");
            btn.disabled = false;
            const messages: Record<number, string> = {
              1: "Permiso de ubicación denegado",
              2: "Ubicación no disponible",
              3: "Tiempo agotado al obtener ubicación",
            };
            setError(messages[err.code] ?? (err.message || "Error de geolocalización"));
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      };

      btn.addEventListener("click", handleClick);
      return container;
    };

    locateCtl.addTo(map);
    return () => {
      locateCtl.remove();
    };
  }, [map, onLocate]);

  return null;
}

/**
 * BusinessSelectionFocus — when a business is explicitly clicked / selected
 * in the table or from a marker, smoothly pans and zooms directly to that
 * business's coordinates.
 *
 * Zoom level 16+ automatically breaks apart any Leaflet MarkerCluster group,
 * isolating the single orange pin in the exact center of the visible viewport.
 */
function BusinessSelectionFocus({
  focusedId,
  businesses,
}: {
  focusedId?: string | null;
  businesses: BusinessMarker[];
}) {
  const map = useMap();
  const lastFocusedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!focusedId || !map) return;
    if (focusedId === lastFocusedKey.current) return;
    lastFocusedKey.current = focusedId;

    // Support both raw ID "biz-123" and ticked ID "biz-123::1787300..."
    const actualId = focusedId.split("::")[0];
    const target = businesses.find((b) => b.id === actualId);
    if (!target || target.lat == null || target.lng == null) return;

    const currentZoom = map.getZoom();
    // Zoom 18 guarantees building/store-level precision and triggers disableClusteringAtZoom
    const targetZoom = Math.max(currentZoom, 18);

    try {
      map.flyTo([target.lat, target.lng], targetZoom, {
        animate: true,
        duration: 0.8,
        easeLinearity: 0.25,
      });
    } catch {
      map.setView([target.lat, target.lng], targetZoom);
    }
  }, [focusedId, businesses, map]);

  return null;
}

export default function RadarMap({
  center,
  radiusMeters,
  businesses,
  selectedId,
  focusedBusinessId,
  onCenterChange,
  onSelectBusiness,
  onRadiusChange,
}: RadarMapProps) {
  // Initial zoom based on default radius
  const initialZoom = useMemo(() => radiusToZoom(radiusMeters), []);

  // Stop click + scroll events on the radius-control overlay from reaching
  // the map. Without this, clicking the slider track / thumb or scrolling
  // over it would bubble up to MapController's `useMapEvents({ click })` and
  // move the center pin. We use Leaflet's own `L.DomEvent.disable*Propagation`
  // helpers (same pattern as the LocateControl below) so it works regardless
  // of whether the events come from the React tree or the Leaflet internals.
  const handleRadiusControlRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    L.DomEvent.disableClickPropagation(el);
    L.DomEvent.disableScrollPropagation(el);
  }, []);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={initialZoom}
      className="oportunia-map"
      scrollWheelZoom
      style={{ width: "100%", height: "100%", minHeight: "100%" }}
    >
      {/* OpenStreetMap tiles — free, no key, no rate limits for moderate use */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      {/* Search radius circle (semi-transparent sky blue) */}
      <Circle
        center={[center.lat, center.lng]}
        radius={radiusMeters}
        pathOptions={{
          color: "#0ea5e9",
          fillColor: "#0ea5e9",
          fillOpacity: 0.1,
          weight: 2,
          dashArray: "6 4",
        }}
      />

      {/* Center pin (draggable) */}
      <MapController
        center={center}
        radiusMeters={radiusMeters}
        onCenterChange={onCenterChange}
      />

      {/* Auto-focus & Auto-zoom on selected business pin (unclusters clusters automatically) */}
      <BusinessSelectionFocus
        focusedId={focusedBusinessId}
        businesses={businesses}
      />

      {/* "Mi ubicación" button (bottom-right) */}
      <LocateControl onLocate={onCenterChange} />

      {/* Compact radius slider (top-right). The outer ref is wired up to
          `handleRadiusControlRef` so the slider's clicks don't bubble up
          to the map's click handler (which would move the center pin). */}
      {onRadiusChange && (
        <div
          ref={handleRadiusControlRef}
          className="leaflet-top leaflet-right"
          style={{ pointerEvents: "auto" }}
        >
          <div className="leaflet-control" style={{ margin: "10px" }}>
            <MapRadiusControl valueMeters={radiusMeters} onChange={onRadiusChange} />
          </div>
        </div>
      )}

      {/* Business markers — clustered when zoomed out, completely isolated at zoom >= 17 */}
      <MarkerClusterGroup
        chunkedLoading
        showCoverageOnHover={false}
        spiderfyOnMaxZoom
        spiderfyDistanceMultiplier={1.5}
        disableClusteringAtZoom={17}
        maxClusterRadius={35}
      >
        {businesses.map((b) => {
          const isSelected = b.id === selectedId;
          return (
            <Marker
              key={`${b.id}-${isSelected ? "selected" : "idle"}-${b.totalScore ?? "none"}`}
              position={[b.lat, b.lng]}
              icon={businessIcon(isSelected, b.totalScore, b.tier)}
              zIndexOffset={isSelected ? 2000 : 0}
              eventHandlers={{
                click: () => onSelectBusiness(b.id),
              }}
            >
              <Popup className="oportunia-popup">
                <div className="text-sm space-y-1.5 min-w-[200px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-100">{b.name}</span>
                    {b.totalScore != null && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        b.totalScore >= 75
                          ? "bg-red-500/20 text-red-300 border border-red-500/30"
                          : b.totalScore >= 60
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : b.totalScore >= 40
                          ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                          : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                      }`}>
                        {b.totalScore} {b.tier?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  {b.category && (
                    <div className="text-xs text-slate-400">{b.category}</div>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    {b.rating != null && (
                      <span className="text-amber-400 font-medium">
                        ⭐ {b.rating.toFixed(1)}
                        {b.reviewCount != null && ` (${b.reviewCount})`}
                      </span>
                    )}
                    {b.distanceMiles != null && (
                      <span className="text-slate-400 font-mono">
                        · {b.distanceMiles.toFixed(1)} mi
                      </span>
                    )}
                  </div>
                  {b.address && (
                    <div className="text-xs text-slate-300 truncate">{b.address}</div>
                  )}
                  <button
                    onClick={() => onSelectBusiness(b.id)}
                    className="text-xs font-semibold text-sky-400 hover:text-sky-300 hover:underline mt-1 block"
                  >
                    Ver detalles en tabla →
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
