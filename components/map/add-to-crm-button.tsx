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
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

type Status = "idle" | "saving" | "in_pipeline" | "error";

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
  const { t } = useT();

  const STAGE_LABELS: Record<string, string> = {
    lead: t("crm.stages.lead", "Nuevo lead"),
    contacted: t("crm.stages.contacted", "Contactado"),
    meeting: t("crm.stages.meeting", "Reunión agendada"),
    proposal: t("crm.stages.proposal", "Propuesta enviada"),
    closed_won: t("crm.stages.closed_won", "Cerrado ganado"),
    closed_lost: t("crm.stages.closed_lost", "Cerrado perdido"),
  };
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
  // Moves the business into the lead stage of the pipeline with instant (0ms) optimistic feedback.
  const add = async () => {
    // 1. Optimistic UI (0ms instant response)
    setStatus("in_pipeline");
    setCurrentStage(stage);
    onPipelineChange?.(true, stage);

    // 2. Sync in background
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
    } catch (e: any) {
      // Revert on error
      setStatus("error");
      setErrorMsg(e?.message || "Error");
      setCurrentStage(null);
      onPipelineChange?.(false, null);
    }
  };

  // === Remove action ================================================
  // Pops a native confirm() with the current stage. On confirm, snaps
  // back to "idle" immediately (0ms optimistic) and syncs in background.
  const remove = async () => {
    const prevStage = currentStage;
    const stageLabel = currentStage
      ? STAGE_LABELS[currentStage] ?? currentStage
      : "el pipeline";
    const ok = window.confirm(
      `¿Quitar "${businessName ?? "este negocio"}" del pipeline?\n\n` +
        `Actualmente está en: ${stageLabel}.\n\n` +
        `Esta acción marca el negocio como removido. Lo podés volver a agregar desde el radar con el botón +Pipeline.`
    );
    if (!ok) return;

    // 1. Optimistic UI (0ms instant response)
    setStatus("idle");
    setCurrentStage(null);
    onPipelineChange?.(false, null);

    // 2. Sync in background
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
    } catch (e: any) {
      // Revert on error
      setStatus("error");
      setErrorMsg(e?.message || "Error");
      setCurrentStage(prevStage);
      onPipelineChange?.(true, prevStage);
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
    idle: "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 hover:text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40 dark:hover:bg-emerald-500/25 dark:hover:text-emerald-100 shadow-2xs",
    saving: "bg-slate-100 border border-slate-200 text-slate-500 dark:bg-slate-700/50 dark:border-white/10 dark:text-slate-400 cursor-wait",
    in_pipeline:
      "bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40 dark:hover:bg-amber-500/20 shadow-2xs",
    error: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-red-500/15 dark:border-red-500/40 dark:text-red-300",
  };

  const ariaLabel =
    status === "in_pipeline"
      ? `${businessName ?? "Negocio"} (${STAGE_LABELS[currentStage ?? ""] ?? currentStage ?? "?"})`
      : status === "error"
        ? `Error: ${errorMsg}`
        : `${t("radar.addToCrm", "+ Pipeline")}: ${businessName ?? "negocio"}`;

  const titleText =
    status === "in_pipeline"
      ? `(${STAGE_LABELS[currentStage ?? ""] ?? currentStage ?? "?"})`
      : status === "error"
        ? `Error: ${errorMsg}`
        : t("radar.addToCrm", "+ Pipeline");

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "saving"}
      className={cn(
        "inline-flex items-center justify-center rounded-md border transition-all whitespace-nowrap select-none",
        compact ? "px-2 h-7 text-[11px] gap-1 font-bold" : "px-3 h-8 text-xs gap-1.5 font-semibold",
        stateStyles[status],
        className
      )}
      title={titleText}
      aria-label={ariaLabel}
    >
      {status === "saving" ? (
        <>
          <span
            className="inline-block w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"
            aria-hidden="true"
          />
          <span className="text-[10px]">{t("common.saving", "Guardando...")}</span>
        </>
      ) : status === "in_pipeline" ? (
        <>
          <span aria-hidden="true" className="text-xs font-bold text-amber-600 dark:text-amber-400">
            ✓
          </span>
          <span>{t("radar.inCrm", "En Pipeline")}</span>
        </>
      ) : status === "error" ? (
        <>
          <span aria-hidden="true">⚠️</span>
          <span>{errorMsg || t("common.error", "Error")}</span>
        </>
      ) : (
        <>
          <span aria-hidden="true" className="text-xs">💼</span>
          <span>{t("radar.addToCrm", "+ Pipeline")}</span>
        </>
      )}
    </button>
  );
}
