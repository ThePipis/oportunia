"use client";

/**
 * CategoryMultiSelect — multi-select tag input for radar searches.
 *
 * Layout (top → bottom):
 *   1. Tag input box
 *      - Selected categories appear as removable tags with icon + X
 *      - Free-text input inside the same box → autocomplete suggestions
 *      - "Limpiar todo" (clear all) button in the top-right corner
 *   2. Acceso rápido (12 hardcoded quick picks, always visible)
 *   3. Más usadas (top categories by usage_count, 2 rows + "+N más")
 *
 * Validation:
 *   - Autocomplete ONLY returns existing categories from the DB
 *   - Pressing Enter on a non-existing term does NOTHING (no error UI)
 *   - Click on a chip (quick pick or most used) adds it immediately
 *
 * Usage:
 *   <CategoryMultiSelect
 *     value={selectedIds}
 *     onChange={setSelectedIds}
 *   />
 */

import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { translateCategory } from "@/lib/categories/category-i18n";

export interface CategoryOption {
  id: string;
  display_name: string;
  icon: string | null;
  query: string;
  usage_count: number;
  is_quick_pick: number;
}

interface CategoryMultiSelectProps {
  /** Array of selected category ids */
  value: string[];
  /** Called when the user adds or removes a category */
  onChange: (ids: string[]) => void;
  className?: string;
  /** Optional cap on max selections (default: unlimited) */
  maxSelections?: number;
}

const SEARCH_DEBOUNCE_MS = 250;
const MIN_SEARCH_CHARS = 1;
const MAX_VISIBLE_TOP = 3; // Mostrar exactamente 3 categorías más usadas para mantener 1 sola fila limpia

