"use client";

import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  supports_multiple_keys: number;
  icon: string | null;
  docs_url: string | null;
}

interface Account {
  id: string;
  tool_id: string;
  label: string | null;
  api_key_masked: string;
  sort_order: number;
  status: "active" | "rate_limited" | "error" | "disabled" | "paused";
  last_used: number | null;
  last_error: string | null;
  last_error_at: number | null;
  quota_used: number;
  quota_limit: number | null;
  cooldown_until: number | null;
  created_at: number;
  updated_at: number;
}

const STATUS_BADGES: Record<Tool["status"], { label: string; className: string }> = {
  unconfigured: { label: "Sin configurar", className: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  active: { label: "✓ Activa", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  error: { label: "✗ Error", className: "bg-red-500/15 text-red-300 border-red-500/30" },
  rate_limited: { label: "⚠ Rate limit", className: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  disabled: { label: "○ Desactivada", className: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
};

const ACCOUNT_STATUS_BADGES: Record<Account["status"], { label: string; className: string }> = {
  active: { label: "Activa", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  rate_limited: { label: "Rate limit", className: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  error: { label: "Error", className: "bg-red-500/15 text-red-300 border-red-500/30" },
  disabled: { label: "Desactivada", className: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
  paused: { label: "Pausada", className: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
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

  // Per-tool accounts (only for supports_multiple_keys=1)
  const [accountsByTool, setAccountsByTool] = React.useState<Record<string, Account[]>>({});
  const [addAccountOpen, setAddAccountOpen] = React.useState<string | null>(null); // tool id
  const [newAccountLabel, setNewAccountLabel] = React.useState("");
  const [newAccountKey, setNewAccountKey] = React.useState("");
  const [addingAccount, setAddingAccount] = React.useState(false);
  const [addDialogError, setAddDialogError] = React.useState<string | null>(null);
  /** Per-tool card expansion state. Default: collapsed (show only last account). */
  const [expandedAccounts, setExpandedAccounts] = React.useState<Record<string, boolean>>({});
  const toggleExpanded = (toolId: string) =>
    setExpandedAccounts((prev) => ({ ...prev, [toolId]: !prev[toolId] }));
  const [testingAccount, setTestingAccount] = React.useState<string | null>(null);
  const [editingAccount, setEditingAccount] = React.useState<Account | null>(null);

  // Single-key form state
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

  const fetchAccounts = React.useCallback(async (toolId: string) => {
    try {
      const res = await fetch(`/api/tools/${toolId}/keys`);
      if (!res.ok) return;
      const data = await res.json();
      setAccountsByTool((prev) => ({ ...prev, [toolId]: data.accounts ?? [] }));
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  // Fetch accounts for any multi-key tools
  React.useEffect(() => {
    tools
      .filter((t) => t.supports_multiple_keys === 1)
      .forEach((t) => {
        if (!accountsByTool[t.id]) fetchAccounts(t.id);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tools]);

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

  // ---- Multi-account actions ----
  const addAccount = async (toolId: string) => {
    if (!newAccountKey || newAccountKey.trim().length < 8) {
      setAddDialogError("La API key debe tener al menos 8 caracteres");
      return;
    }
    setAddingAccount(true);
    setAddDialogError(null);
    try {
      const res = await fetch(`/api/tools/${toolId}/keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newAccountLabel.trim() || undefined,
          api_key: newAccountKey.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setNewAccountKey("");
      setNewAccountLabel("");
      setAddDialogError(null);
      setAddAccountOpen(null);
      await fetchAccounts(toolId);
      await fetchTools(); // refresh status
    } catch (e: any) {
      // Show error INSIDE the dialog so the user sees it without scrolling
      setAddDialogError(e.message ?? "Error desconocido al guardar la cuenta");
    } finally {
      setAddingAccount(false);
    }
  };

  const deleteAccount = async (toolId: string, accountId: string) => {
    if (!confirm("¿Eliminar esta cuenta? Las llamadas futuras no la usarán.")) return;
    try {
      const res = await fetch(`/api/tools/${toolId}/keys/${accountId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchAccounts(toolId);
      await fetchTools();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const testAccount = async (toolId: string, accountId: string) => {
    setTestingAccount(accountId);
    try {
      await fetch(`/api/tools/${toolId}/keys/${accountId}/health`, { method: "POST" });
      await fetchAccounts(toolId);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTestingAccount(null);
    }
  };

  const toggleAccountStatus = async (toolId: string, account: Account) => {
    const next = account.status === "paused" ? "active" : "paused";
    try {
      await fetch(`/api/tools/${toolId}/keys/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      await fetchAccounts(toolId);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const moveAccount = async (toolId: string, accountId: string, direction: "up" | "down") => {
    const list = accountsByTool[toolId] ?? [];
    const idx = list.findIndex((a) => a.id === accountId);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= list.length) return;
    const newOrder = [...list];
    [newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]];
    try {
      await fetch(`/api/tools/${toolId}/keys`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newOrder.map((a) => a.id) }),
      });
      await fetchAccounts(toolId);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const updateAccount = async (toolId: string, accountId: string, patch: any) => {
    try {
      const res = await fetch(`/api/tools/${toolId}/keys/${accountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      await fetchAccounts(toolId);
      setEditingAccount(null);
    } catch (e: any) {
      setError(e.message);
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
        </div>

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
          <div className="grid grid-cols-1 gap-4">
            {tools.map((tool) => {
              const badge = STATUS_BADGES[tool.status];
              const hasKey = !!tool.api_key_encrypted;
              const isMulti = tool.supports_multiple_keys === 1;
              const accounts = accountsByTool[tool.id] ?? [];
              const activeCount = accounts.filter((a) => a.status === "active").length;

              return (
                <Card key={tool.id} className="card-glass-hover">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-2xl">
                          {tool.icon ?? "🔧"}
                        </div>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {tool.display_name ?? tool.name}
                            {isMulti && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-violet-500/15 text-violet-300 border border-violet-500/30">
                                multi-cuenta
                              </span>
                            )}
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

                  <CardContent className="space-y-4">
                    {/* SINGLE-KEY TOOL UI */}
                    {!isMulti && (
                      <>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">API key:</span>
                          <span className={hasKey ? "text-emerald-300 font-mono" : "text-slate-500"}>
                            {hasKey ? "••••••••" + (tool.api_key_encrypted?.slice(-4) ?? "") : "No configurada"}
                          </span>
                        </div>
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
                                className="h-full bg-emerald-400 transition-all"
                                style={{ width: `${Math.min(100, (tool.quota_used / tool.quota_limit) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Última verificación:</span>
                          <span className="text-slate-500">{relativeTime(tool.last_health_check)}</span>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <Button size="sm" variant="secondary" onClick={() => openEditDialog(tool)}>
                            {hasKey ? "Editar" : "Configurar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => runHealthCheck(tool.id)}
                            disabled={!hasKey || healthChecking === tool.id}
                          >
                            {healthChecking === tool.id ? "Probando..." : "Probar"}
                          </Button>
                          {tool.docs_url && (
                            <a href={tool.docs_url} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 hover:text-sky-300 ml-auto">
                              Docs ↗
                            </a>
                          )}
                        </div>
                      </>
                    )}

                    {/* MULTI-KEY TOOL UI */}
                    {isMulti && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">
                            Cuentas activas: <span className="text-emerald-300 font-semibold">{activeCount}</span> / {accounts.length}
                          </span>
                          {tool.quota_limit && (
                            <span className="text-slate-500 font-mono">
                              Total: {tool.quota_used.toLocaleString()} / {tool.quota_limit.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {accounts.length === 0 ? (
                          <div className="text-center py-6 text-sm text-slate-500 border border-dashed border-white/10 rounded-lg">
                            No hay cuentas configuradas. Agregá al menos una API key para empezar.
                          </div>
                        ) : (
                          (() => {
                            // Collapse by default: show only the most recently added account.
                            // The last account (highest sort_order) is the newest, so it's the
                            // one the smart router will likely use first (most quota remaining).
                            const isExpanded = expandedAccounts[tool.id] ?? false;
                            const canCollapse = accounts.length > 1;
                            const visibleAccounts = isExpanded || !canCollapse
                              ? accounts
                              : accounts.slice(-1);
                            const hiddenCount = accounts.length - visibleAccounts.length;
                            return (
                              <div className="space-y-2">
                                {visibleAccounts.map((account) => {
                                  // idx is the real position in the full list (for move buttons)
                                  const idx = accounts.findIndex((a) => a.id === account.id);
                                  const accBadge = ACCOUNT_STATUS_BADGES[account.status];
                                  const quotaPct =
                                    account.quota_limit && account.quota_limit > 0
                                      ? Math.min(100, Math.round((account.quota_used / account.quota_limit) * 100))
                                      : 0;
                                  const isPaused = account.status === "paused";
                                  const isLatest = !isExpanded && canCollapse && idx === accounts.length - 1;
                                  return (
                                    <div
                                      key={account.id}
                                      className={`p-3 rounded-lg border border-white/10 bg-slate-900/40 ${
                                        isPaused ? "opacity-60" : ""
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          <span className="text-slate-500 font-mono text-xs w-6">#{idx + 1}</span>
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                              <span className="font-semibold text-sm text-slate-100 truncate">
                                                {account.label ?? `Cuenta ${idx + 1}`}
                                              </span>
                                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${accBadge.className}`}>
                                                {accBadge.label}
                                              </span>
                                              {isLatest && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30">
                                                  Más reciente
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                                              <span className="font-mono">{account.api_key_masked}</span>
                                              <span>·</span>
                                              <span>Usos: {account.quota_used.toLocaleString()}</span>
                                              {account.last_used && (
                                                <>
                                                  <span>·</span>
                                                  <span>Última: {relativeTime(account.last_used)}</span>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        {/* Move up/down only when expanded (can't reorder from collapsed view) */}
                                        {isExpanded && (
                                          <div className="flex items-center gap-1">
                                            <button
                                              onClick={() => moveAccount(tool.id, account.id, "up")}
                                              disabled={idx === 0}
                                              className="text-slate-500 hover:text-slate-200 disabled:opacity-30 px-1"
                                              title="Mover arriba"
                                            >
                                              ▲
                                            </button>
                                            <button
                                              onClick={() => moveAccount(tool.id, account.id, "down")}
                                              disabled={idx === accounts.length - 1}
                                              className="text-slate-500 hover:text-slate-200 disabled:opacity-30 px-1"
                                              title="Mover abajo"
                                            >
                                              ▼
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                      {/* Quota bar */}
                                      {account.quota_limit && account.quota_limit > 0 && (
                                        <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full transition-all ${
                                              quotaPct > 80 ? "bg-red-400" : quotaPct > 50 ? "bg-amber-400" : "bg-emerald-400"
                                            }`}
                                            style={{ width: `${quotaPct}%` }}
                                          />
                                        </div>
                                      )}

                                      {/* Last error */}
                                      {account.last_error && (
                                        <p className="mt-2 text-[11px] text-red-300 font-mono truncate" title={account.last_error}>
                                          ⚠ {account.last_error.slice(0, 120)}
                                        </p>
                                      )}

                                      {/* Per-account actions */}
                                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/5">
                                        <Button size="sm" variant="ghost" onClick={() => testAccount(tool.id, account.id)} disabled={testingAccount === account.id}>
                                          {testingAccount === account.id ? "Probando..." : "Probar"}
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingAccount(account)}>
                                          Editar
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => toggleAccountStatus(tool.id, account)}>
                                          {isPaused ? "▶ Reanudar" : "⏸ Pausar"}
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => deleteAccount(tool.id, account.id)} className="text-red-400 hover:text-red-200 ml-auto">
                                          🗑
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}

                                {/* Expand / collapse chevron (only when 2+ accounts) */}
                                {canCollapse && (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpanded(tool.id)}
                                    aria-expanded={isExpanded}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-1 text-xs text-slate-400 hover:text-slate-100 border border-dashed border-white/10 hover:border-sky-400/40 rounded-md bg-slate-900/20 hover:bg-slate-900/40 transition-colors"
                                  >
                                    <span>
                                      {isExpanded
                                        ? "Ocultar cuentas"
                                        : `Mostrar ${hiddenCount} cuenta${hiddenCount === 1 ? "" : "s"} más`}
                                    </span>
                                    <ChevronDown
                                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                        isExpanded ? "rotate-180" : ""
                                      }`}
                                    />
                                  </button>
                                )}
                              </div>
                            );
                          })()
                        )}

                        <div className="flex items-center gap-2 pt-2">
                          <Button size="sm" variant="secondary" onClick={() => setAddAccountOpen(tool.id)}>
                            ➕ Agregar cuenta
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => runHealthCheck(tool.id)}
                            disabled={activeCount === 0 || healthChecking === tool.id}
                          >
                            {healthChecking === tool.id ? "Probando..." : "Probar todas"}
                          </Button>
                          {tool.docs_url && (
                            <a href={tool.docs_url} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 hover:text-sky-300 ml-auto">
                              Docs ↗
                            </a>
                          )}
                        </div>

                        {tool.endpoint && (
                          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                            <span className="text-slate-400">Endpoint:</span>
                            <span className="text-slate-300 font-mono">{tool.endpoint}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Single-key edit dialog */}
        <Dialog open={!!editingTool} onOpenChange={(open) => !open && closeEditDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTool?.display_name ?? "Configurar herramienta"}
              </DialogTitle>
              <DialogDescription>
                Pega tu API key abajo. Se guarda localmente.
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
              {editingTool?.type === "llm_endpoint" && !editingTool?.supports_multiple_keys && (
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

        {/* Add account dialog */}
        <Dialog
          open={!!addAccountOpen}
          onOpenChange={(open) => {
            if (!open) {
              setAddAccountOpen(null);
              setNewAccountKey("");
              setNewAccountLabel("");
              setAddDialogError(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar cuenta</DialogTitle>
              <DialogDescription>
                Pegá tu nueva API key. Se usará cuando las anteriores se queden sin cuota.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accLabel">Etiqueta (opcional)</Label>
                <Input
                  id="accLabel"
                  placeholder="Personal, Trabajo #1, Cuenta A, etc."
                  value={newAccountLabel}
                  onChange={(e) => {
                    setNewAccountLabel(e.target.value);
                    setAddDialogError(null);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accKey">API Key</Label>
                <Input
                  id="accKey"
                  type="password"
                  placeholder="AIza... o tu-key-aqui"
                  value={newAccountKey}
                  onChange={(e) => {
                    setNewAccountKey(e.target.value);
                    setAddDialogError(null);
                  }}
                />
                <p className="text-xs text-slate-500">
                  Conseguila en{" "}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:text-sky-300"
                  >
                    aistudio.google.com/apikey
                  </a>
                </p>
              </div>
              {addDialogError && (
                <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
                  ⚠ {addDialogError}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setAddAccountOpen(null)}>
                Cancelar
              </Button>
              <Button onClick={() => addAccountOpen && addAccount(addAccountOpen)} disabled={addingAccount}>
                {addingAccount ? "Agregando..." : "Agregar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit account dialog */}
        {editingAccount && (
          <EditAccountDialog
            account={editingAccount}
            onSave={(patch) => updateAccount(editingAccount.tool_id, editingAccount.id, patch)}
            onClose={() => setEditingAccount(null)}
          />
        )}
      </div>
    </main>
  );
}

function EditAccountDialog({
  account,
  onSave,
  onClose,
}: {
  account: Account;
  onSave: (patch: { label?: string; api_key?: string; quota_limit?: number | null }) => Promise<void>;
  onClose: () => void;
}) {
  const [label, setLabel] = React.useState(account.label ?? "");
  const [key, setKey] = React.useState("");
  const [quota, setQuota] = React.useState<string>(account.quota_limit?.toString() ?? "");
  const [saving, setSaving] = React.useState(false);

  const handleSave = async () => {
    setSaving(true);
    const patch: any = {};
    if (label.trim() !== (account.label ?? "")) patch.label = label.trim() || null;
    if (key.trim()) patch.api_key = key.trim();
    if (quota === "" && account.quota_limit !== null) patch.quota_limit = null;
    else if (quota !== "" && parseInt(quota) !== account.quota_limit) patch.quota_limit = parseInt(quota) || null;
    if (Object.keys(patch).length === 0) {
      onClose();
      return;
    }
    try {
      await onSave(patch);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar cuenta</DialogTitle>
          <DialogDescription>
            Cambiá la etiqueta, reemplazá la key, o ajustá el límite de cuota individual.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editAccLabel">Etiqueta</Label>
            <Input
              id="editAccLabel"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Mi cuenta #1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editAccKey">API Key (dejar vacío para mantener)</Label>
            <Input
              id="editAccKey"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIza..."
            />
            <p className="text-xs text-slate-500">
              Actual: <span className="font-mono">{account.api_key_masked}</span>
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="editAccQuota">Quota individual (opcional)</Label>
            <Input
              id="editAccQuota"
              type="number"
              value={quota}
              onChange={(e) => setQuota(e.target.value)}
              placeholder="Sin límite individual"
            />
            <p className="text-xs text-slate-500">
              Requests antes de que el router la marque como rate-limited.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
