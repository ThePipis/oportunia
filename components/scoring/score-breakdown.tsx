import * as React from "react";
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

const DIMENSIONS = [
  {
    key: "brechaDigital" as const,
    label: "Brecha Digital",
    description: "Atraso en lo digital (web, redes, chat, booking)",
    icon: "🌐",
    color: "from-orange-500 to-rose-500",
    barColor: "bg-gradient-to-r from-orange-400 to-rose-500",
  },
  {
    key: "gapOperativo" as const,
    label: "Gap Operativo",
    description: "Capacidad operativa (24/7, leads, contacto)",
    icon: "⏰",
    color: "from-amber-500 to-yellow-500",
    barColor: "bg-gradient-to-r from-amber-400 to-yellow-500",
  },
  {
    key: "fitNegocio" as const,
    label: "Fit del Negocio",
    description: "Encaja con tus servicios AI (sector + ticket)",
    icon: "🎯",
    color: "from-sky-500 to-cyan-500",
    barColor: "bg-gradient-to-r from-sky-400 to-cyan-500",
  },
  {
    key: "senalesCompra" as const,
    label: "Señales de Compra",
    description: "Tiene dinero y voluntad de invertir",
    icon: "💰",
    color: "from-emerald-500 to-green-500",
    barColor: "bg-gradient-to-r from-emerald-400 to-green-500",
  },
  {
    key: "proximidad" as const,
    label: "Proximidad",
    description: "Puedes llegar físicamente",
    icon: "📍",
    color: "from-violet-500 to-purple-500",
    barColor: "bg-gradient-to-r from-violet-400 to-purple-500",
  },
];

export function ScoreBreakdown({ breakdown, reasoning, weights }: ScoreBreakdownProps) {
  return (
    <div className="space-y-4">
      {DIMENSIONS.map((dim) => {
        const value = breakdown[dim.key];
        const weight = Math.round(weights[dim.key] * 100);
        const reason = reasoning?.[dim.key];

        return (
          <div key={dim.key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{dim.icon}</span>
                <div>
                  <span className="text-sm font-semibold text-slate-200">
                    {dim.label}
                  </span>
                  <span className="ml-2 text-xs text-slate-500">
                    (peso {weight}%)
                  </span>
                </div>
              </div>
              <div className="text-lg font-bold font-display text-slate-100">
                {value}
                <span className="text-xs text-slate-500 font-normal">/100</span>
              </div>
            </div>

            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={cn("h-full transition-all duration-700", dim.barColor)}
                style={{ width: `${value}%` }}
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {reason ?? dim.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
