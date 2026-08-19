"use client";

/**
 * AddToCrmButton — toggleable action that moves a business into /
 * out of the CRM pipeline.
 *
 * Two persistent states (driven by the inPipeline/currentStage props
 * the caller provides; if absent the button falls back to the
 * legacy "click to add" behaviour and reports "duplicate" on a
 * no-op click):
 *
 *   - "idle"  → "+ Pipeline" (emerald). Click → POST /api/crm/move
 *               with stage=lead, transition to "in_pipeline" on
 *               success.
 *   - "in_pipeline" → "− En pipeline" (amber). Click → confirm()
 *               with the business's current stage, then
 *               POST /api/crm/remove on confirm, transition to
 *               "idle" on success.
 *
 * Transient states:
 *   - "saving"  → spinner, button disabled.
 *   - "error"   → ⚠ icon + red colour + error message in the label.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

type Status = "idle" | "saving" | "in_pipeline" | "error";

const STAGE_LABELS: Record<string, string> = {
  lead: "Nuevo lead",
  contacted: "Contactado",
  meeting: "Reunión agendada",
  proposal: "Propuesta enviada",
  closed_won: "Cerrado ganado",
  closed_lost: "Cerrado perdido",
};

interface AddToCrmButtonProps {
  businessId: string;
  businessName?: string;
  /** Initial pipeline state. If undefined, the button assumes
   *  "not in pipeline" and only transitions on a successful
   *  add. Callers that already know the status (e.g. the
   *  business profile page) should pass it for instant rendering. */
  inPipeline?: boolean;
  /** Current stage label key (lead/contacted/...). Only used when
   *  inPipeline is true. */
  currentStage?: string | null;
  /** Target stage for the add action. Defaults to "lead". */
  stage?: string;
  compact?: boolean;
  className?: string;
  /** Called after the toggle changes the pipeline state so the
   *  parent can refresh dependent data. */
  onPipelineChange?: (inPipeline: boolean, stage: string | null) => void;
}