export default function CategoryMultiSelect({
  value,
  onChange,
  className,
  maxSelections,
}: CategoryMultiSelectProps) {
  const { t, locale } = useT();
  const [search, setSearch] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<CategoryOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [highlighted, setHighlighted] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  const [topCats, setTopCats] = React.useState<CategoryOption[]>([]);
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [popoverCats, setPopoverCats] = React.useState<CategoryOption[]>([]);
  const [popoverLoading, setPopoverLoading] = React.useState(false);
  // Local cache of full CategoryOption for every id the user has selected
  // during this session. Needed because the selected id is looked up in
  // topCats/popoverCats to render the tag — but `topCats` is fetched with
  // `exclude=<selected ids>` and may not contain a selected category after a
  // refresh. The cache guarantees the tag is always renderable.
  const [selectedDetails, setSelectedDetails] = React.useState<
    Map<string, CategoryOption>
  >(new Map());

  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const selectedSet = React.useMemo(() => new Set(value), [value]);

  // ---------- Data loading ----------

  // Load top categories on mount
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const top = await fetch(
          `/api/categories?mode=top&limit=${MAX_VISIBLE_TOP}&exclude=${value.join(",")}`
        ).then((r) => r.json());
        if (cancelled) return;
        setTopCats(top.results || []);
      } catch (e) {
        // Non-fatal; the "Más usadas" section will just be empty
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch the details of any selected categories we don't have in
  // `selectedDetails` yet. Needed for two cases:
  //   1. Page load with persisted value (value arrives AFTER first render
  //      so a mount-only effect would miss it).
  //   2. Defensive: if the cache is ever cleared, we re-fetch.
  // We use a ref to track which ids we've already requested so we don't
  // re-fetch on every render. New selections added by the user go through
  // `addCategory` which updates the cache directly.
  const fetchedIdsRef = React.useRef<Set<string>>(new Set());
  React.useEffect(() => {
    if (value.length === 0) return;
    const missing = value.filter((id) => !fetchedIdsRef.current.has(id));
    if (missing.length === 0) return;
    // Optimistically mark as fetched to prevent duplicate requests from
    // rapid re-renders before the response arrives.
    missing.forEach((id) => fetchedIdsRef.current.add(id));

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/categories?mode=byIds&ids=${encodeURIComponent(missing.join(","))}`
        ).then((r) => r.json());
        if (cancelled) return;
        const items: CategoryOption[] = (res.results || []) as CategoryOption[];
        if (items.length === 0) return;
        setSelectedDetails((prev) => {
          const next = new Map(prev);
          for (const c of items) next.set(c.id, c);
          return next;
        });
      } catch {
        // Non-fatal: tags may be missing but the count is still correct.
        // Undo the optimistic mark so a future render can retry.
        missing.forEach((id) => fetchedIdsRef.current.delete(id));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value]);

  // Refresh top list when selection changes (to exclude newly selected)
  React.useEffect(() => {
    let cancelled = false;
    fetch(
      `/api/categories?mode=top&limit=${MAX_VISIBLE_TOP}&exclude=${value.join(",")}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setTopCats(data.results || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [value]);

  // Debounced search
  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = search.trim();
    if (q.length < MIN_SEARCH_CHARS) {
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const ctl = new AbortController();
      abortRef.current = ctl;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/categories?q=${encodeURIComponent(q)}&limit=8&exclude=${value.join(",")}`,
          { signal: ctl.signal }
        );
        if (!res.ok) {
          setError(`Error ${res.status}`);
          setSuggestions([]);
        } else {
          const data = await res.json();
          setSuggestions(data.results || []);
          setHighlighted(0);
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") setError(e?.message || "Error");
      } finally {
        setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, value]);

  // Click outside closes dropdown
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Load popover (all categories) the first time it opens
  const openPopover = React.useCallback(async () => {
    setPopoverOpen(true);
    if (popoverCats.length > 0) return;
    setPopoverLoading(true);
    try {
      const res = await fetch(
        `/api/categories?mode=all&limit=200&exclude=${value.join(",")}`
      );
      const data = await res.json();
      const list: CategoryOption[] = data.results || [];
      setPopoverCats(list);
      // Total = top visible + popover. The popover excludes selected, so we
      // need to add `value.length` to get the true total in the DB.
      setTotalAvailable(list.length + topCats.length + value.length);
    } catch (e) {
      // non-fatal
    } finally {
      setPopoverLoading(false);
    }
  }, [popoverCats.length, value, topCats.length]);

  // ---------- Selection actions ----------

  const addCategory = React.useCallback(
    (cat: CategoryOption) => {
      if (selectedSet.has(cat.id)) return;
      if (maxSelections && value.length >= maxSelections) return;
      onChange([...value, cat.id]);
      setSelectedDetails((prev) => {
        const next = new Map(prev);
        next.set(cat.id, cat);
        return next;
      });
      setSearch("");
      setSuggestions([]);
      inputRef.current?.focus();
    },
    [onChange, value, selectedSet, maxSelections]
  );

  const removeCategory = React.useCallback(
    (id: string) => {
      onChange(value.filter((v) => v !== id));
      setSelectedDetails((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    },
    [onChange, value]
  );

  const clearAll = React.useCallback(() => {
    onChange([]);
    setSelectedDetails(new Map());
    setSearch("");
    setSuggestions([]);
    inputRef.current?.focus();
  }, [onChange]);

  // Drop the cached details for ids that the parent removed externally
  // (e.g., on remount the parent resets state but our cache would linger).
  React.useEffect(() => {
    setSelectedDetails((prev) => {
      const valueSet = new Set(value);
      let changed = false;
      const next = new Map<string, CategoryOption>();
      for (const [id, cat] of prev) {
        if (valueSet.has(id)) next.set(id, cat);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [value]);

  // ---------- Keyboard ----------

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && search === "" && value.length > 0) {
      // Pop the last tag with backspace
      e.preventDefault();
      const newValue = value.slice(0, -1);
      onChange(newValue);
      setSelectedDetails((prev) => {
        const next = new Map(prev);
        // Drop any ids not in newValue
        const newValueSet = new Set(newValue);
        for (const id of prev.keys()) {
          if (!newValueSet.has(id)) next.delete(id);
        }
        return next;
      });
      return;
    }
    if (e.key === "ArrowDown") {
      if (suggestions.length === 0) return;
      e.preventDefault();
      setOpen(true);
      setHighlighted((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      if (suggestions.length === 0) return;
      e.preventDefault();
      setHighlighted((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      // Only add if a suggestion is highlighted. Otherwise, do nothing —
      // we never add arbitrary text.
      if (!open || suggestions.length === 0) return;
      e.preventDefault();
      addCategory(suggestions[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Look up selected categories for rendering as tags.
  // Order of precedence: selectedDetails (cache of what user just clicked) >
  // popoverCats (loaded from the popover) > topCats (current "Más usadas").
  // The selectedDetails cache is what prevents the "tag disappears" bug
  // when topCats is refreshed with `exclude=<selected ids>`.
  const selectedCats: CategoryOption[] = React.useMemo(() => {
    const all: CategoryOption[] = [...topCats, ...popoverCats];
    for (const c of selectedDetails.values()) {
      if (!all.find((x) => x.id === c.id)) all.push(c);
    }
    const map = new Map(all.map((c) => [c.id, c]));
    return value
      .map((id) => map.get(id))
      .filter((c): c is CategoryOption => Boolean(c));
  }, [value, topCats, popoverCats, selectedDetails]);

  // Local filter: selected categories disappear from "Más usadas" and
  // reappear in their original position when removed.
  // (Defensive: topCats is also filtered server-side.)
  const topVisible = React.useMemo(
    () => topCats.filter((c) => !selectedSet.has(c.id)).slice(0, MAX_VISIBLE_TOP),
    [topCats, selectedSet]
  );
  // Total count of categories in the DB (loaded lazily when the user opens
  // the popover). Used to show "+N más" when there are more than what's
  // visible in the top list. We can't derive this from `topCats.length`
  // because that array is capped at MAX_VISIBLE_TOP by the API.
  const [totalAvailable, setTotalAvailable] = React.useState<number | null>(null);
  const topHiddenCount = Math.max(0, topCats.length - topVisible.length);
  // Whether we suspect there are more categories than fit in the visible list.
  // We assume so when the top list is full (16 items) — the popover will
  // confirm the real total.
  const hasMoreBelow = topCats.length >= MAX_VISIBLE_TOP;

  return (
    <div ref={containerRef} className={cn("space-y-3", className)}>
      {/* ─────── Tag input box ─────── */}
      <div className="relative">
        <div className="relative flex flex-wrap items-center gap-1.5 min-h-[42px] w-full rounded-md border border-slate-300 bg-white pl-2 pr-10 py-1.5 focus-within:ring-2 focus-within:ring-sky-400 dark:border-white/10 dark:bg-slate-900/60">
          {/* Selected tags */}
          {selectedCats.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md bg-sky-100 border border-sky-300 text-sky-900 dark:bg-sky-500/20 dark:border-sky-500/40 dark:text-sky-100 text-xs"
            >
              <span aria-hidden="true">{c.icon || "🏷️"}</span>
              <span className="font-medium">{translateCategory(c.display_name, locale)}</span>
              <button
                type="button"
                onClick={() => removeCategory(c.id)}
                className="ml-0.5 w-4 h-4 inline-flex items-center justify-center rounded text-sky-700 hover:bg-sky-200 dark:text-sky-300 dark:hover:bg-sky-500/30 dark:hover:text-white"
                aria-label={`Quitar ${translateCategory(c.display_name, locale)}`}
                tabIndex={-1}
              >
                ✕
              </button>
            </span>
          ))}

          {/* Free-text input */}
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              if (suggestions.length > 0) setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? t("radar.categoryPlaceholder", "Todas las categorías") : ""}
            autoComplete="off"
            spellCheck={false}
            className="flex-1 min-w-[140px] bg-transparent text-sm text-slate-900 placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500 focus:outline-none px-1 py-1"
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-autocomplete="list"
          />
        </div>

        {/* Counter + clear-all (top-right of the input box) */}
        {value.length > 0 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <span
              className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-semibold rounded-full bg-sky-500 text-white dark:bg-sky-400 dark:text-slate-900 tabular-nums"
              title={`${value.length} ${
                value.length === 1 ? "categoría seleccionada" : "categorías seleccionadas"
              }`}
              aria-label={`${value.length} categorías seleccionadas`}
            >
              {value.length}
            </span>
            <button
              type="button"
              onClick={clearAll}
              className="text-[11px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-white/5"
              aria-label={t("radar.clearAll", "Limpiar todo")}
            >
              ✕ {t("common.clear", "Limpiar")}
            </button>
          </div>
        )}

        {/* Autocomplete dropdown */}
        {open && search.trim().length >= MIN_SEARCH_CHARS && (
          <div
            role="listbox"
            className="absolute z-50 mt-1 w-full rounded-md border border-slate-300 bg-white shadow-2xl shadow-black/10 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/40 max-h-72 overflow-y-auto"
          >
            {loading && (
              <div className="px-3 py-2 text-xs text-slate-500 inline-flex items-center gap-2">
                <svg className="animate-spin text-sky-500 dark:text-sky-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                {t("radar.searching", "Buscando...")}
              </div>
            )}
            {error && (
              <div className="px-3 py-2 text-xs text-red-600 dark:text-red-400">⚠️ {error}</div>
            )}
            {!loading && !error && suggestions.length === 0 && (
              <div className="px-3 py-3 text-xs text-slate-500">
                {t("common.empty", "Sin resultados")} <span className="text-slate-900 dark:text-slate-300">"{search}"</span>.
              </div>
            )}
            {suggestions.map((c, i) => (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={i === highlighted}
                onClick={() => addCategory(c)}
                onMouseEnter={() => setHighlighted(i)}
                className={cn(
                  "w-full text-left px-3 py-2 flex items-center gap-2 border-b border-slate-200 last:border-b-0 dark:border-white/5 transition-colors",
                  i === highlighted
                    ? "bg-sky-100 dark:bg-sky-500/15"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800/50"
                )}
              >
                <span className="text-base shrink-0" aria-hidden="true">
                  {c.icon || "🏷️"}
                </span>
                <span className="flex-1 min-w-0">
                  <div className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                    {translateCategory(c.display_name, locale)}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    → {c.query}
                    {c.usage_count > 0 && (
                      <span className="ml-2 text-amber-500 dark:text-amber-400">
                        ⭐ {c.usage_count}
                      </span>
                    )}
                  </div>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─────── Más usadas (top by usage_count, dynamic) ─────── */}
      {topVisible.length > 0 && (
        <div className="relative">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[11px] uppercase tracking-wide text-slate-700 dark:text-slate-400 font-semibold">
              ⭐ {t("radar.mostUsed", "Más usadas")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-nowrap py-0.5">
            {topVisible.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => addCategory(c)}
                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-800/50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-slate-100 transition-colors shadow-2xs whitespace-nowrap"
              >
                <span aria-hidden="true">{c.icon || "🏷️"}</span>
                <span className="font-medium">{translateCategory(c.display_name, locale)}</span>
                {c.usage_count > 0 && (
                  <span className="ml-0.5 text-amber-600 dark:text-amber-400 text-[10px] font-semibold">
                    {c.usage_count}
                  </span>
                )}
              </button>
            ))}
            <button
              type="button"
              onClick={openPopover}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 hover:text-sky-800 dark:bg-sky-500/10 dark:text-sky-200 dark:border-sky-500/30 dark:hover:bg-sky-500/20 font-medium transition-colors shadow-2xs whitespace-nowrap"
              title={t("radar.viewAll", "Ver todas")}
            >
              +{t("radar.viewAll", "Ver todas")}
            </button>
          </div>

          {/* Popover with all categories */}
          {popoverOpen && (
            <div className="absolute z-40 left-0 right-0 mt-1 rounded-md border border-slate-300 bg-white shadow-2xl shadow-black/10 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/50 max-h-80 overflow-y-auto">
              <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-3 py-2 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">
                  {t("radar.allCategories", "Todas")} ({popoverCats.length})
                </span>
                <button
                  type="button"
                  onClick={() => setPopoverOpen(false)}
                  className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 text-xs"
                >
                  ✕ {t("common.close", "Cerrar")}
                </button>
              </div>
              {popoverLoading ? (
                <div className="px-3 py-4 text-center text-xs text-slate-500">
                  <svg className="inline-block animate-spin text-sky-500 dark:text-sky-400 mr-1" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Cargando...
                </div>
              ) : (
                <div className="p-1.5">
                  {popoverCats.map((c) => {
                    const isSelected = selectedSet.has(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          isSelected ? removeCategory(c.id) : addCategory(c);
                        }}
                        className={cn(
                          "w-full text-left px-2.5 py-1.5 flex items-center gap-2 rounded text-sm transition-colors",
                          isSelected
                            ? "bg-sky-100 text-sky-900 dark:bg-sky-500/20 dark:text-sky-100"
                            : "hover:bg-slate-100 text-slate-800 dark:hover:bg-slate-800/60 dark:text-slate-200"
                        )}
                      >
                        <span aria-hidden="true">{c.icon || "🏷️"}</span>
                        <span className="flex-1">{translateCategory(c.display_name, locale)}</span>
                        {c.usage_count > 0 && (
                          <span className="text-amber-500 dark:text-amber-400/80 text-[10px]">
                            {c.usage_count}×
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-sky-700 dark:text-sky-300 text-[10px]">✓</span>
                        )}
                      </button>
                    );
                  })}
                  {popoverCats.length === 0 && (
                    <div className="px-3 py-4 text-center text-xs text-slate-500">
                      No hay más categorías disponibles
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
