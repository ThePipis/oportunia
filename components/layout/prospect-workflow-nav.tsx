"use client";

import * as React from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { Radar, FileText, Calculator, ChevronRight } from "lucide-react";

interface ProspectWorkflowNavProps {
  businessId: string;
  currentStep: "profile" | "proposal";
  className?: string;
}

export function ProspectWorkflowNav({
  businessId,
  currentStep,
  className,
}: ProspectWorkflowNavProps) {
  const { t } = useT();

  return (
    <nav
      aria-label="Workflow Navigation"
      className={cn(
        "flex items-center gap-1 sm:gap-2 p-1.5 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-2xl w-full sm:w-fit text-xs select-none shadow-xs flex-wrap overflow-hidden",
        className
      )}
    >
      {/* Step 0: Back to Radar */}
      <Link
        href="/radar"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 transition-all font-medium border border-transparent hover:border-slate-200 dark:hover:border-white/5"
      >
        <Radar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
        <span>{t("profile.breadcrumbRadar", "Radar")}</span>
      </Link>

      <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 shrink-0" />

      {/* Step 1: Lead Profile */}
      {currentStep === "profile" ? (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 shadow-xs font-bold ring-1 ring-emerald-500/20">
          <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{t("profile.breadcrumbLeadProfile", "Ficha del Prospecto")}</span>
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 font-extrabold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t("common.current", "Actual")}
          </span>
        </div>
      ) : (
        <Link
          href={`/radar/${businessId}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 transition-all font-medium border border-transparent hover:border-slate-200 dark:hover:border-white/5"
        >
          <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>{t("profile.breadcrumbLeadProfile", "Ficha del Prospecto")}</span>
        </Link>
      )}

      <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 shrink-0" />

      {/* Step 2: Commercial Proposal & ROI */}
      {currentStep === "proposal" ? (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 shadow-xs font-bold ring-1 ring-emerald-500/20">
          <Calculator className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{t("profile.breadcrumbProposal", "Propuesta Comercial & ROI")}</span>
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 font-extrabold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t("common.current", "Actual")}
          </span>
        </div>
      ) : (
        <Link
          href={`/proposals/${businessId}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 transition-all font-medium border border-transparent hover:border-slate-200 dark:hover:border-white/5"
        >
          <Calculator className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>{t("profile.breadcrumbProposal", "Propuesta Comercial & ROI")}</span>
          <span className="text-[11px] text-slate-400">→</span>
        </Link>
      )}
    </nav>
  );
}
