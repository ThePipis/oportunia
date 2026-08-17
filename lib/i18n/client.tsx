/**
 * OportunIA - i18n Provider
 *
 * Sistema de internacionalización bilingüe (ES/EN).
 * - Default: español
 * - Persistencia: localStorage
 * - Sin dependencias externas (custom pero completo)
 *
 * Uso:
 *   const t = useT();
 *   <h1>{t("nav.dashboard")}</h1>
 */

"use client";

import * as React from "react";
import es from "./es.json";
import en from "./en.json";

type Locale = "es" | "en";
type Translations = typeof es;

const translations: Record<Locale, Translations> = {
  es,
  en,
};

const STORAGE_KEY = "oportunia-locale";
const DEFAULT_LOCALE: Locale = "es";

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, fallback?: string) => string;
  available: Locale[];
};

const I18nContext = React.createContext<I18nContextValue | null>(null);

/**
 * Resuelve una clave anidada tipo "nav.dashboard" sobre el diccionario.
 * Retorna el fallback (o la misma clave) si no existe.
 */
function resolveKey(dict: Translations, key: string, fallback?: string): string {
  const parts = key.split(".");
  let current: any = dict;
  for (const part of parts) {
    if (current == null || typeof current !== "object") {
      return fallback ?? key;
    }
    current = current[part];
  }
  if (current == null || typeof current === "object") {
    return fallback ?? key;
  }
  return String(current);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>(DEFAULT_LOCALE);
  const [hydrated, setHydrated] = React.useState(false);

  // Cargar preferencia persistida al montar
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "es" || stored === "en") {
        setLocaleState(stored);
      }
    } catch {
      // localStorage puede no estar disponible (modo privado, etc.)
    }
    setHydrated(true);
  }, []);

  // Actualizar lang attribute del html
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = React.useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // ignore
    }
  }, []);

  const t = React.useCallback(
    (key: string, fallback?: string) => {
      return resolveKey(translations[locale], key, fallback);
    },
    [locale]
  );

  const value = React.useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      available: ["es", "en"],
    }),
    [locale, setLocale, t]
  );

  // Render normal post-hidratación
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Hook principal para acceder a las traducciones.
 * Lanza error si se usa fuera del I18nProvider.
 */
export function useT(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    throw new Error("useT() debe usarse dentro de <I18nProvider>");
  }
  return ctx;
}

/**
 * Hook de solo lectura para traducciones (más conciso).
 * const t = useTranslations();
 * t("nav.dashboard")
 */
export function useTranslations() {
  return useT().t;
}
