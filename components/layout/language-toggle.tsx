"use client";

import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";

/**
 * Toggle de idioma ES/EN.
 * - Persiste en localStorage (manejado por I18nProvider)
 * - UI: pill con dos segmentos
 */
export function LanguageToggle() {
  const { locale, setLocale, t } = useT();

  return (
    <div
      className="inline-flex items-center rounded-full border border-white/10 bg-slate-900/60 p-0.5 text-xs"
      role="group"
      aria-label={t("language.switch")}
    >
      <button
        type="button"
        onClick={() => setLocale("es")}
        className={`px-3 py-1 rounded-full font-semibold transition-all ${
          locale === "es"
            ? "bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-md"
            : "text-slate-400 hover:text-white"
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
            ? "bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-md"
            : "text-slate-400 hover:text-white"
        }`}
        aria-pressed={locale === "en"}
        aria-label="English"
      >
        🇺🇸 EN
      </button>
    </div>
  );
}
