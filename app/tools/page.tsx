"use client";

import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Tool {
  id: string;
  type: "api_key" | "mcp_server" | "oauth" | "llm_endpoint";
  name: string;
  display_name: string | null;
  description: string | null;
  api_key_encrypted: string | null;
  endpoint: string | null;
  status: "unconfigured" | "active" | "error" | "rate_limited" | "disabled";
  last_health_check: number | null;
  last_used: number | null;
  quota_used: number;
  quota_limit: number | null;
  quota_period: "day" | "month" | "request" | null;
  icon: string | null;
  docs_url: string | null;
}

const STATUS_BADGES: Record<Tool["status"], { label: string; className: string }> = {
  unconfigured: { label: "Sin configurar", className: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  active: { label: "✓ Activa", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  error: { label: "✗ Error", className: "bg-red-500/15 text-red-300 border-red-500/30" },
  rate_limited: { label: "⚠ Rate limit", className: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  disabled: { label: "○ Desactivada", className: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
};

function relativeTime(unixSeconds: number | null): string {
  if (!unixSeconds) return "Nunca";
  const seconds = Math.floor(Date.now() / 1000) - unixSeconds;
  if (seconds < 60) return `hace ${seconds}s`;
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
  return `hace ${Math.floor(seconds / 86400)} días`;
}

export default function ToolsPage() {
  const { t } = useT();
  const [tools, setTools] = React.useState<Tool[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editingTool, setEditingTool] = React.useState<Tool | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [healthChecking, setHealthChecking] = React.useState<string | null>(null);

  // Form state
  const [apiKeyInput, setApiKeyInput] = React.useState("");
  const [endpointInput, setEndpointInput] = React.useState("");

  const fetchTools = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tools");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTools(data.tools ?? []);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? "Error al cargar herramientas");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const openEditDialog = (tool: Tool) => {
    setEditingTool(tool);
    setApiKeyInput("");
    setEndpointInput(tool.endpoint ?? "");
  };

  const closeEditDialog = () => {
    setEditingTool(null);
    setApiKeyInput("");
    setEndpointInput("");
  };

  const saveTool = async () => {
    if (!editingTool) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (apiKeyInput) body.api_key = apiKeyInput;
      if (endpointInput !== editingTool.endpoint) body.endpoint = endpointInput;
      const res = await fetch(`/api/tools/${editingTool.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchTools();
      closeEditDialog();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const runHealthCheck = async (toolId: string) => {
    setHealthChecking(toolId);
    try {
      const res = await fetch(`/api/tools/${toolId}/health`, { method: "POST" });
      const data = await res.json();
      await fetchTools();
      if (!res.ok) {
        setError(`Health check failed: ${data.error ?? "Unknown"}`);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setHealthChecking(null);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-radial">
      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-display text-gradient-brand">
              {t("tools.title")}
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">
              {t("tools.subtitle")}
            </p>
          </div>
          <LanguageToggle />
        </div>

        {/* Back to home */}
        <div>
          <a
            href="/"
            className="text-sm text-sky-400 hover:text-sky-300 inline-flex items-center gap-1"
          >
            ← Volver al inicio
          </a>
        </div>

        {/* Error banner */}
        {error && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="py-3 px-4 text-sm text-red-300 flex items-center justify-between">
              <span>⚠️ {error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-200"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </CardContent>
          </Card>
        )}

        {/* Tools list */}
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-400">
              <div className="inline-block w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              <p className="mt-2">Cargando herramientas...</p>
            </CardContent>
          </Card>
        ) : tools.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-400">
              <p>No hay herramientas configuradas.</p>
              <Button onClick={() => fetchTools()} variant="secondary" className="mt-4">
                Refrescar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.map((tool) => {
              const badge = STATUS_BADGES[tool.status];
              const hasKey = !!tool.api_key_encrypted;
              const quotaPct =
                tool.quota_limit && tool.quota_limit > 0
                  ? Math.min(100, Math.round((tool.quota_used / tool.quota_limit) * 100))
                  : 0;
              return (
                <Card key={tool.id} className="card-glass-hover">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-2xl">
                          {tool.icon ?? "🔧"}
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {tool.display_name ?? tool.name}
                          </CardTitle>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {tool.type === "llm_endpoint" ? "LLM endpoint" : tool.type.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    {tool.description && (
                      <CardDescription className="text-xs leading-relaxed">
                        {tool.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* API key status */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">API key:</span>
                      <span className={hasKey ? "text-emerald-300 font-mono" : "text-slate-500"}>
                        {hasKey ? "••••••••" + (tool.api_key_encrypted?.slice(-4) ?? "") : "No configurada"}
                      </span>
                    </div>

                    {/* Quota */}
                    {tool.quota_limit && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Quota ({tool.quota_period}):</span>
                          <span className="text-slate-300 font-mono">
                            {tool.quota_used.toLocaleString()} / {tool.quota_limit.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              quotaPct > 80
                                ? "bg-red-400"
                                : quotaPct > 50
                                ? "bg-amber-400"
                                : "bg-emerald-400"
                            }`}
                            style={{ width: `${quotaPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Last health check */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Última verificación:</span>
                      <span className="text-slate-500">{relativeTime(tool.last_health_check)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openEditDialog(tool)}
                      >
                        {hasKey ? "Editar" : "Configurar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runHealthCheck(tool.id)}
                        disabled={!hasKey || healthChecking === tool.id}
                      >
                        {healthChecking === tool.id ? (
                          <>
                            <span className="inline-block w-3 h-3 border border-sky-400 border-t-transparent rounded-full animate-spin" />
                            Probando...
                          </>
                        ) : (
                          "Probar"
                        )}
                      </Button>
                      {tool.docs_url && (
                        <a
                          href={tool.docs_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-sky-400 hover:text-sky-300 ml-auto"
                        >
                          Docs ↗
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Edit dialog */}
        <Dialog open={!!editingTool} onOpenChange={(open) => !open && closeEditDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTool?.display_name ?? "Configurar herramienta"}
              </DialogTitle>
              <DialogDescription>
                Pega tu API key abajo. Se guarda localmente encriptada.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-... o tu-key-aqui"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Deja vacío para mantener la key actual.
                </p>
              </div>
              {editingTool?.type === "llm_endpoint" && (
                <div className="space-y-2">
                  <Label htmlFor="endpoint">Endpoint URL</Label>
                  <Input
                    id="endpoint"
                    placeholder="http://srvubuntu01:8080"
                    value={endpointInput}
                    onChange={(e) => setEndpointInput(e.target.value)}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={closeEditDialog}>
                Cancelar
              </Button>
              <Button onClick={saveTool} disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
