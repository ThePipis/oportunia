"use client";

import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  tier: "hot" | "warm" | "nurture" | "skip";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const COLOR_CLASSES = {
  hot: "from-amber-500 to-orange-600 shadow-orange-500/30 text-white",
  warm: "from-sky-500 to-cyan-600 shadow-sky-500/30 text-white",
  nurture: "from-emerald-500 to-green-600 shadow-emerald-500/30 text-white",
  skip: "from-slate-400 to-slate-600 shadow-slate-500/30 text-white",
};

const PILL_CLASSES = {
  hot: "bg-amber-100/90 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30",
  warm: "bg-sky-100/90 text-sky-900 border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30",
  nurture: "bg-emerald-100/90 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30",
  skip: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

const SIZE_CLASSES = {
  sm: "w-12 h-12 text-sm",
  md: "w-16 h-16 text-lg",
  lg: "w-24 h-24 text-3xl",
};

export function ScoreBadge({ score, tier, size = "md", className }: ScoreBadgeProps) {
  const { t } = useT();

  const tierConfig = {
    hot: { label: t("scoring.tierHot", "🔥 HOT · Cerrar esta semana") },
    warm: { label: t("scoring.tierWarm", "⚡ WARM · Lead Calificado") },
    nurture: { label: t("scoring.tierNurture", "🌱 NURTURE · Seguimiento") },
    skip: { label: t("scoring.tierSkip", "⚪ SKIP · Descartar") },
  };

  const config = tierConfig[tier];
  const colorClass = COLOR_CLASSES[tier];
  const pillClass = PILL_CLASSES[tier];
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "rounded-full bg-gradient-to-br flex items-center justify-center font-black font-display text-white shadow-lg ring-4 ring-white dark:ring-slate-900 transition-transform duration-200",
          colorClass,
          sizeClass,
          className
        )}
        aria-label={`Score ${score} / 100, ${config.label}`}
      >
        {score}
      </div>
      <span
        className={cn(
          "px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-2xs text-center whitespace-nowrap",
          pillClass
        )}
      >
        {config.label}
      </span>
    </div>
  );
}
