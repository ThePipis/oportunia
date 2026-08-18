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

import { useEffect, useRef, useMemo } from "react";
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

interface RadarMapProps {
  /** Map center (lat/lng) — also the search origin */
  center: { lat: number; lng: number };
  /** Radius in meters */
  radiusMeters: number;
  /** Businesses to display as markers */
  businesses: BusinessMarker[];
  /** Currently selected business id (highlighted) */
  selectedId?: string | null;
  /** Fired when the user drags the center pin to a new location */
  onCenterChange: (lat: number, lng: number) => void;
  /** Fired when the user clicks a business marker */
  onSelectBusiness: (id: string) => void;
}

/** Default Leaflet markers don't work with bundlers; use a custom DivIcon */
const centerIcon = L.divIcon({
  className: "",
  html: '<div class="center-pin"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const businessIcon = (isSelected: boolean) =>
  L.divIcon({
    className: "",
    html: `<div style="
      width: 28px;
      height: 28px;
      background: ${isSelected ? "#f97316" : "#0ea5e9"};
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    "><div style="
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
      transform: rotate(45deg);
    "></div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });

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

  // Recenter the map when center prop changes externally
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([center.lat, center.lng]);
    }
  }, [center]);

  // Pan to keep marker visible when radius changes
  useEffect(() => {
    if (!map) return;
    const currentZoom = map.getZoom();
    const targetZoom = radiusToZoom(radiusMeters);
    if (Math.abs(currentZoom - targetZoom) > 1.5) {
      map.flyTo([center.lat, center.lng], targetZoom, { duration: 0.6 });
    }
  }, [radiusMeters, center, map]);

  // Map click moves the center pin
  useMapEvents({
    click(e) {
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
          onCenterChange(pos.lat, pos.lng);
        },
      }}
    />
  );
}

/** Convert radius (meters) to a sensible zoom level */
function radiusToZoom(meters: number): number {
  if (meters <= 500) return 16;
  if (meters <= 1000) return 15;
  if (meters <= 2000) return 14;
  if (meters <= 5000) return 13;
  if (meters <= 10000) return 12;
  if (meters <= 20000) return 11;
  return 10;
}

export default function RadarMap({
  center,
  radiusMeters,
  businesses,
  selectedId,
  onCenterChange,
  onSelectBusiness,
}: RadarMapProps) {
  // Initial zoom based on default radius
  const initialZoom = useMemo(() => radiusToZoom(radiusMeters), []);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={initialZoom}
      className="oportunia-map"
      scrollWheelZoom
      style={{ minHeight: "500px" }}
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

      {/* Business markers — clustered when zoomed out */}
      <MarkerClusterGroup
        chunkedLoading
        showCoverageOnHover={false}
        spiderfyOnMaxZoom
        maxClusterRadius={50}
      >
        {businesses.map((b) => (
          <Marker
            key={b.id}
            position={[b.lat, b.lng]}
            icon={businessIcon(b.id === selectedId)}
            eventHandlers={{
              click: () => onSelectBusiness(b.id),
            }}
          >
            <Popup className="oportunia-popup">
              <div className="text-sm space-y-1 min-w-[180px]">
                <div className="font-bold text-slate-100">{b.name}</div>
                {b.category && (
                  <div className="text-xs text-slate-400">{b.category}</div>
                )}
                {b.rating != null && (
                  <div className="text-xs text-amber-400">
                    ⭐ {b.rating.toFixed(1)}
                    {b.reviewCount != null && ` (${b.reviewCount})`}
                  </div>
                )}
                {b.address && (
                  <div className="text-xs text-slate-300">{b.address}</div>
                )}
                <button
                  onClick={() => onSelectBusiness(b.id)}
                  className="text-xs text-sky-400 hover:text-sky-300 mt-1"
                >
                  Ver detalles →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
