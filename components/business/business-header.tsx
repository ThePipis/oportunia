import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreBadge } from "@/components/scoring/score-badge";

interface BusinessHeaderProps {
  business: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    phone: string | null;
    website: string | null;
    google_rating: number | null;
    review_count: number | null;
    primary_type: string | null;
    distance_miles: number | null;
  };
  score: {
    total: number;
    tier: "hot" | "warm" | "nurture" | "skip";
  } | null;
}

export function BusinessHeader({ business, score }: BusinessHeaderProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left: name + info */}
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-100 leading-tight">
                {business.name}
              </h1>
              {business.primary_type && (
                <p className="text-sm text-slate-400 mt-1">
                  {business.primary_type}
                </p>
              )}
            </div>

            <div className="space-y-2 text-sm">
              {business.address && (
                <div className="flex items-start gap-2 text-slate-300">
                  <span className="text-slate-500 mt-0.5">📍</span>
                  <span>{business.address}</span>
                </div>
              )}
              {business.phone && (
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-500">📞</span>
                  <a
                    href={`tel:${business.phone}`}
                    className="hover:text-sky-300"
                  >
                    {business.phone}
                  </a>
                </div>
              )}
              {business.website && (
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-500">🌐</span>
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-sky-300 truncate max-w-md"
                  >
                    {business.website}
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 pt-2 flex-wrap">
              {business.google_rating !== null && (
                <div className="flex items-center gap-1.5">
                  <span className="text-yellow-400">⭐</span>
                  <span className="font-semibold text-slate-100">
                    {business.google_rating.toFixed(1)}
                  </span>
                  {business.review_count !== null && (
                    <span className="text-xs text-slate-500">
                      ({business.review_count} reseñas)
                    </span>
                  )}
                </div>
              )}
              {business.distance_miles !== null && (
                <div className="flex items-center gap-1.5 text-sky-300">
                  <span>📏</span>
                  <span className="font-semibold">
                    {business.distance_miles.toFixed(1)} mi
                  </span>
                  <span className="text-xs text-slate-500">de Eastvale</span>
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-2 pt-3 flex-wrap">
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                >
                  📞 Llamar
                </a>
              )}
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30"
                >
                  🌐 Visitar web
                </a>
              )}
              {business.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
                >
                  🗺️ Google Maps
                </a>
              )}
            </div>
          </div>

          {/* Right: score badge */}
          {score && (
            <div className="flex flex-col items-center justify-center md:border-l md:border-white/10 md:pl-6">
              <ScoreBadge score={score.total} tier={score.tier} size="lg" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