export default function AddToCrmButton({
  businessId,
  businessName,
  inPipeline: inPipelineProp,
  currentStage: currentStageProp = null,
  stage = "lead",
  compact = true,
  className,
  onPipelineChange,
}: AddToCrmButtonProps) {
  // Start in "in_pipeline" if the caller told us so; otherwise "idle".
  // We track stage in local state too so the post-action transitions
  // (e.g. after a remove) keep the UI consistent until the parent
  // re-fetches and passes an updated prop.
  const [status, setStatus] = React.useState<Status>(
    inPipelineProp ? "in_pipeline" : "idle"
  );
  const [currentStage, setCurrentStage] = React.useState<string | null>(
    currentStageProp
  );
  const [errorMsg, setErrorMsg] = React.useState<string>("");

  // Keep local state in sync if the parent passes new props (e.g.
  // after a refresh). This is what makes the button feel "live" —
  // the profile page re-fetches /full on a recalc, and the button
  // quietly updates its toggle state.
  React.useEffect(() => {
    if (inPipelineProp === undefined) return;
    setStatus(inPipelineProp ? "in_pipeline" : "idle");
    setCurrentStage(currentStageProp);
  }, [inPipelineProp, currentStageProp]);

  // Auto-reset the error state after 1.5s so a transient API hiccup
  // doesn't get stuck in the user's face. The idle / in_pipeline
  // states are persistent (driven by the props / explicit actions).
  React.useEffect(() => {
    if (status !== "error") return;
    const t = setTimeout(() => setStatus(inPipelineProp ? "in_pipeline" : "idle"), 1500);
    return () => clearTimeout(t);
  }, [status, inPipelineProp]);

  // === Add action ===================================================
  // Moves the business into the lead stage of the pipeline. Used
  // when the button is in "idle" state.
  const add = async () => {
    if (status === "saving") return;
    setStatus("saving");
    try {
      const res = await fetch("/api/crm/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId, stage }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`);
      }
      // /api/crm/move returns { added:false, duplicate:true } when
      // the business is already in the requested stage. We still
      // surface that as "in_pipeline" so the UI is correct, but
      // treat it as a no-op (no rescore needed).
      if (data.added === false || data.duplicate === true) {
        setStatus("in_pipeline");
        setCurrentStage(stage);
        onPipelineChange?.(true, stage);
        return;
      }
      setStatus("in_pipeline");
      setCurrentStage(stage);
      onPipelineChange?.(true, stage);
    } catch (e: any) {
      setStatus("error");
      setErrorMsg(e?.message || "Error");
    }
  };

  // === Remove action ================================================
  // Pops a native confirm() with the current stage so the user
  // knows WHERE the business is before they pull it. On confirm we
  // hit /api/crm/remove and snap back to "idle".
  const remove = async () => {
    if (status === "saving") return;
    const stageLabel = currentStage
      ? STAGE_LABELS[currentStage] ?? currentStage
      : "el pipeline";
    const ok = window.confirm(
      `¿Quitar "${businessName ?? "este negocio"}" del pipeline?\n\n` +
        `Actualmente está en: ${stageLabel}.\n\n` +
        `Esta acción marca el negocio como removido. Lo podés volver a agregar desde el radar con el botón +Pipeline.`
    );
    if (!ok) return;
    setStatus("saving");
    try {
      const res = await fetch("/api/crm/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }
      setStatus("idle");
      setCurrentStage(null);
      onPipelineChange?.(false, null);
    } catch (e: any) {
      setStatus("error");
      setErrorMsg(e?.message || "Error");
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status === "in_pipeline") {
      remove();
    } else if (status === "idle") {
      add();
    }
    // "saving" and "error" are no-ops on click (the button is
    // disabled while saving; error auto-resets to the persistent
    // state after 1.5s).
  };

  // === Visual state =================================================
  const stateStyles: Record<Status, string> = {
    idle: "bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300 hover:text-emerald-100",
    saving: "bg-slate-700/50 border border-white/10 text-slate-400 cursor-wait",
    in_pipeline:
      "bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/60 text-amber-300 hover:text-amber-100",
    error: "bg-red-500/15 border border-red-500/40 text-red-300",
  };

  const ariaLabel =
    status === "in_pipeline"
      ? `${businessName ?? "Negocio"} en el pipeline (${STAGE_LABELS[currentStage ?? ""] ?? currentStage ?? "?"}) — click para quitar`
      : status === "error"
        ? `Error: ${errorMsg}`
        : `Agregar ${businessName ?? "negocio"} al pipeline de ventas`;

  const titleText =
    status === "in_pipeline"
      ? `Click para quitar del pipeline (actualmente en ${STAGE_LABELS[currentStage ?? ""] ?? currentStage ?? "?"})`
      : status === "error"
        ? `Error: ${errorMsg}`
        : "Agregar al pipeline de ventas";

  // The compact mode (radar table, list detail) renders only an icon.
  // The non-compact mode (profile page) shows icon + label.
  const labelText =
    status === "in_pipeline"
      ? "En pipeline"
      : status === "error"
        ? errorMsg
        : "Pipeline";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "saving"}
      className={cn(
        "inline-flex items-center justify-center rounded-md transition-colors whitespace-nowrap",
        compact ? "w-7 h-7 text-[14px]" : "px-2.5 h-7 text-[12px] gap-1.5",
        stateStyles[status],
        "font-medium",
        className
      )}
      title={titleText}
      aria-label={ariaLabel}
    >
      {status === "saving" ? (
        <span
          className="inline-block w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
      ) : status === "in_pipeline" ? (
        <span aria-hidden="true" className="text-[14px] leading-none font-bold">
          −
        </span>
      ) : status === "error" ? (
        <span aria-hidden="true">⚠</span>
      ) : (
        <span aria-hidden="true">+</span>
      )}
      {!compact && <span>{labelText}</span>}
    </button>
  );
}
