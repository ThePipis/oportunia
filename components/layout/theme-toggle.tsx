"use client";

import * as React from "react";
import { useTheme } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/**
 * Theme Toggle: light/dark
 * - Pill con icono sol/luna
 * - Persiste en localStorage (manejado por I18nProvider)
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center justify-center w-9 h-9 rounded-full border transition-all",
        isDark
          ? "border-white/10 bg-slate-900/60 hover:bg-slate-800/80 text-amber-300"
          : "border-slate-300 bg-white hover:bg-slate-100 text-slate-700"
      )}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-pressed={isDark}
      title={isDark ? "Modo oscuro (click para cambiar)" : "Modo claro (click para cambiar)"}
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
  );
}
