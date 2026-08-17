import * as React from "react";
import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  tier: "hot" | "warm" | "nurture" | "skip";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const TIER_CONFIG = {
  hot: { label: "🔥 Cerrar esta semana", color: "gold" },
  warm: { label: "⚡ Lead caliente", color: "cyan" },
  nurture: { label: "🌱 Nurture", color: "green" },
  skip: { label: "❌ Skip", color: "red" },
} as const;

const COLOR_CLASSES = {
  gold: "from-yellow-400 to-amber-500 shadow-yellow-500/40",
  cyan: "from-sky-400 to-cyan-500 shadow-sky-500/40",
  green: "from-emerald-400 to-green-500 shadow-emerald-500/40",
  red: "from-red-400 to-rose-500 shadow-red-500/40",
};

const SIZE_CLASSES = {
  sm: "w-12 h-12 text-sm",
  md: "w-16 h-16 text-lg",
  lg: "w-24 h-24 text-2xl",
};

export function ScoreBadge({ score, tier, size = "md", className }: ScoreBadgeProps) {
  const config = TIER_CONFIG[tier];
  const colorClass = COLOR_CLASSES[config.color];
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={cn(
          "rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white shadow-lg ring-2 ring-white/10",
          colorClass,
          sizeClass,
          className
        )}
        aria-label={`Score ${score} de 100, ${config.label}`}
      >
        {score}
      </div>
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
        {config.label}
      </span>
    </div>
  );
}
