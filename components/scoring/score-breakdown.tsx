"use client";

import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { translateScoreReason } from "@/lib/scoring/score-i18n";
import { cn } from "@/lib/utils";

interface ScoreBreakdownProps {
  breakdown: {
    brechaDigital: number;
    gapOperativo: number;
    fitNegocio: number;
    senalesCompra: number;
    proximidad: number;
  };
  reasoning?: {
    brechaDigital: string;
    gapOperativo: string;
    fitNegocio: string;
    senalesCompra: string;
    proximidad: string;
  };
  weights: {
    brechaDigital: number;
    gapOperativo: number;
    fitNegocio: number;
    senalesCompra: number;
    proximidad: number;
  };
}

export function ScoreBreakdown({ breakdown, reasoning, weights }: ScoreBreakdownProps) {
  const { t, locale } = useT();

  const dimensions = [
    {
      key: "brechaDigital" as const,
      label: t("scoring.digitalGap", "Brecha Digital"),
      description: t("scoring.digitalGapDesc", "Atraso en lo digital (web, redes, chat, booking)"),
      icon: "🌐",
      color: "from-orange-500 to-rose-500",
      barColor: "bg-gradient-to-r from-orange-400 to-rose-500",
    },
    {
      key: "gapOperativo" as const,
      label: t("scoring.operationalGap", "Gap Operativo"),
      description: t("scoring.operationalGapDesc", "Capacidad operativa (24/7, leads, contacto)"),
      icon: "⏰",
      color: "from-amber-500 to-yellow-500",
      barColor: "bg-gradient-to-r from-amber-400 to-yellow-500",
    },
    {
      key: "fitNegocio" as const,
      label: t("scoring.businessFit", "Fit del Negocio"),
      description: t("scoring.businessFitDesc", "Encaja con tus servicios AI (sector + ticket)"),
      icon: "🎯",
      color: "from-sky-500 to-cyan-500",
      barColor: "bg-gradient-to-r from-sky-400 to-cyan-500",
    },
    {
      key: "senalesCompra" as const,
      label: t("scoring.buyingSignals", "Señales de Compra"),
      description: t("scoring.buyingSignalsDesc", "Tiene dinero y voluntad de invertir"),
      icon: "💰",
      color: "from-emerald-500 to-green-500",
      barColor: "bg-gradient-to-r from-emerald-400 to-green-500",
    },
    {
      key: "proximidad" as const,
      label: t("scoring.proximity", "Proximidad"),
      description: t("scoring.proximityDesc", "Puedes llegar físicamente"),
      icon: "📍",
      color: "from-violet-500 to-purple-500",
      barColor: "bg-gradient-to-r from-violet-400 to-purple-500",
    },
  ];

  return (
    <div className="space-y-4">
      {dimensions.map((dim) => {
        const value = breakdown[dim.key];
        const weight = Math.round(weights[dim.key] * 100);
        const rawReason = reasoning?.[dim.key];
        const reason = rawReason ? translateScoreReason(rawReason, locale) : dim.description;

        return (
          <div key={dim.key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{dim.icon}</span>
                <div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {dim.label}
                  </span>
                  <span className="ml-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    ({t("scoring.weight", { percent: weight }, `peso ${weight}%`)})
                  </span>
                </div>
              </div>
              <div className="text-lg font-bold font-display text-slate-900 dark:text-slate-100">
                {value}
                <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">/100</span>
              </div>
            </div>

            <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={cn("h-full transition-all duration-700", dim.barColor)}
                style={{ width: `${value}%` }}
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              {reason}
            </p>
          </div>
        );
      })}
    </div>
  );
}
