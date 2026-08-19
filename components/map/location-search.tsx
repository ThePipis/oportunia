"use client";

/**
 * LocationSearch — universal location autocomplete.
 *
 * Free-text input (city, street, address, landmark, etc.) with live
 * suggestions powered by /api/geocode (Nominatim). When the user picks a
 * suggestion, the parent gets a callback with the resolved lat/lng so it
 * can move the map's center pin.
 *
 * UX:
 * - Debounced fetch (350ms) — no API spam
 * - Min 3 chars before searching
 * - Keyboard nav: ArrowDown/Up to move, Enter to select, Escape to close
 * - Click outside to close
 * - Loading spinner inside the input
 * - Clear (✕) button when there's a value
 * - Dark theme; matches the rest of the app
 */

import * as React from "react";

export interface GeocodeSuggestion {
  display_name: string;
  short_name: string;
  lat: number;
  lng: number;
  type: string;
  category: string;
  importance: number;
}

interface LocationSearchProps {
  /** Current text shown in the input (controlled) */
  value: string;
  /** Fired on every keystroke */
  onChange: (text: string) => void;
  /** Fired when the user picks a suggestion (click or Enter) */
  onLocationSelect: (lat: number, lng: number, displayName: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Optional className for the outer wrapper */
  className?: string;
}

const DEBOUNCE_MS = 350;
const MIN_CHARS = 3;

/** Pick a small emoji icon based on the OSM category. */
function iconForCategory(cat: string): string {
  switch (cat) {
    case "place":
      return "🏙️";
    case "highway":
    case "road":
      return "🛣️";
    case "amenity":
      return "📍";
    case "tourism":
      return "🏛️";
    case "shop":
      return "🛍️";
    case "building":
      return "🏢";
    case "leisure":
      return "🌳";
    case "natural":
      return "⛰️";
    case "railway":
      return "🚉";
    case "aeroway":
      return "✈️";
    case "waterway":
      return "💧";
    default:
      return "📍";
  }
}

export default function LocationSearch({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Escribe una ciudad, dirección o lugar...",
  className = "",
}: LocationSearchProps) {
  const [results, setResults] = React.useState<GeocodeSuggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [highlighted, setHighlighted] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [rateLimited, setRateLimited] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  // Close on click outside
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Debounced fetch when value changes
  React.useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    const trimmed = value.trim();
    if (trimmed.length < MIN_CHARS) {
      setResults([]);
      setLoading(false);
      setError(null);
      setRateLimited(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const ctl = new AbortController();
      abortRef.current = ctl;

      setLoading(true);
      setError(null);
      setRateLimited(false);

      try {
        const res = await fetch(
          `/api/geocode?q=${encodeURIComponent(trimmed)}&limit=6`,
          { signal: ctl.signal }
        );
        if (!res.ok) {
          if (res.status === 429) {
            setRateLimited(true);
            setResults([]);
          } else {
            setError(`Error ${res.status}`);
            setResults([]);
          }
          return;
        }
        const data = await res.json();
        const list: GeocodeSuggestion[] = Array.isArray(data?.results)
          ? data.results
          : [];
        setResults(list);
        setHighlighted(0);
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          setError(e?.message || "Error de red");
        }
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  const handleSelect = React.useCallback(
    (r: GeocodeSuggestion) => {
      onChange(r.short_name);
      onLocationSelect(r.lat, r.lng, r.display_name);
      setOpen(false);
      setResults([]);
      inputRef.current?.blur();
    },
    [onChange, onLocationSelect]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      if (results.length === 0) return;
      e.preventDefault();
      setOpen(true);
      setHighlighted((h) => (h + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      if (results.length === 0) return;
      e.preventDefault();
      setHighlighted((h) => (h - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      if (!open || results.length === 0) return;
      e.preventDefault();
      handleSelect(results[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showDropdown =
    open &&
    value.trim().length >= MIN_CHARS &&
    (loading || results.length > 0 || !!error || rateLimited);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input + icons */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-controls="oportunia-location-search-listbox"
          className="flex h-10 w-full rounded-md border border-white/10 bg-slate-900/60 pl-9 pr-9 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        />

        {/* Left icon (search or spinner) */}
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          {loading ? (
            <svg
              className="animate-spin text-sky-400"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          )}
        </span>

        {/* Right clear button */}
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 w-6 h-6 flex items-center justify-center rounded hover:bg-white/5"
            aria-label="Limpiar"
            tabIndex={-1}
          >
            ✕
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && (
        <div
          id="oportunia-location-search-listbox"
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-md border border-white/10 bg-slate-900 shadow-2xl shadow-black/40 max-h-80 overflow-y-auto"
        >
          {error && (
            <div className="px-3 py-2 text-xs text-red-400">⚠️ {error}</div>
          )}
          {rateLimited && (
            <div className="px-3 py-2 text-xs text-amber-400">
              ⏱ Espera 1 segundo antes de buscar de nuevo
            </div>
          )}
          {!error && !rateLimited && !loading && results.length === 0 && (
            <div className="px-3 py-3 text-xs text-slate-500">
              Sin resultados para <span className="text-slate-300">"{value}"</span>
            </div>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.lat.toFixed(5)}-${r.lng.toFixed(5)}-${i}`}
              type="button"
              role="option"
              aria-selected={i === highlighted}
              onClick={() => handleSelect(r)}
              onMouseEnter={() => setHighlighted(i)}
              className={`w-full text-left px-3 py-2 flex items-start gap-2 border-b border-white/5 last:border-b-0 transition-colors ${
                i === highlighted
                  ? "bg-sky-500/15"
                  : "hover:bg-slate-800/50"
              }`}
            >
              <span className="text-base shrink-0 mt-0.5" aria-hidden="true">
                {iconForCategory(r.category)}
              </span>
              <span className="flex-1 min-w-0">
                <div className="text-sm text-slate-100 truncate font-medium">
                  {r.short_name}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {r.display_name}
                </div>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
