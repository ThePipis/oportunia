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
import { cn } from "@/lib/utils";

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

// Module-level in-memory cache for 0ms instant switching between sections
let cachedToolsData: Tool[] | null = null;
let cachedAccountsData: Record<string, Account[]> = {};

export default function ToolsPage() {
  const { t, locale } = useT();

  const getToolTypeName = (type: Tool["type"]): string => {
    const key = `tools.types.${type}`;
    const localized = t(key);
    if (localized && localized !== key) return localized;
    return type === "llm_endpoint" ? "LLM Endpoint" : type.replace("_", " ").toUpperCase();
  };

  const getToolDescription = (tool: Tool): string => {
    const key = `tools.descriptions.${tool.name}`;
    const localized = t(key);
    if (localized && localized !== key) return localized;
    return tool.description || "";
  };

  const STATUS_BADGES: Record<Tool["status"], { label: string; className: string }> = {
    unconfigured: { label: t("tools.statusUnconfigured", "Sin configurar"), className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30" },
    active: { label: `✓ ${t("tools.statusActive", "Activa")}`, className: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30" },
    error: { label: `✗ ${t("tools.statusError", "Error")}`, className: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30" },
    rate_limited: { label: `⚠ ${t("tools.statusRateLimited", "Rate limit")}`, className: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30" },
    disabled: { label: `○ ${t("tools.statusDisabled", "Desactivada")}`, className: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/30" },
  };

  const ACCOUNT_STATUS_BADGES: Record<Account["status"], { label: string; className: string }> = {
    active: { label: t("tools.statusActive", "Activa"), className: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30" },
    rate_limited: { label: t("tools.statusRateLimited", "Rate limit"), className: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30" },
    error: { label: t("tools.statusError", "Error"), className: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30" },
    disabled: { label: t("tools.statusDisabled", "Desactivada"), className: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/30" },
    paused: { label: t("tools.statusPaused", "Pausada"), className: "bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30" },
  };

  const relativeTime = (unixSeconds: number | null): string => {
    if (!unixSeconds) return t("common.never", "Nunca");
    const seconds = Math.floor(Date.now() / 1000) - unixSeconds;
    if (seconds < 60) return t("common.justNow", `hace ${seconds}s`);
    if (seconds < 3600) return t("common.minutesAgo", { count: Math.floor(seconds / 60) }, `hace ${Math.floor(seconds / 60)} min`);
    if (seconds < 86400) return t("common.hoursAgo", { count: Math.floor(seconds / 3600) }, `hace ${Math.floor(seconds / 3600)} h`);
    return t("common.daysAgo", { count: Math.floor(seconds / 86400) }, `hace ${Math.floor(seconds / 86400)} días`);
  };
  const [tools, setTools] = React.useState<Tool[]>(() => cachedToolsData ?? []);
  const [loading, setLoading] = React.useState(() => !cachedToolsData);
  const [error, setError] = React.useState<string | null>(null);
  const [editingTool, setEditingTool] = React.useState<Tool | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [healthChecking, setHealthChecking] = React.useState<string | null>(null);

  // Per-tool accounts (only for supports_multiple_keys=1)
  const [accountsByTool, setAccountsByTool] = React.useState<Record<string, Account[]>>(() => cachedAccountsData);
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
    if (!cachedToolsData) setLoading(true);
    try {
      const res = await fetch("/api/tools");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      cachedToolsData = data.tools ?? [];
      setTools(data.tools ?? []);
      setError(null);
    } catch (e: any) {
      if (!cachedToolsData) setError(e.message ?? "Error al cargar herramientas");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAccounts = React.useCallback(async (toolId: string) => {
    try {
      const res = await fetch(`/api/tools/${toolId}/keys`);
      if (!res.ok) return;
      const data = await res.json();
      const accounts = data.accounts ?? [];
      cachedAccountsData[toolId] = accounts;
      setAccountsByTool((prev) => ({ ...prev, [toolId]: accounts }));
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
    // Cycle: error → active (re-enable, e.g. after billing cycle resets);
    //        paused → active; active → paused.
    const next =
      account.status === "active"
        ? "paused"
        : "active"; // both 'paused' and 'error' become 'active'
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
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-900 dark:text-slate-100">
            {t("tools.title", "Tools & Conectores de Datos")}
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium max-w-2xl">
            {t("tools.subtitle", "Gestión de API keys, modelos de lenguaje (LLM) y servicios de prospección.")}
          </p>
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse h-48 bg-slate-100 dark:bg-slate-800/40" />
            ))}
          </div>
        ) : error ? (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="py-8 text-center">
            <p className="text-red-300 text-sm">⚠️ {error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                cachedToolsData = null;
                cachedAccountsData = {};
                fetchTools();
              }}
              className="mt-4"
            >
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((tool) => {
            const badge = STATUS_BADGES[tool.status];
            const hasKey = Boolean(tool.api_key_encrypted);
            const isMulti = tool.supports_multiple_keys === 1;
            const accounts = accountsByTool[tool.id] ?? [];
            const activeCount = accounts.filter((a) => a.status === "active").length;

            return (
              <Card key={tool.id} className="border-slate-200/80 dark:border-white/10 flex flex-col justify-between shadow-xs">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{tool.icon ?? "🔧"}</span>
                      <div>
                        <CardTitle className="text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          {tool.display_name ?? tool.name}
                          {isMulti && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-violet-100 text-violet-800 border border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30 font-medium">
                              {t("tools.multiAccount", "MULTI-CUENTA")}
                            </span>
                          )}
                        </CardTitle>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                          {getToolTypeName(tool.type)}
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
                    <CardDescription className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      {getToolDescription(tool)}
                    </CardDescription>
                  )}
                </CardHeader>

                  <CardContent className="space-y-4">
                    {/* SINGLE-KEY & LLM ENDPOINT TOOL UI */}
                    {!isMulti && (
                      <>
                        {tool.type === "llm_endpoint" ? (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-600 dark:text-slate-400">Endpoint URL:</span>
                              <span className="text-emerald-700 dark:text-emerald-300 font-mono font-medium">
                                {tool.endpoint || "http://100.119.37.120:11434"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-600 dark:text-slate-400">{t("tools.modelInVram", "Modelo en VRAM:")}</span>
                              <span className="text-sky-700 dark:text-sky-300 font-semibold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                {t("tools.autoDetected", "Auto-detectado dinámicamente")}
                              </span>
                            </div>
                          </>
                        ) : tool.type === "mcp_server" || tool.name === "agent-reach" ? (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-600 dark:text-slate-400">Modo:</span>
                              <span className="text-emerald-700 dark:text-emerald-300 font-mono font-medium">
                                {tool.endpoint || "CLI / MCP Local ($0 API Fees)"}
                              </span>
                            </div>
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Canales soportados:</span>
                              <div className="flex flex-wrap gap-1">
                                {["Twitter/X", "Reddit", "YouTube Transcripts", "Web Scraper", "Instagram", "GitHub"].map((ch) => (
                                  <span
                                    key={ch}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30"
                                  >
                                    {ch}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 dark:text-slate-400">{t("tools.apiKeyLabel", "API key:")}</span>
                            <span className={hasKey ? "text-emerald-700 dark:text-emerald-300 font-mono font-medium" : "text-slate-400"}>
                              {hasKey ? "••••••••" + (tool.api_key_encrypted?.slice(-4) ?? "") : t("tools.statusUnconfigured", "No configurada")}
                            </span>
                          </div>
                        )}
                        {tool.quota_limit && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-600 dark:text-slate-400">{t("tools.quota", "Quota")} ({tool.quota_period}):</span>
                              <span className="text-slate-700 dark:text-slate-300 font-mono font-medium">
                                {tool.quota_used.toLocaleString()} / {tool.quota_limit.toLocaleString()}
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 transition-all"
                                style={{ width: `${Math.min(100, (tool.quota_used / tool.quota_limit) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400">{t("tools.lastHealthCheck", "Última verificación:")}</span>
                          <span className="text-slate-500 dark:text-slate-400">{relativeTime(tool.last_health_check)}</span>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <Button size="sm" variant="secondary" onClick={() => openEditDialog(tool)}>
                            {tool.type === "llm_endpoint" || tool.type === "mcp_server"
                              ? t("tools.editEndpoint", "Configurar")
                              : hasKey
                              ? t("common.edit", "Editar")
                              : t("tools.configure", "Configurar")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => runHealthCheck(tool.id)}
                            disabled={
                              healthChecking === tool.id ||
                              (tool.type !== "llm_endpoint" && tool.type !== "mcp_server" && tool.name !== "agent-reach" && !hasKey)
                            }
                          >
                            {healthChecking === tool.id ? t("tools.testing", "Probando...") : t("tools.testSingle", "Probar")}
                          </Button>
                          {tool.docs_url && (
                            <a href={tool.docs_url} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-600 dark:text-sky-400 hover:underline ml-auto font-medium">
                              {t("tools.docs", "Docs ↗")}
                            </a>
                          )}
                        </div>
                      </>
                    )}

                    {/* MULTI-KEY TOOL UI */}
                    {isMulti && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400">
                            {t("tools.activeAccounts", { active: activeCount, total: accounts.length }, `Cuentas activas: ${activeCount} / ${accounts.length}`)}
                          </span>
                          {tool.quota_limit && (
                            <span className="text-slate-600 dark:text-slate-400 font-mono">
                              Total: {tool.quota_used.toLocaleString()} / {tool.quota_limit.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {accounts.length === 0 ? (
                          <div className="text-center py-6 text-sm text-slate-500 border border-dashed border-slate-300 dark:border-white/10 rounded-lg">
                            {t("tools.noAccounts", "No hay cuentas configuradas. Agregá al menos una API key para empezar.")}
                          </div>
                        ) : (
                          (() => {
                            const isExpanded = expandedAccounts[tool.id] ?? false;
                            const canCollapse = accounts.length > 1;
                            const visibleAccounts = isExpanded || !canCollapse
                              ? accounts
                              : accounts.slice(-1);
                            const hiddenCount = accounts.length - visibleAccounts.length;
                            return (
                              <div className="space-y-2">
                                {visibleAccounts.map((account) => {
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
                                      className={`p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/40 shadow-2xs ${
                                        isPaused ? "opacity-60" : ""
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          <span className="text-slate-400 font-mono text-xs w-6">#{idx + 1}</span>
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                              <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                                                {account.label ?? `Cuenta ${idx + 1}`}
                                              </span>
                                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${accBadge.className}`}>
                                                {accBadge.label}
                                              </span>
                                              {isLatest && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30 font-medium">
                                                  {t("tools.mostRecent", "Más reciente")}
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                              <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{account.api_key_masked}</span>
                                              <span>·</span>
                                              <span>{t("tools.usesCount", { count: account.quota_used.toLocaleString() }, `Usos: ${account.quota_used.toLocaleString()}`)}</span>
                                              {account.last_used && (
                                                <>
                                                  <span>·</span>
                                                  <span>{t("tools.lastUsed", { time: relativeTime(account.last_used) }, `Última: ${relativeTime(account.last_used)}`)}</span>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        {/* Move up/down only when expanded */}
                                        {isExpanded && (
                                          <div className="flex items-center gap-1">
                                            <button
                                              onClick={() => moveAccount(tool.id, account.id, "up")}
                                              disabled={idx === 0}
                                              className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 px-1"
                                              title="Mover arriba"
                                            >
                                              ▲
                                            </button>
                                            <button
                                              onClick={() => moveAccount(tool.id, account.id, "down")}
                                              disabled={idx === accounts.length - 1}
                                              className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 px-1"
                                              title="Mover abajo"
                                            >
                                              ▼
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                      {/* Quota bar */}
                                      {account.quota_limit && account.quota_limit > 0 && (
                                        <div className="mt-2 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full transition-all ${
                                              quotaPct > 80 ? "bg-red-500" : quotaPct > 50 ? "bg-amber-500" : "bg-emerald-500"
                                            }`}
                                            style={{ width: `${quotaPct}%` }}
                                          />
                                        </div>
                                      )}

                                      {/* Last error */}
                                      {account.last_error && (
                                        <p className="mt-2 text-[11px] text-red-600 dark:text-red-300 font-mono truncate" title={account.last_error}>
                                          ⚠ {account.last_error.slice(0, 120)}
                                        </p>
                                      )}

                                      {/* Per-account actions */}
                                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-200/80 dark:border-white/5">
                                        <Button size="sm" variant="ghost" onClick={() => testAccount(tool.id, account.id)} disabled={testingAccount === account.id}>
                                          {testingAccount === account.id ? t("tools.testing", "Probando...") : t("tools.testSingle", "Probar")}
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingAccount(account)}>
                                          {t("common.edit", "Editar")}
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => toggleAccountStatus(tool.id, account)}>
                                          {account.status === "active"
                                            ? `⏸ ${t("tools.pause", "Pausar")}`
                                            : account.status === "paused"
                                            ? `▶ ${t("tools.resume", "Reanudar")}`
                                            : `↻ ${t("tools.reEnable", "Re-habilitar")}`}
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => deleteAccount(tool.id, account.id)} className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 ml-auto">
                                          🗑
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}

                                {/* Expand / collapse chevron */}
                                {canCollapse && (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpanded(tool.id)}
                                    aria-expanded={isExpanded}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-1 text-xs text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 border border-dashed border-slate-300 dark:border-white/10 hover:border-sky-400 rounded-md bg-slate-50 dark:bg-slate-900/20 hover:bg-slate-100 dark:hover:bg-slate-900/40 transition-colors font-medium"
                                  >
                                    <span>
                                      {isExpanded
                                        ? t("tools.hideAccounts", "Ocultar cuentas")
                                        : t("tools.showMoreAccounts", { count: hiddenCount }, `Mostrar ${hiddenCount} cuenta(s) más`)}
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
                            {t("tools.addAccount", "➕ Agregar cuenta")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => runHealthCheck(tool.id)}
                            disabled={activeCount === 0 || healthChecking === tool.id}
                          >
                            {healthChecking === tool.id ? t("tools.testing", "Probando...") : t("tools.testAll", "Probar todas")}
                          </Button>
                          {tool.docs_url && (
                            <a href={tool.docs_url} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 hover:text-sky-300 ml-auto">
                              {t("tools.docs", "Docs ↗")}
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
                {editingTool?.display_name ?? t("tools.dialogs.configureTitle", "Configurar herramienta")}
              </DialogTitle>
              <DialogDescription>
                {editingTool?.type === "llm_endpoint"
                  ? t("tools.dialogs.configureEndpointDesc", "Configura la URL de tu servidor local de inferencia Llama.cpp.")
                  : editingTool?.type === "mcp_server"
                  ? t("tools.dialogs.configureMcpDesc", "Configura el entorno o endpoint de tu servidor MCP / CLI de Agent-Reach. Funciona por defecto a $0 costo de API.")
                  : t("tools.dialogs.configureApiKeyDesc", "Pega tu API key abajo. Se guarda localmente.")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {editingTool?.type === "llm_endpoint" && !editingTool?.supports_multiple_keys ? (
                <div className="space-y-2">
                  <Label htmlFor="endpoint">{t("tools.dialogs.endpointLabel", "Endpoint URL (Llama.cpp Server)")}</Label>
                  <Input
                    id="endpoint"
                    placeholder="http://100.119.37.120:11434"
                    value={endpointInput}
                    onChange={(e) => setEndpointInput(e.target.value)}
                  />
                  <p className="text-xs text-slate-500">
                    {t("tools.dialogs.endpointHint", "Auto-detecta en caliente cualquier modelo GGUF cargado en VRAM.")}
                  </p>
                </div>
              ) : editingTool?.type === "mcp_server" ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="mcp-endpoint">{t("tools.dialogs.mcpEndpointLabel", "Endpoint o Comando CLI (Agent-Reach)")}</Label>
                    <Input
                      id="mcp-endpoint"
                      placeholder="local"
                      value={endpointInput}
                      onChange={(e) => setEndpointInput(e.target.value)}
                    />
                    <p className="text-xs text-slate-500">
                      {t("tools.dialogs.mcpEndpointHint", "Ruta de ejecución local o servidor MCP. Por defecto 'local' para llamadas directas.")}
                    </p>
                  </div>

                  {/* 1-Click Presets */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      ⚡ Presets Rápidos de Configuración:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEndpointInput("local")}
                        className={cn(
                          "p-2 rounded-lg border text-left text-xs transition-all cursor-pointer",
                          endpointInput === "local" || !endpointInput
                            ? "bg-sky-50 dark:bg-sky-950/40 border-sky-400 text-sky-900 dark:text-sky-200 ring-1 ring-sky-400"
                            : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                        )}
                      >
                        <p className="font-bold flex items-center gap-1">
                          <span>🌐</span> Modo Local Directo ($0/mo)
                        </p>
                        <p className="text-[10.5px] text-slate-500 mt-0.5">
                          Extracción directa integrada (Recomendado).
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEndpointInput("http://100.119.37.120:9119")}
                        className={cn(
                          "p-2 rounded-lg border text-left text-xs transition-all cursor-pointer",
                          endpointInput === "http://100.119.37.120:9119"
                            ? "bg-purple-50 dark:bg-purple-950/40 border-purple-400 text-purple-900 dark:text-purple-200 ring-1 ring-purple-400"
                            : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                        )}
                      >
                        <p className="font-bold flex items-center gap-1">
                          <span>🖥️</span> Servidor srvubuntu01
                        </p>
                        <p className="text-[10.5px] text-slate-500 mt-0.5">
                          Hermes Gateway / MCP Server remoto.
                        </p>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-xs text-sky-800 dark:text-sky-300 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <span>⚡</span>
                      <span>Zero API Fees</span>
                    </p>
                    <p>
                      Agent-Reach extrae transcripciones de YouTube, busca en Reddit y audita redes sociales sin costo de APIs oficiales de pago.
                    </p>
                    {editingTool.docs_url && (
                      <a
                        href={editingTool.docs_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-1 font-semibold underline hover:text-sky-900 dark:hover:text-sky-100"
                      >
                        Ver Documentación Oficial en GitHub ↗
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="apiKey">{t("tools.dialogs.apiKeyLabel", "API Key")}</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk-... o tu-key-aqui"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                  />
                  <p className="text-xs text-slate-500">
                    {t("tools.dialogs.apiKeyHint", "Deja vacío para mantener la key actual.")}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={closeEditDialog}>
                {t("common.cancel", "Cancelar")}
              </Button>
              <Button onClick={saveTool} disabled={saving}>
                {saving ? t("common.saving", "Guardando...") : t("common.save", "Guardar")}
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
              <DialogTitle>{t("tools.dialogs.addAccountTitle", "Agregar cuenta")}</DialogTitle>
              <DialogDescription>
                {t("tools.dialogs.addAccountDesc", "Pegá tu nueva API key. Se usará cuando las anteriores se queden sin cuota.")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accLabel">{t("tools.dialogs.accountLabel", "Etiqueta (opcional)")}</Label>
                <Input
                  id="accLabel"
                  placeholder={t("tools.dialogs.accountLabelPlaceholder", "Personal, Trabajo #1, Cuenta A, etc.")}
                  value={newAccountLabel}
                  onChange={(e) => {
                    setNewAccountLabel(e.target.value);
                    setAddDialogError(null);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accKey">{t("tools.dialogs.apiKeyLabel", "API Key")}</Label>
                <Input
                  id="accKey"
                  type="password"
                  placeholder={t("tools.dialogs.accountKeyPlaceholder", "AIza... o tu-key-aqui")}
                  value={newAccountKey}
                  onChange={(e) => {
                    setNewAccountKey(e.target.value);
                    setAddDialogError(null);
                  }}
                />
                <p className="text-xs text-slate-500">
                  {t("tools.dialogs.getItAt", "Conseguila en")}{" "}
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
                {t("common.cancel", "Cancelar")}
              </Button>
              <Button onClick={() => addAccountOpen && addAccount(addAccountOpen)} disabled={addingAccount}>
                {addingAccount ? t("tools.dialogs.adding", "Agregando...") : t("tools.dialogs.add", "Agregar")}
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
  const { t } = useT();
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
          <DialogTitle>{t("tools.dialogs.editAccountTitle", "Editar cuenta")}</DialogTitle>
          <DialogDescription>
            {t("tools.dialogs.editAccountDesc", "Cambiá la etiqueta, reemplazá la key, o ajustá el límite de cuota individual.")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editAccLabel">{t("tools.dialogs.accountLabel", "Etiqueta")}</Label>
            <Input
              id="editAccLabel"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Mi cuenta #1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editAccKey">{t("tools.dialogs.editAccountKeyHint", "API Key (dejar vacío para mantener)")}</Label>
            <Input
              id="editAccKey"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIza..."
            />
            <p className="text-xs text-slate-500">
              {t("tools.dialogs.current", "Actual:")} <span className="font-mono">{account.api_key_masked}</span>
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="editAccQuota">{t("tools.dialogs.individualQuota", "Quota individual (opcional)")}</Label>
            <Input
              id="editAccQuota"
              type="number"
              value={quota}
              onChange={(e) => setQuota(e.target.value)}
              placeholder={t("tools.dialogs.noIndividualLimit", "Sin límite individual")}
            />
            <p className="text-xs text-slate-500">
              {t("tools.dialogs.individualQuotaHint", "Requests antes de que el router la marque como rate-limited.")}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {t("common.cancel", "Cancelar")}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t("common.saving", "Guardando...") : t("common.save", "Guardar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
