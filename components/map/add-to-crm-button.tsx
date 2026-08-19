"use client";

/**
 * AddToCrmButton — moves a business to the "lead" stage of the CRM
 * pipeline in one click. Shows a brief "✓ Agregado al pipeline" /
 * "Ya estaba" feedback after the action.
 *
 * The actual move is done by the same /api/crm/move endpoint used by
 * the kanban board — this is just a quick-action shortcut from the
 * radar / profile.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

type Status = "idle" | "saving" | "added" | "duplicate" | "error";

interface AddToCrmButtonProps {
  businessId: string;
  businessName?: string;
  /** "lead" (default), "contacted", "meeting", etc. */
  stage?: string;
  compact?: boolean;
  className?: string;
  /** Called after a successful add so the parent can refresh data */
  onAdded?: () => void;
}

export default function AddToCrmButton({
  businessId,
  businessName,
  stage = "lead",
  compact = true,
  className,
  onAdded,
}: AddToCrmButtonProps) {
  const [status, setStatus] = React.useState<Status>("idle");
  const [message, setMessage] = React.useState<string>("");

  // Auto-reset the success/error feedback after 1.5s
  React.useEffect(() => {
    if (status === "idle" || status === "saving") return;
    const t = setTimeout(() => setStatus("idle"), 1500);
    return () => clearTimeout(t);
  }, [status]);

  const add = async () => {
    if (status === "saving") return;
    setStatus("saving");
    try {
      const res = await fetch("/api/crm/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId, stage }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      setStatus("added");
      setMessage("✓ Al pipeline");
      onAdded?.();
    } catch (e: any) {
      setStatus("error");
      setMessage(e?.message || "Error");
    }
  };

  // Choose color per state — emerald when idle/added, emerald-bright on
  // hover, slate when saving, red on error
  const stateStyles: Record<Status, string> = {
    idle: "bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300 hover:text-emerald-100",
    saving: "bg-slate-700/50 border border-white/10 text-slate-400 cursor-wait",
    added: "bg-emerald-500/30 border border-emerald-400/60 text-emerald-100",
    duplicate: "bg-amber-500/15 border border-amber-500/40 text-amber-200",
    error: "bg-red-500/15 border border-red-500/40 text-red-300",
  };

  const ariaLabel =
    status === "added"
      ? `${businessName ?? "Negocio"} agregado al pipeline`
      : `Agregar ${businessName ?? "negocio"} al pipeline de ventas`;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        add();
      }}
      disabled={status === "saving"}
      className={cn(
        "inline-flex items-center justify-center rounded-md transition-colors",
        compact ? "w-7 h-7 text-[14px]" : "px-2.5 h-7 text-[12px] gap-1.5",
        stateStyles[status],
        "font-medium",
        className
      )}
      title={status === "added" ? message : "Agregar al pipeline de ventas"}
      aria-label={ariaLabel}
    >
      {status === "saving" ? (
        <span
          className="inline-block w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
      ) : status === "added" ? (
        <span aria-hidden="true">✓</span>
      ) : status === "error" ? (
        <span aria-hidden="true">⚠</span>
      ) : (
        <span aria-hidden="true">+</span>
      )}
      {!compact && (
        <span>
          {status === "added" ? message : status === "error" ? message : "Pipeline"}
        </span>
      )}
    </button>
  );
}
