"use client";

import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/**
 * Theme Toggle: light/dark
 * - Pill con icono sol/luna
 * - Persiste en localStorage (manejado por I18nProvider)
 */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme, t } = useT();
  const isDark = theme === "dark";

  return (
    <div className={compact ? "relative group inline-flex items-center justify-center" : "inline-flex"}>
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          "inline-flex items-center justify-center w-9 h-9 rounded-full border transition-all shadow-xs",
          isDark
            ? "border-white/10 bg-slate-900/60 hover:bg-slate-800/80 text-amber-300"
            : "border-slate-300 bg-white hover:bg-slate-100 text-slate-700"
        )}
        aria-label={isDark ? t("theme.switch") : t("theme.switch")}
        aria-pressed={isDark}
        title={!compact ? (isDark ? t("theme.tooltipDark", "Modo oscuro (click para claro)") : t("theme.tooltipLight", "Modo claro (click para oscuro)")) : undefined}
      >
        {isDark ? (
          // Sun icon (currently dark, offer to switch to light)
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        ) : (
          // Moon icon (currently light, offer to switch to dark)
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>

      {compact && (
        <div className="absolute left-full ml-3 px-3 py-1.5 bg-black text-white dark:bg-slate-900 dark:text-white border border-white/10 rounded-xl text-xs font-semibold whitespace-nowrap shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-150 ease-out z-50">
          {isDark ? t("theme.tooltipDark", "Modo oscuro (Click para claro)") : t("theme.tooltipLight", "Modo claro (Click para oscuro)")}
        </div>
      )}
    </div>
  );
}
