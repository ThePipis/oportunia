"use client";

/**
 * AddToListButton — opens a popover with the user's lists so they can
 * add a business to one (or create a new list inline). Used in the
 * radar results table and in the business profile page.
 *
 * Fetches the list of lists lazily (only when the popover opens) so we
 * don't hammer the API on every page render.
 */

import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

interface List {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: number;
  item_count?: number;
  /** True when this list already contains the current business.
   *  Annotated by /api/lists?business_id=… so the popover can mark
   *  existing memberships before the user clicks. */
  contains_business?: boolean;
}

interface AddToListButtonProps {
  businessId: string;
  businessName?: string;
  /** Compact mode for tight rows; defaults to true */
  compact?: boolean;
  className?: string;
}

type PopoverState =
  | { mode: "idle" }
  | { mode: "loading" }
  | { mode: "ready"; lists: List[] }
  | { mode: "creating"; lists: List[]; draft: string }
  | { mode: "saving"; lists: List[] }
  | { mode: "saved"; message: string; lists: List[] }
  | { mode: "removed"; message: string; lists: List[] }
  | { mode: "duplicate"; message: string; lists: List[] }
  | { mode: "error"; message: string; lists: List[] };

// Module-level list cache for 0ms instantaneous opening & optimistic updates
let globalListsCache: { lists: List[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute TTL, revalidates in background

export default function AddToListButton({
  businessId,
  businessName,
  compact = true,
  className,
}: AddToListButtonProps) {
  const { t } = useT();
  const [open, setOpen] = React.useState(false);
  const [state, setState] = React.useState<PopoverState>({ mode: "idle" });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Lazy-load the lists with instant in-memory cache fallback.
  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;

    // 1. If we already have fresh lists in memory, render them INSTANTLY (0ms)
    if (globalListsCache && globalListsCache.lists.length >= 0) {
      setState({ mode: "ready", lists: globalListsCache.lists });
      // If cache is fresh, skip background revalidation
      if (Date.now() - globalListsCache.timestamp < CACHE_TTL_MS) {
        return;
      }
    } else if (state.mode === "idle") {
      setState({ mode: "loading" });
    }

    // 2. Background fetch / revalidation
    const url = businessId
      ? `/api/lists?business_id=${encodeURIComponent(businessId)}`
      : "/api/lists";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const fetchedLists = data.lists ?? [];
        globalListsCache = { lists: fetchedLists, timestamp: Date.now() };
        setState((prev) => {
          if (prev.mode === "saving" || prev.mode === "creating") return prev;
          return { mode: "ready", lists: fetchedLists };
        });
      })
      .catch((e) => {
        if (cancelled) return;
        if (!globalListsCache) {
          setState({ mode: "error", message: e?.message || "Error al cargar", lists: [] });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, businessId]);

  // Click-outside closes the popover
  React.useEffect(() => {
    if (!open) return;
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
  }, [open]);

  // Auto-focus the input when entering "creating" mode
  React.useEffect(() => {
    if (state.mode === "creating") {
      inputRef.current?.focus();
    }
  }, [state.mode]);

  // Auto-dismiss transient messages (saved / removed / duplicate / error) after 1.5 seconds
  React.useEffect(() => {
    if (
      state.mode === "saved" ||
      state.mode === "removed" ||
      state.mode === "duplicate" ||
      state.mode === "error"
    ) {
      const timer = setTimeout(() => {
        setState((prev) => {
          if ("lists" in prev) {
            return { mode: "ready", lists: prev.lists };
          }
          return prev;
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.mode]);

  const addToExistingList = async (listId: string) => {
    // 1. Optimistic UI: update local state & cache immediately (0ms)
    const currentLists = "lists" in state ? state.lists : globalListsCache?.lists ?? [];
    const updatedLists = currentLists.map((l) =>
      l.id === listId ? { ...l, contains_business: true, item_count: (l.item_count ?? 0) + 1 } : l
    );
    if (globalListsCache) {
      globalListsCache.lists = updatedLists;
    }
    setState({ mode: "saved", message: "Agregado", lists: updatedLists });

    // 2. Sync in background
    try {
      const res = await fetch(`/api/lists/${listId}/items/${businessId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`);
      }
    } catch (e: any) {
      // Revert on error
      const revertedLists = currentLists.map((l) =>
        l.id === listId ? { ...l, contains_business: false } : l
      );
      if (globalListsCache) globalListsCache.lists = revertedLists;
      setState({ mode: "error", message: e?.message || "Error", lists: revertedLists });
    }
  };

  // Removes the business from a list
  const [removingListId, setRemovingListId] = React.useState<string | null>(null);
  const removeFromList = async (listId: string) => {
    if (removingListId) return;
    setRemovingListId(listId);

    // 1. Optimistic UI: update local state & cache immediately (0ms)
    const currentLists = "lists" in state ? state.lists : globalListsCache?.lists ?? [];
    const updatedLists = currentLists.map((l) =>
      l.id === listId ? { ...l, contains_business: false, item_count: Math.max(0, (l.item_count ?? 1) - 1) } : l
    );
    if (globalListsCache) {
      globalListsCache.lists = updatedLists;
    }
    setState({ mode: "removed", message: "Eliminado", lists: updatedLists });

    // 2. Sync in background
    try {
      const res = await fetch(`/api/lists/${listId}/items/${businessId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`);
      }
    } catch (e: any) {
      // Revert on error
      const revertedLists = currentLists.map((l) =>
        l.id === listId ? { ...l, contains_business: true } : l
      );
      if (globalListsCache) globalListsCache.lists = revertedLists;
      setState({ mode: "error", message: e?.message || "Error", lists: revertedLists });
    } finally {
      setRemovingListId(null);
    }
  };

  const createListOnly = async () => {
    if (state.mode !== "creating") return;
    const name = state.draft.trim();
    if (!name) return;
    
    setState((prev) => {
      const lists = "lists" in prev ? prev.lists : [];
      return { mode: "saving" as const, lists };
    });
    try {
      const createRes = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.error || "Error al crear lista");
      }
      const { list } = await createRes.json();
      
      setState((prev) => {
        const lists = "lists" in prev ? prev.lists : [];
        return {
          mode: "ready",
          lists: [{ ...list, contains_business: false }, ...lists],
        };
      });
    } catch (e: any) {
      setState((prev) => {
        const lists = "lists" in prev ? prev.lists : [];
        return { mode: "error", message: e?.message || "Error", lists };
      });
    }
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!open) setState({ mode: "idle" });
          setOpen((v) => !v);
        }}
        className={cn(
          "inline-flex items-center justify-center rounded-md border transition-all select-none shadow-2xs",
          compact
            ? "px-2 h-7 text-[11px] gap-1 font-bold bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100 hover:text-sky-900 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/40 dark:hover:bg-sky-500/25 dark:hover:text-sky-100"
            : "px-3 h-8 text-xs gap-1.5 font-semibold bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100 hover:text-sky-900 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/40 dark:hover:bg-sky-500/25 dark:hover:text-sky-100",
          open && "ring-2 ring-sky-400 ring-offset-1 dark:ring-offset-slate-950",
          className
        )}
        title={t("crm.addToList", "Agregar a una lista")}
        aria-label={t("crm.addToList", "Agregar a una lista")}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span aria-hidden="true" className="text-xs">📋</span>
        <span>{t("crm.addToList", "+ Lista")}</span>
      </button>

      {/* Popover */}
      {open && (
        <div
          role="dialog"
          aria-label={t("crm.addToList", "Agregar a lista")}
          className="absolute z-50 right-0 mt-1.5 w-72 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden ring-1 ring-black/5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                <span>📋</span>
                <span>{t("crm.addToList", "Agregar a lista")}</span>
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-bold leading-none p-0.5"
                aria-label={t("common.close", "Cerrar")}
              >
                ✕
              </button>
            </div>
            {businessName && (
              <p className="text-xs text-slate-900 dark:text-slate-100 truncate mt-1 font-semibold">
                {businessName}
              </p>
            )}
          </div>

          {/* Body */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
            {(state.mode === "loading" || state.mode === "idle") && (
              <div className="px-3 py-5 text-center text-xs text-slate-500 font-medium">
                <span className="inline-block w-3.5 h-3.5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mr-2 align-middle" />
                {t("common.loading", "Cargando listas...")}
              </div>
            )}

            {/* Transient feedback message */}
            {state.mode === "saved" && (
              <div className="px-3 py-2 text-center text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border-b border-emerald-200 dark:border-emerald-500/20 font-bold">
                <span aria-hidden="true">✓</span> {state.message}
              </div>
            )}
            {state.mode === "removed" && (
              <div className="px-3 py-2 text-center text-xs text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-500/15 border-b border-red-200 dark:border-red-500/25 font-bold">
                <span aria-hidden="true">✕</span> {state.message}
              </div>
            )}
            {state.mode === "duplicate" && (
              <div className="px-3 py-2 text-center text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20 font-bold">
                <span aria-hidden="true">ℹ️</span> {state.message}
              </div>
            )}
            {state.mode === "error" && (
              <div className="px-3 py-2 text-center text-xs text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-500/10 border-b border-red-200 dark:border-red-500/20 font-bold">
                <span aria-hidden="true">⚠️</span> {state.message}
              </div>
            )}

            {/* Saving indicator */}
            {state.mode === "saving" && (
              <div className="px-3 py-2 text-center text-xs text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/10 border-b border-sky-200 dark:border-sky-500/20 font-bold">
                <span
                  className="inline-block w-3.5 h-3.5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mr-2 align-middle"
                  aria-hidden="true"
                />
                {t("common.saving", "Guardando cambios...")}
              </div>
            )}

            {/* Lists rendering */}
            {(state.mode === "ready" || state.mode === "creating" ||
              state.mode === "saved" || state.mode === "removed" ||
              state.mode === "duplicate" || state.mode === "error" ||
              state.mode === "saving") && (
              state.lists.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-slate-500 font-medium">
                  {t("lists.empty", "No tienes listas creadas todavía. Crea una abajo.")}
                </div>
              ) : (
                state.lists.map((l) => {
                  const alreadyIn = !!l.contains_business;
                  const isSaving = state.mode === "saving";
                  return (
                    <div
                      key={l.id}
                      onClick={() => {
                        if (!alreadyIn && !isSaving) {
                          addToExistingList(l.id);
                        }
                      }}
                      className={`w-full text-left px-3.5 py-2.5 flex items-center gap-2.5 group transition-colors ${
                        alreadyIn
                          ? "bg-amber-50/80 dark:bg-amber-500/10 hover:bg-amber-100/70 dark:hover:bg-amber-500/15"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/70 cursor-pointer"
                      } ${isSaving ? "opacity-60 cursor-wait" : ""}`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: l.color === "sky" ? "#0ea5e9" : l.color === "emerald" ? "#10b981" : l.color === "amber" ? "#f59e0b" : l.color === "violet" ? "#8b5cf6" : l.color === "rose" ? "#f43f5e" : "#0ea5e9" }}
                        aria-hidden="true"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-slate-900 dark:text-slate-100 font-bold truncate">
                          {l.name}
                        </span>
                        {l.description && (
                          <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">
                            {l.description}
                          </span>
                        )}
                      </span>
                      {alreadyIn ? (
                        <span
                          className="shrink-0 inline-flex items-center gap-1.5"
                          title="Este negocio ya está en esta lista"
                        >
                          <span className="text-amber-800 dark:text-amber-300 text-xs font-bold inline-flex items-center gap-1 bg-amber-100/90 dark:bg-amber-500/25 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/40">
                            <span aria-hidden="true">✓</span>
                            <span>Agregado</span>
                          </span>
                          {/* Inline ✕ button — removes the business from this list */}
                          <button
                            type="button"
                            aria-label={`Quitar de la lista ${l.name}`}
                            title={`Quitar de "${l.name}"`}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromList(l.id);
                            }}
                            className="inline-flex items-center justify-center w-5 h-5 rounded text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                          >
                            {removingListId === l.id ? (
                              <span
                                className="inline-block w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <span aria-hidden="true" className="text-xs font-bold leading-none">✕</span>
                            )}
                          </button>
                        </span>
                      ) : (
                        <span className="text-sky-700 dark:text-sky-400 opacity-0 group-hover:opacity-100 text-xs shrink-0 font-bold transition-opacity">
                          + Agregar
                        </span>
                      )}
                    </div>
                  );
                })
              )
            )}
          </div>

          {/* Footer: create new list */}
          {(state.mode === "ready" || state.mode === "creating" ||
            state.mode === "saved" || state.mode === "removed" ||
            state.mode === "duplicate" || state.mode === "error") && (
            <div className="border-t border-slate-200 dark:border-white/10 p-2.5 bg-slate-50 dark:bg-slate-800/60">
              {state.mode === "creating" ? (
                <div className="flex items-center gap-1.5">
                  <input
                    ref={inputRef}
                    type="text"
                    value={state.draft}
                    onChange={(e) =>
                      setState({
                        mode: "creating",
                        lists: state.lists,
                        draft: e.target.value,
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        createListOnly();
                      } else if (e.key === "Escape") {
                        setState({ mode: "ready", lists: state.lists });
                      }
                    }}
                    placeholder="Nombre (ej. Q3 Clientes)"
                    className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 rounded-md px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={createListOnly}
                    disabled={!state.draft.trim()}
                    className="px-2.5 py-1.5 text-xs bg-sky-600 hover:bg-sky-500 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white rounded-md font-bold transition-colors shadow-2xs"
                  >
                    Crear
                  </button>
                  <button
                    type="button"
                    onClick={() => setState({ mode: "ready", lists: state.lists })}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold text-xs"
                    aria-label="Cancelar"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setState({ mode: "creating", lists: state.lists, draft: "" })
                  }
                  className="w-full text-left px-2.5 py-1.5 text-xs text-sky-700 hover:text-sky-900 hover:bg-sky-100/70 dark:text-sky-300 dark:hover:bg-slate-800 rounded-md flex items-center gap-1.5 font-bold transition-colors"
                >
                  <span aria-hidden="true" className="font-bold">+</span>
                  <span>Crear nueva lista</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
