"use client";

/**
 * MapRadiusControl — compact radius slider that floats over the map
 * in its top-right corner. Lets the user adjust the search radius
 * without having to scroll down to the form sidebar.
 *
 * Visual layout (compact, ~190px wide):
 *   ┌────────────────────────────┐
 *   │ 📏 Radio    5.0 mi  [mi|km] │
 *   │ ━━━━━━━●━━━━━━━━━━━━━━━━ │  ← slider
 *   │ 0.5      15        30    │  ← min/mid/max labels
 *   └────────────────────────────┘
 *
 * The widget is a Leaflet-aware React component (no `useMap` needed —
 * it's positioned by its parent inside the map container). It does not
 * touch the Leaflet map directly; it only emits radius changes via
 * `onChange` so the parent page can update its own state.
 */

import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

interface MapRadiusControlProps {
  /** Current radius in meters */
  valueMeters: number;
  /** Called with the new radius in meters when the user moves the slider
   *  or switches units. The unit conversion is handled internally. */
  onChange: (meters: number) => void;
  /** Min/max in current unit */
  min?: number;
  max?: number;
  className?: string;
}

type Unit = "mi" | "km";

const METERS_PER_MILE = 1609.34;
const METERS_PER_KM = 1000;

export default function MapRadiusControl({
  valueMeters,
  onChange,
  min = 0.5,
  max = 30,
  className,
}: MapRadiusControlProps) {
  const { t } = useT();
  const [unit, setUnit] = React.useState<Unit>("mi");

  const metersToDisplay = (m: number) =>
    unit === "mi" ? m / METERS_PER_MILE : m / METERS_PER_KM;
  const displayToMeters = (v: number) =>
    unit === "mi" ? v * METERS_PER_MILE : v * METERS_PER_KM;

  const displayValue = metersToDisplay(valueMeters);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    onChange(displayToMeters(v));
  };

  const switchUnit = (next: Unit) => {
    if (next === unit) return;
    setUnit(next);
    // No value conversion needed: valueMeters stays the same; the displayed
    // value will change automatically.
  };

  // Pre-compute the slider fill percentage for the colored track.
  const pct = Math.max(
    0,
    Math.min(100, ((displayValue - min) / (max - min)) * 100)
  );

  return (
    <div
      className={cn(
        // Card look
        "bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm",
        "border border-slate-200 dark:border-white/10",
        "rounded-md shadow-lg",
        "p-2.5",
        // Size — narrow but enough room for slider
        "w-[200px]",
        // Spacing
        "space-y-1.5",
        className
      )}
      role="group"
      aria-label={t("radar.radiusLabel", "Radio")}
    >
      {/* Header row: label + value + unit toggle */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
          <span aria-hidden="true">📏</span> {t("radar.radiusLabel", "Radio")}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className="font-mono text-[12px] font-bold text-sky-600 dark:text-sky-300 tabular-nums"
            aria-live="polite"
          >
            {displayValue.toFixed(unit === "mi" ? 1 : 2)} {unit}
          </span>
          <div className="flex border border-slate-200 dark:border-white/10 rounded overflow-hidden text-[10px]">
            <button
              type="button"
              onClick={() => switchUnit("mi")}
              className={cn(
                "px-1.5 py-0.5 transition-colors",
                unit === "mi"
                  ? "bg-sky-500 text-white"
                  : "bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              )}
              aria-label="Millas"
            >
              mi
            </button>
            <button
              type="button"
              onClick={() => switchUnit("km")}
              className={cn(
                "px-1.5 py-0.5 transition-colors",
                unit === "km"
                  ? "bg-sky-500 text-white"
                  : "bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              )}
              aria-label="Kilómetros"
            >
              km
            </button>
          </div>
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={min}
        max={max}
        step={unit === "mi" ? 0.5 : 0.1}
        value={displayValue}
        onChange={handleSliderChange}
        className="w-full h-1 rounded-full appearance-none cursor-pointer accent-sky-500"
        style={{
          background: `linear-gradient(to right, #0ea5e9 0%, #0ea5e9 ${pct}%, #cbd5e1 ${pct}%, #cbd5e1 100%)`,
        }}
        aria-label={`Radio: ${displayValue.toFixed(1)} ${unit}`}
      />

      {/* Min / max labels */}
      <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 font-mono tabular-nums">
        <span>
          {min} {unit}
        </span>
        <span>
          {Math.round((max - min) / 2) + min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  );
}
