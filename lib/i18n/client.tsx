/**
 * OportunIA - i18n + Theme Provider
 *
 * Maneja dos concerns con el mismo patrón:
 * - Locale (es/en): afecta textos via t()
 * - Theme (light/dark): afecta clases CSS via document.documentElement
 *
 * Ambos persisten en localStorage y tienen default español / dark mode.
 *
 * Uso:
 *   const { t, locale, theme, setTheme } = useT();
 *   <h1>{t("nav.dashboard")}</h1>
 *   <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>...</button>
 */

"use client";

import * as React from "react";
import es from "./es.json";
import en from "./en.json";

export type Locale = "es" | "en";
export type Theme = "light" | "dark";
type Translations = typeof es;

const translations: Record<Locale, Translations> = {
  es,
  en,
};

const LOCALE_STORAGE_KEY = "oportunia-locale";
const THEME_STORAGE_KEY = "oportunia-theme";
const DEFAULT_LOCALE: Locale = "es";
const DEFAULT_THEME: Theme = "dark";

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  t: (key: string, fallback?: string) => string;
  available: Locale[];
};

const I18nContext = React.createContext<I18nContextValue | null>(null);

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
  const [theme, setThemeState] = React.useState<Theme>(DEFAULT_THEME);
  const [hydrated, setHydrated] = React.useState(false);

  // Cargar preferencias persistidas al montar
  React.useEffect(() => {
    try {
      const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (storedLocale === "es" || storedLocale === "en") {
        setLocaleState(storedLocale);
      }
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme === "light" || storedTheme === "dark") {
        setThemeState(storedTheme);
      }
    } catch {
      // localStorage puede no estar disponible
    }
    setHydrated(true);
  }, []);

  // Sincronizar atributos HTML
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    // Theme: usamos clase .dark en <html>
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  }, [locale, theme]);

  const setLocale = React.useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    } catch {}
  }, []);

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {}
  }, []);

  const toggleTheme = React.useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {}
      return next;
    });
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
      theme,
      setTheme,
      toggleTheme,
      t,
      available: ["es", "en"],
    }),
    [locale, setLocale, theme, setTheme, toggleTheme, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    throw new Error("useT() debe usarse dentro de <I18nProvider>");
  }
  return ctx;
}

export function useTranslations() {
  return useT().t;
}

export function useTheme() {
  const { theme, setTheme, toggleTheme } = useT();
  return { theme, setTheme, toggleTheme };
}
