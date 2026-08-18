"use client";

/**
 * RadiusSlider — slider for the search radius with km/miles unit toggle.
 * Bound to a parent state (meters + setter).
 */

import * as React from "react";
import { cn } from "@/lib/utils";

interface RadiusSliderProps {
  /** Current radius in meters */
  valueMeters: number;
  /** Called with the new radius in meters */
  onChange: (meters: number) => void;
  /** Min/max in current unit */
  min?: number;
  max?: number;
  className?: string;
}

type Unit = "km" | "mi";

export default function RadiusSlider({
  valueMeters,
  onChange,
  min = 0.5,
  max = 30,
  className,
}: RadiusSliderProps) {
  const [unit, setUnit] = React.useState<Unit>("mi");

  // Convert meters <-> current display value
  const METERS_PER_MILE = 1609.34;
  const METERS_PER_KM = 1000;

  const displayValue =
    unit === "mi" ? valueMeters / METERS_PER_MILE : valueMeters / METERS_PER_KM;
  const displayMin = unit === "mi" ? min : min;
  const displayMax = unit === "mi" ? max : max;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    const meters = unit === "mi" ? v * METERS_PER_MILE : v * METERS_PER_KM;
    onChange(meters);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs">
        <label className="text-slate-400 font-medium">Radio de búsqueda</label>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sky-300 text-sm font-semibold">
            {displayValue.toFixed(unit === "mi" ? 1 : 2)} {unit}
          </span>
          <div className="flex border border-white/10 rounded overflow-hidden text-[10px]">
            <button
              type="button"
              onClick={() => setUnit("mi")}
              className={cn(
                "px-2 py-0.5 transition-colors",
                unit === "mi"
                  ? "bg-sky-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              )}
            >
              mi
            </button>
            <button
              type="button"
              onClick={() => setUnit("km")}
              className={cn(
                "px-2 py-0.5 transition-colors",
                unit === "km"
                  ? "bg-sky-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              )}
            >
              km
            </button>
          </div>
        </div>
      </div>
      <input
        type="range"
        min={displayMin}
        max={displayMax}
        step={unit === "mi" ? 0.5 : 0.1}
        value={displayValue}
        onChange={handleSliderChange}
        className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-sky-500"
        style={{
          background: `linear-gradient(to right, #0ea5e9 0%, #0ea5e9 ${
            ((displayValue - displayMin) / (displayMax - displayMin)) * 100
          }%, #1e293b ${
            ((displayValue - displayMin) / (displayMax - displayMin)) * 100
          }%, #1e293b 100%)`,
        }}
      />
      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
        <span>{displayMin} {unit}</span>
        <span>{Math.round(displayMax / 2)} {unit}</span>
        <span>{displayMax} {unit}</span>
      </div>
    </div>
  );
}
