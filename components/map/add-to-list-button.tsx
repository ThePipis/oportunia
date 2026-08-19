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
import { cn } from "@/lib/utils";

interface List {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: number;
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
  | { mode: "saving" }
  | { mode: "saved"; message: string }
  | { mode: "duplicate"; message: string }
  | { mode: "error"; message: string };

export default function AddToListButton({
  businessId,
  businessName,
  compact = true,
  className,
}: AddToListButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [state, setState] = React.useState<PopoverState>({ mode: "idle" });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Lazy-load the lists when the popover first opens. Pass business_id
  // so the server can annotate each list with `contains_business` —
  // a business can live in many lists, so we mark per-list rather
  // than globally and the popover shows a check on the ones it already
  // belongs to.
  React.useEffect(() => {
    if (!open) return;
    if (state.mode !== "idle") return;
    let cancelled = false;
    setState({ mode: "loading" });
    const url = businessId
      ? `/api/lists?business_id=${encodeURIComponent(businessId)}`
      : "/api/lists";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setState({ mode: "ready", lists: data.lists ?? [] });
      })
      .catch((e) => {
        if (cancelled) return;
        setState({ mode: "error", message: e?.message || "Error al cargar" });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Auto-dismiss terminal states after 1.5s
  React.useEffect(() => {
    if (state.mode !== "saved" && state.mode !== "duplicate") return;
    const t = setTimeout(() => setOpen(false), 1500);
    return () => clearTimeout(t);
  }, [state]);

  const addToExistingList = async (listId: string) => {
    setState({ mode: "saving" });
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
      // The API returns 201 + added:true for a fresh insert, or
      // 200 + added:false when the (list, business) pair already
      // exists. Both are normal outcomes — surface a different
      // message so the user can see what happened.
      if (data.added === false) {
        setState({
          mode: "duplicate",
          message: "Ya está en esta lista",
        });
      } else {
        setState({ mode: "saved", message: "✓ Agregado" });
      }
    } catch (e: any) {
      setState({ mode: "error", message: e?.message || "Error" });
    }
  };

  // Inverse of addToExistingList: removes the business from a list
  // and flips the row back to the "+ Agregar" state without closing
  // the popover. Used by the ✕ button on rows that already show
  // "✓ Ya está". The caller is responsible for stopPropagation on
  // the event so the row's own onClick (which adds) doesn't fire.
  const [removingListId, setRemovingListId] = React.useState<string | null>(null);
  const removeFromList = async (listId: string) => {
    if (removingListId) return;
    setRemovingListId(listId);
    try {
      const res = await fetch(`/api/lists/${listId}/items/${businessId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }
      // Flip the row locally: the business is no longer in the list,
      // so contains_business becomes false. We don't re-fetch the
      // whole list — the in-place patch is enough for the UI and
      // avoids a flash of the loading state.
      setState((prev) => {
        if (prev.mode !== "ready" && prev.mode !== "creating") return prev;
        return {
          ...prev,
          lists: prev.lists.map((l) =>
            l.id === listId ? { ...l, contains_business: false } : l
          ),
        };
      });
    } catch (err: any) {
      setState({ mode: "error", message: err?.message || "Error" });
    } finally {
      setRemovingListId(null);
    }
  };

  const createListOnly = async () => {
    if (state.mode !== "creating") return;
    const name = state.draft.trim();
    if (!name) return;
    setState({ mode: "saving" });
    try {
      // Create the list. We intentionally do NOT add the current
      // business to the new list — the user might want an empty
      // list to add businesses to later, or might want to pick
      // different businesses. The new list row shows up immediately
      // in the popover with the regular "+ Agregar" affordance, so
      // the user can add the business (or others) manually.
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
      // Switch back to the list view and prepend the new list so it
      // appears at the top (matches /api/lists ORDER BY created_at
      // DESC). Mark contains_business: false so the row renders the
      // normal "+ Agregar" hover hint, not the "Ya está" amber badge.
      setState({
        mode: "ready",
        lists: [{ ...list, contains_business: false }, ...state.lists],
      });
    } catch (e: any) {
      setState({ mode: "error", message: e?.message || "Error" });
    }
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      {/* Trigger button — same look as the other IconAction cells */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          // Reset to idle so the lazy-load effect re-fires if user reopens
          if (!open) setState({ mode: "idle" });
          setOpen((v) => !v);
        }}
        className={cn(
          "inline-flex items-center justify-center rounded-md",
          compact ? "w-7 h-7 text-[14px]" : "px-2.5 h-7 text-[12px] gap-1.5",
          "bg-sky-500/10 hover:bg-sky-500/25 border border-sky-500/30 hover:border-sky-500/60",
          "text-sky-300 hover:text-sky-100 transition-colors",
          "font-medium"
        )}
        title="Agregar a una lista"
        aria-label="Agregar a una lista"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span aria-hidden="true">+</span>
        {!compact && <span>Lista</span>}
      </button>

      {/* Popover */}
      {open && (
        <div
          role="dialog"
          aria-label="Agregar a lista"
          className="absolute z-50 right-0 mt-1.5 w-72 rounded-lg border border-white/10 bg-slate-900/95 backdrop-blur-md shadow-2xl shadow-black/50 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-white/5 bg-slate-800/50">
            <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
              Agregar a lista
            </p>
            {businessName && (
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {businessName}
              </p>
            )}
          </div>

          {/* Body */}
          <div className="max-h-64 overflow-y-auto">
            {(state.mode === "loading" || state.mode === "idle") && (
              <div className="px-3 py-4 text-center text-xs text-slate-500">
                <span className="inline-block w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mr-1.5" />
                Cargando listas...
              </div>
            )}

            {state.mode === "ready" && state.lists.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-slate-500">
                No tenés listas todavía. Creá la primera abajo.
              </div>
            )}

            {(state.mode === "ready" || state.mode === "creating") &&
              state.lists.map((l) => {
                const alreadyIn = !!l.contains_business;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => addToExistingList(l.id)}
                    className={`w-full text-left px-3 py-2 border-b border-white/5 last:border-b-0 flex items-center gap-2 group ${
                      alreadyIn
                        ? "bg-amber-500/5 hover:bg-amber-500/10"
                        : "hover:bg-slate-800/70"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: l.color === "sky" ? "#0ea5e9" : l.color === "emerald" ? "#10b981" : l.color === "amber" ? "#f59e0b" : l.color === "violet" ? "#8b5cf6" : l.color === "rose" ? "#f43f5e" : "#0ea5e9" }}
                      aria-hidden="true"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-slate-100 truncate">
                        {l.name}
                      </span>
                      {l.description && (
                        <span className="block text-[10px] text-slate-500 truncate">
                          {l.description}
                        </span>
                      )}
                    </span>
                    {alreadyIn ? (
                      <span
                        className="shrink-0 inline-flex items-center gap-1.5"
                        title="Este negocio ya está en esta lista"
                      >
                        <span className="text-amber-300 text-xs font-medium inline-flex items-center gap-1">
                          <span aria-hidden="true">✓</span>
                          <span>Ya está</span>
                        </span>
                        {/* Inline ✕ button — removes the business from
                            this list directly. Stops propagation so the
                            row's onClick (which adds) doesn't fire.
                            Shows on hover so the row stays calm at rest. */}
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={`Quitar ${businessName ?? "este negocio"} de la lista ${l.name}`}
                          title={`Quitar de "${l.name}"`}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromList(l.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              removeFromList(l.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 inline-flex items-center justify-center w-5 h-5 rounded text-slate-500 dark:text-slate-500 hover:text-red-300 dark:hover:text-red-300 hover:bg-red-500/15 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                        >
                          {removingListId === l.id ? (
                            <span
                              className="inline-block w-3 h-3 border-2 border-red-300 border-t-transparent rounded-full animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <span aria-hidden="true" className="text-[14px] leading-none">✕</span>
                          )}
                        </span>
                      </span>
                    ) : (
                      <span className="text-sky-400 opacity-0 group-hover:opacity-100 text-xs shrink-0">
                        + Agregar
                      </span>
                    )}
                  </button>
                );
              })}

            {state.mode === "saving" && (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                <span className="inline-block w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mr-1.5" />
                Guardando...
              </div>
            )}

            {state.mode === "saved" && (
              <div className="px-3 py-4 text-center text-sm text-emerald-400 font-medium">
                {state.message}
              </div>
            )}

            {state.mode === "duplicate" && (
              <div className="px-3 py-4 text-center text-sm text-amber-300 font-medium">
                <span aria-hidden="true">ℹ️</span> {state.message}
              </div>
            )}

            {state.mode === "error" && (
              <div className="px-3 py-4 text-center text-xs text-red-400">
                ⚠ {state.message}
              </div>
            )}
          </div>

          {/* Footer: create new list */}
          {(state.mode === "ready" || state.mode === "creating") && (
            <div className="border-t border-white/5 p-2 bg-slate-800/30">
              {state.mode === "ready" ? (
                <button
                  type="button"
                  onClick={() =>
                    setState({ mode: "creating", lists: state.lists, draft: "" })
                  }
                  className="w-full text-left px-2 py-1.5 text-xs text-sky-300 hover:bg-slate-800/70 rounded flex items-center gap-1.5"
                >
                  <span aria-hidden="true">+</span>
                  <span>Crear nueva lista</span>
                </button>
              ) : (
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
                    placeholder="Nombre (ej. Q3-2026-Outreach)"
                    className="flex-1 min-w-0 bg-slate-900/60 border border-white/10 rounded px-2 py-1 text-xs text-slate-100 placeholder-slate-600"
                  />
                  <button
                    type="button"
                    onClick={createListOnly}
                    disabled={!state.draft.trim()}
                    className="px-2 py-1 text-xs bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded font-medium"
                  >
                    Crear
                  </button>
                  <button
                    type="button"
                    onClick={() => setState({ mode: "ready", lists: state.lists })}
                    className="px-1.5 py-1 text-xs text-slate-500 hover:text-slate-300"
                    aria-label="Cancelar"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
