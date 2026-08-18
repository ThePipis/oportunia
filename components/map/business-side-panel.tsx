"use client";

/**
 * BusinessSidePanel — slide-in panel that shows details for a selected
 * business marker on the radar map.
 *
 * Includes: name, address, phone, website, rating, distance from origin.
 * If the business is in our DB, also shows a "Ver perfil completo" link
 * to the /radar/[id] page with talking points.
 */

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { BusinessMarker } from "@/lib/map/types";

interface BusinessSidePanelProps {
  business: BusinessMarker | null;
  origin: { lat: number; lng: number };
  onClose: () => void;
}

function haversineMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function BusinessSidePanel({
  business,
  origin,
  onClose,
}: BusinessSidePanelProps) {
  if (!business) return null;

  const distance = business.distanceMiles ?? haversineMiles(origin, { lat: business.lat, lng: business.lng });

  return (
    <div
      className="absolute top-0 right-0 h-full w-full sm:w-96 z-[1000] pointer-events-none"
      role="dialog"
      aria-label={`Detalles de ${business.name}`}
    >
      <div className="h-full bg-slate-950/95 backdrop-blur-sm border-l border-sky-500/30 shadow-2xl shadow-black/50 p-4 overflow-y-auto pointer-events-auto">
        {/* Header with close button */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-100 leading-tight">
              {business.name}
            </h3>
            {business.category && (
              <p className="text-xs text-slate-400 mt-0.5">{business.category}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-slate-400 hover:text-slate-100 text-xl leading-none p-1 -mr-1"
          >
            ✕
          </button>
        </div>

        {/* Rating + distance */}
        <div className="flex items-center gap-3 mb-3 text-sm">
          {business.rating != null && (
            <span className="inline-flex items-center gap-1 text-amber-400">
              ⭐ {business.rating.toFixed(1)}
              {business.reviewCount != null && (
                <span className="text-xs text-slate-500">
                  ({business.reviewCount})
                </span>
              )}
            </span>
          )}
          <span className="text-slate-400">
            📍 {distance.toFixed(1)} mi
          </span>
        </div>

        {/* Contact info */}
        <div className="space-y-2 text-sm mb-4">
          {business.address && (
            <div className="flex items-start gap-2">
              <span className="text-slate-500 mt-0.5 shrink-0">📍</span>
              <span className="text-slate-300">{business.address}</span>
            </div>
          )}
          {business.phone && (
            <div className="flex items-start gap-2">
              <span className="text-slate-500 mt-0.5 shrink-0">📞</span>
              <a
                href={`tel:${business.phone}`}
                className="text-sky-400 hover:text-sky-300"
              >
                {business.phone}
              </a>
            </div>
          )}
          {business.website && (
            <div className="flex items-start gap-2">
              <span className="text-slate-500 mt-0.5 shrink-0">🌐</span>
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:text-sky-300 break-all"
              >
                {business.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Link href={`/radar/${business.id}`} className="block">
            <Button size="sm" className="w-full">
              Ver perfil completo →
            </Button>
          </Link>
          <p className="text-xs text-slate-500 text-center">
            Talking points + propuesta con IA
          </p>
        </div>
      </div>
    </div>
  );
}
