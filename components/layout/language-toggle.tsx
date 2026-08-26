"use client";

import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";

/**
 * Toggle de idioma ES/EN.
 * - Persiste en localStorage (manejado por I18nProvider)
 * - UI: pill con dos segmentos (modo normal) o botón circular con badge y tooltip (modo compacto)
 */
export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useT();

  const toggle = () => {
    setLocale(locale === "es" ? "en" : "es");
  };

  if (compact) {
    return (
      <div className="relative group inline-flex items-center justify-center">
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all text-xs font-bold shadow-xs"
          aria-label={t("language.switch")}
        >
          <span
            className={
              locale === "es"
                ? "text-orange-600 dark:text-orange-400 font-extrabold"
                : "text-sky-600 dark:text-sky-400 font-extrabold"
            }
          >
            {locale === "es" ? "ES" : "EN"}
          </span>
        </button>

        {/* Floating Tooltip Bubble (Exact Gemini Style) */}
        <div className="absolute left-full ml-3 px-3 py-1.5 bg-black text-white dark:bg-slate-900 dark:text-white border border-white/10 rounded-xl text-xs font-semibold whitespace-nowrap shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-150 ease-out z-50">
          {locale === "es" ? t("language.tooltipEs", "Idioma: Español (Click para EN)") : t("language.tooltipEn", "Language: English (Click for ES)")}
        </div>
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-900/60 p-0.5 text-xs shadow-xs"
      role="group"
      aria-label={t("language.switch")}
    >
      <button
        type="button"
        onClick={() => setLocale("es")}
        className={`px-3 py-1 rounded-full font-semibold transition-all ${
          locale === "es"
            ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-sm"
            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        }`}
        aria-pressed={locale === "es"}
        aria-label="Español"
      >
        🇪🇸 ES
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`px-3 py-1 rounded-full font-semibold transition-all ${
          locale === "en"
            ? "bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-sm"
            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        }`}
        aria-pressed={locale === "en"}
        aria-label="English"
      >
        🇺🇸 EN
      </button>
    </div>
  );
}
