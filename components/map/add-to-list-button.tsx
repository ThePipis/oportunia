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

  // Lazy-load the lists when the popover first opens
  React.useEffect(() => {
    if (!open) return;
    if (state.mode !== "idle") return;
    let cancelled = false;
    setState({ mode: "loading" });
    fetch("/api/lists")
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
  }, [open]);

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

  // Auto-dismiss "saved" state after 1.5s
  React.useEffect(() => {
    if (state.mode !== "saved") return;
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
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      setState({ mode: "saved", message: "✓ Agregado" });
    } catch (e: any) {
      setState({ mode: "error", message: e?.message || "Error" });
    }
  };

  const createAndAdd = async () => {
    if (state.mode !== "creating") return;
    const name = state.draft.trim();
    if (!name) return;
    setState({ mode: "saving" });
    try {
      // 1) Create the list
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
      // 2) Add the business to it
      const addRes = await fetch(`/api/lists/${list.id}/items/${businessId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!addRes.ok) {
        const err = await addRes.json().catch(() => ({}));
        throw new Error(err.error || "Error al agregar");
      }
      setState({
        mode: "saved",
        message: `✓ Creado "${name}" + agregado`,
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
              state.lists.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => addToExistingList(l.id)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800/70 border-b border-white/5 last:border-b-0 flex items-center gap-2 group"
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
                  <span className="text-sky-400 opacity-0 group-hover:opacity-100 text-xs">
                    + Agregar
                  </span>
                </button>
              ))}

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
                        createAndAdd();
                      } else if (e.key === "Escape") {
                        setState({ mode: "ready", lists: state.lists });
                      }
                    }}
                    placeholder="Nombre (ej. Q3-2026-Outreach)"
                    className="flex-1 min-w-0 bg-slate-900/60 border border-white/10 rounded px-2 py-1 text-xs text-slate-100 placeholder-slate-600"
                  />
                  <button
                    type="button"
                    onClick={createAndAdd}
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
