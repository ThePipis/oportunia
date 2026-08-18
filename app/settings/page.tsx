"use client";

import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { LanguageToggle } from "@/components/layout/language-toggle";
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
    <main className="min-h-screen bg-gradient-radial">
      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-display text-gradient-brand">Settings</h1>
            <p className="text-sm text-slate-400 mt-2">
              Configuración de tu empresa, dirección de origen, y preferencias.
            </p>
          </div>
          <LanguageToggle />
        </div>

        <div className="flex items-center gap-3 text-sm">
          <a href="/" className="text-sky-400 hover:text-sky-300">← Inicio</a>
          <span className="text-slate-700">·</span>
          <a href="/radar" className="text-sky-400 hover:text-sky-300">Radar</a>
          <span className="text-slate-700">·</span>
          <a href="/services" className="text-sky-400 hover:text-sky-300">Servicios</a>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>🏢 Tu Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Nombre de la empresa</label>
              <input
                className="w-full bg-slate-900/60 border border-white/10 rounded-md px-3 py-2 text-sm text-slate-100"
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Email de contacto</label>
                <input
                  className="w-full bg-slate-900/60 border border-white/10 rounded-md px-3 py-2 text-sm text-slate-100"
                  value={settings.contact_email}
                  onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Teléfono</label>
                <input
                  className="w-full bg-slate-900/60 border border-white/10 rounded-md px-3 py-2 text-sm text-slate-100"
                  value={settings.contact_phone}
                  onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📍 Dirección de Origen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500">
              Desde dónde se calculan las distancias a prospectos.
            </p>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Dirección completa</label>
              <input
                className="w-full bg-slate-900/60 border border-white/10 rounded-md px-3 py-2 text-sm text-slate-100"
                value={settings.origin_address}
                onChange={(e) => setSettings({ ...settings, origin_address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Latitud</label>
                <input
                  type="number"
                  step="0.0001"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-md px-3 py-2 text-sm text-slate-100"
                  value={settings.origin_lat}
                  onChange={(e) => setSettings({ ...settings, origin_lat: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Longitud</label>
                <input
                  type="number"
                  step="0.0001"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-md px-3 py-2 text-sm text-slate-100"
                  value={settings.origin_lng}
                  onChange={(e) => setSettings({ ...settings, origin_lng: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">
              💡 Tip: usá Google Maps para obtener lat/lng de tu dirección exacta.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🤖 LLM por Defecto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500">
              Qué LLM usa OportunIA cuando generas talking points, propuestas, u otros textos largos.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(["local", "gemini", "auto"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSettings({ ...settings, default_llm_mode: mode })}
                  className={`p-3 rounded-md border text-left text-sm transition-all ${
                    settings.default_llm_mode === mode
                      ? "border-sky-400 bg-sky-500/10 text-sky-200"
                      : "border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/30"
                  }`}
                >
                  <div className="font-semibold capitalize">{mode === "auto" ? "Auto (recomendado)" : mode}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {mode === "local" && "🖥️ Qwen3.5 4B · Gratis · Rápido"}
                    {mode === "gemini" && "☁️ Gemini Pro · Mejor calidad"}
                    {mode === "auto" && "🤖 Decide según complejidad"}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 sticky bottom-4 bg-slate-950/80 backdrop-blur p-4 rounded-lg border border-white/10">
          <Button onClick={save} disabled={saving} size="lg">
            {saving ? "Guardando..." : "💾 Guardar cambios"}
          </Button>
          {saved && (
            <span className="text-sm text-emerald-300 font-semibold">✓ Guardado</span>
          )}
        </div>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="py-4 text-xs text-amber-200/80">
            💡 <strong>Tip:</strong> Estas settings se guardan localmente en SQLite.
            Próximamente (Tier 2) podrás sincronizarlas en la nube.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
