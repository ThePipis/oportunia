"use client";

import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Settings {
  company_name: string;
  contact_email: string;
  contact_phone: string;
  origin_address: string;
  origin_lat: number;
  origin_lng: number;
  default_llm_mode: "local" | "gemini" | "auto";
  default_theme: "light" | "dark";
  default_language: "es" | "en";
}

const DEFAULT_SETTINGS: Settings = {
  company_name: "OportunIA Agency",
  contact_email: "ventas@oportunia.agency",
  contact_phone: "(951) 555-0123",
  origin_address: "7940 Vandewater St, Eastvale, CA 92880",
  origin_lat: 33.9425,
  origin_lng: -117.5632,
  default_llm_mode: "auto",
  default_theme: "dark",
  default_language: "es",
};

export default function SettingsPage() {
  const { t } = useT();
  const [settings, setSettings] = React.useState<Settings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  // Load from API on mount
  React.useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...d.settings });
        }
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-900 dark:text-slate-100">
            {t("settings.title", "Configuración del Sistema")}
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
            {t("settings.subtitle", "Configuración de tu empresa, dirección de origen, proveedores de LLM y preferencias generales.")}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">{t("settings.companySection", "🏢 Tu Empresa")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              {t("settings.companyName", "Nombre de la empresa")}
            </label>
            <input
              className="w-full bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-white/10 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-2xs"
              value={settings.company_name}
              onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                {t("settings.contactEmail", "Email de contacto")}
              </label>
              <input
                className="w-full bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-white/10 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-2xs"
                value={settings.contact_email}
                onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                {t("settings.contactPhone", "Teléfono")}
              </label>
              <input
                className="w-full bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-white/10 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-2xs"
                value={settings.contact_phone}
                onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">{t("settings.originSection", "📍 Dirección de Origen")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            {t("settings.originSubtitle", "Desde dónde se calculan las distancias a prospectos.")}
          </p>
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              {t("settings.originAddress", "Dirección completa")}
            </label>
            <input
              className="w-full bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-white/10 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-2xs"
              value={settings.origin_address}
              onChange={(e) => setSettings({ ...settings, origin_address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                {t("settings.latitude", "Latitud")}
              </label>
              <input
                type="number"
                step="0.0001"
                className="w-full bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-white/10 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-2xs"
                value={settings.origin_lat}
                onChange={(e) => setSettings({ ...settings, origin_lat: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                {t("settings.longitude", "Longitud")}
              </label>
              <input
                type="number"
                step="0.0001"
                className="w-full bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-white/10 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-2xs"
                value={settings.origin_lng}
                onChange={(e) => setSettings({ ...settings, origin_lng: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("settings.originHint", "💡 Tip: usá Google Maps para obtener lat/lng de tu dirección exacta.")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">{t("settings.llmSection", "🤖 LLM por Defecto")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            {t("settings.llmSubtitle", "Qué LLM usa OportunIA cuando generas talking points, propuestas, u otros textos largos.")}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(["local", "gemini", "auto"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSettings({ ...settings, default_llm_mode: mode })}
                className={`p-3 rounded-md border text-left text-sm transition-all shadow-2xs ${
                  settings.default_llm_mode === mode
                    ? "border-sky-500 bg-sky-50 dark:bg-sky-500/10 text-sky-900 dark:text-sky-200 ring-1 ring-sky-500"
                    : "border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/30 hover:bg-slate-50"
                }`}
              >
                <div className="font-bold capitalize text-slate-900 dark:text-slate-100">
                  {mode === "auto" ? t("settings.llmAuto", "Auto (recomendado)") : mode}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  {mode === "local" && t("settings.llmLocalDesc", "🖥️ Qwen3.5 4B · Gratis · Rápido")}
                  {mode === "gemini" && t("settings.llmCloudDesc", "☁️ Gemini Pro · Mejor calidad")}
                  {mode === "auto" && t("settings.llmAutoDesc", "🤖 Decide según complejidad")}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 sticky bottom-4 bg-white/90 dark:bg-slate-950/80 backdrop-blur p-4 rounded-lg border border-slate-200 dark:border-white/10 shadow-lg">
        <Button onClick={save} disabled={saving} size="lg">
          {saving ? t("common.saving", "Guardando...") : t("settings.saveChanges", "💾 Guardar cambios")}
        </Button>
        {saved && (
          <span className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold">{t("settings.saved", "✓ Guardado")}</span>
        )}
      </div>

      <Card className="border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5">
        <CardContent className="py-4 text-xs text-amber-900 dark:text-amber-200/80 font-medium">
          {t("settings.sqliteNotice", "💡 Tip: Estas settings se guardan localmente en SQLite. Próximamente (Tier 2) podrás sincronizarlas en la nube.")}
        </CardContent>
      </Card>
    </div>
  );
}
