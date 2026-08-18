"use client";

/**
 * CategoryChips — predefined business category chips + free text input.
 * Each chip translates to a search query that Google Places understands.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export const CATEGORY_PRESETS: Array<{ label: string; query: string }> = [
  { label: "🏠 Real Estate", query: "real estate agency" },
  { label: "🍽️ Restaurant", query: "restaurant" },
  { label: "🏨 Hotel", query: "hotel" },
  { label: "💪 Gym", query: "gym fitness center" },
  { label: "🦷 Dentist", query: "dentist" },
  { label: "⚖️ Lawyer", query: "lawyer attorney" },
  { label: "💇 Beauty Salon", query: "beauty salon" },
  { label: "📊 Accounting", query: "accountant cpa" },
  { label: "🔧 Plumber", query: "plumber" },
  { label: "❄️ HVAC", query: "hvac contractor" },
  { label: "🔨 Contractor", query: "general contractor" },
  { label: "🚗 Auto Repair", query: "auto repair shop" },
];

interface CategoryChipsProps {
  value: string;
  onChange: (query: string) => void;
  className?: string;
}

export default function CategoryChips({
  value,
  onChange,
  className,
}: CategoryChipsProps) {
  // The chip is "active" if its query matches the current value
  // (we compare the lowercase trimmed value to support user editing)
  const normalizedValue = value.trim().toLowerCase();

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs">
        <label className="text-slate-400 font-medium">Categoría</label>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-slate-500 hover:text-slate-300 text-[10px]"
          >
            ✕ Limpiar
          </button>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ej: plomería, dentista, real estate..."
        className="w-full bg-slate-900/60 border border-white/10 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
      />
      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_PRESETS.map((c) => {
          const isActive = normalizedValue === c.query.toLowerCase();
          return (
            <button
              key={c.query}
              type="button"
              onClick={() => onChange(c.query)}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-colors",
                isActive
                  ? "bg-sky-500/20 text-sky-200 border-sky-500/40"
                  : "bg-slate-800/50 text-slate-300 border-white/10 hover:bg-slate-700/50 hover:text-slate-100"
              )}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
