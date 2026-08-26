"use client";

import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Package,
  Sparkles,
  Zap,
  Crown,
  Search,
  CheckCircle2,
  XCircle,
  GripVertical,
  ArrowLeft,
  ArrowRight,
  Edit3,
  DollarSign,
  Layers,
  Flame,
  Info,
} from "lucide-react";

interface Service {
  id: string;
  tier: 1 | 2 | 3;
  name: string;
  name_en: string | null;
  icon: string | null;
  description: string;
  description_en: string | null;
  example: string | null;
  example_en: string | null;
  pain_solved: string | null;
  pain_solved_en: string | null;
  price_setup: number;
  price_monthly: number;
  pitch_template: string;
  pitch_template_en: string | null;
  category: string | null;
  active: number;
  sort_order?: number;
}

// Module-level in-memory cache for 0ms instant switching between sections
let cachedServicesData: Service[] | null = null;

const DRAG_MIME = "application/x-oportunia-service-id";

export default function ServicesPage() {
  const { t, locale } = useT();
  const [services, setServices] = React.useState<Service[]>(() => cachedServicesData ?? []);
  const [loading, setLoading] = React.useState(() => !cachedServicesData);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [filterMode, setFilterMode] = React.useState<"all" | "active" | "disabled">("all");

  // Drag & Drop state
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [hoverTier, setHoverTier] = React.useState<number | null>(null);

  // Edit Modal State
  const [editingService, setEditingService] = React.useState<Service | null>(null);
  const [editForm, setEditForm] = React.useState<Partial<Service>>({});
  const [savingEdit, setSavingEdit] = React.useState<boolean>(false);
  const [togglingTier, setTogglingTier] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    if (!cachedServicesData) setLoading(true);
    try {
      const res = await fetch("/api/services");
      const data = await res.json();
      cachedServicesData = data.services ?? [];
      setServices(data.services ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // 1. Move service between Tiers (Drag & Drop or Directional Click)
  const moveServiceToTier = async (serviceId: string, targetTier: 1 | 2 | 3) => {
    const currentSvc = services.find((s) => s.id === serviceId);
    if (!currentSvc || currentSvc.tier === targetTier) return;

    // 0ms Optimistic local update
    const updated = services.map((s) => (s.id === serviceId ? { ...s, tier: targetTier } : s));
    cachedServicesData = updated;
    setServices(updated);

    try {
      await fetch("/api/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: serviceId, patch: { tier: targetTier } }),
      });
    } catch {
      await load();
    }
  };

  // 2. Toggle active state for a single service
  const toggleActive = async (svc: Service) => {
    const nextActive = svc.active ? 0 : 1;
    const updated = services.map((s) => (s.id === svc.id ? { ...s, active: nextActive } : s));
    cachedServicesData = updated;
    setServices(updated);

    try {
      await fetch("/api/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: svc.id, patch: { active: nextActive === 1 } }),
      });
    } catch {
      await load();
    }
  };

  // 3. Batch toggle active state for all services in a Tier
  const toggleTierActive = async (tier: 1 | 2 | 3, activateAll: boolean) => {
    setTogglingTier(tier);
    const nextActive = activateAll ? 1 : 0;
    const updated = services.map((s) => (s.tier === tier ? { ...s, active: nextActive } : s));
    cachedServicesData = updated;
    setServices(updated);

    try {
      await fetch("/api/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, active: activateAll }),
      });
    } catch {
      await load();
    } finally {
      setTogglingTier(null);
    }
  };

  // 4. Open Edit Modal
  const openEditModal = (svc: Service) => {
    setEditingService(svc);
    setEditForm({
      name: svc.name,
      name_en: svc.name_en ?? svc.name,
      tier: svc.tier,
      description: svc.description,
      description_en: svc.description_en ?? svc.description,
      pain_solved: svc.pain_solved ?? "",
      pain_solved_en: svc.pain_solved_en ?? svc.pain_solved ?? "",
      price_setup: svc.price_setup,
      price_monthly: svc.price_monthly,
      pitch_template: svc.pitch_template,
      pitch_template_en: svc.pitch_template_en ?? svc.pitch_template,
    });
  };

  const closeEditModal = () => {
    setEditingService(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingService) return;
    setSavingEdit(true);
    try {
      await fetch("/api/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingService.id, patch: editForm }),
      });
      await load();
      closeEditModal();
    } catch (e) {
      console.error("Save edit failed", e);
    } finally {
      setSavingEdit(false);
    }
  };

  // Filtered Services List
  const filteredServices = React.useMemo(() => {
    return services.filter((svc) => {
      const name = (locale === "en" && svc.name_en ? svc.name_en : svc.name).toLowerCase();
      const desc = (locale === "en" && svc.description_en ? svc.description_en : svc.description).toLowerCase();
      const pain = (locale === "en" && svc.pain_solved_en ? svc.pain_solved_en : svc.pain_solved ?? "").toLowerCase();
      const query = searchQuery.trim().toLowerCase();

      const matchesSearch = !query || name.includes(query) || desc.includes(query) || pain.includes(query);
      const isActive = svc.active === 1 || (svc.active as any) === true;

      if (filterMode === "active") return matchesSearch && isActive;
      if (filterMode === "disabled") return matchesSearch && !isActive;
      return matchesSearch;
    });
  }, [services, searchQuery, filterMode, locale]);

  // Grouped by Tier
  const grouped = React.useMemo(() => {
    const map: Record<1 | 2 | 3, Service[]> = { 1: [], 2: [], 3: [] };
    for (const svc of filteredServices) {
      if (map[svc.tier]) {
        map[svc.tier].push(svc);
      }
    }
    return map;
  }, [filteredServices]);

  // Summary Metrics
  const activeServices = services.filter((s) => s.active === 1 || (s.active as any) === true);
  const totalSetup = activeServices.reduce((acc, s) => acc + (s.price_setup || 0), 0);
  const totalMonthly = activeServices.reduce((acc, s) => acc + (s.price_monthly || 0), 0);

  const TIER_COLUMNS = [
    {
      tier: 1 as const,
      icon: "🚀",
      titleKey: "services.tier1",
      defaultTitle: "Tier 1 · Quick Wins",
      descKey: "services.tier1Desc",
      defaultDesc: "Bajo costo de entrega, adopción inmediata (0-30 días).",
      headerColor: "from-amber-500/15 via-orange-500/10 to-transparent",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30",
      accentBorder: "hover:border-amber-400/50",
      dropBorder: "border-amber-500/60 bg-amber-500/5",
    },
    {
      tier: 2 as const,
      icon: "⚡",
      titleKey: "services.tier2",
      defaultTitle: "Tier 2 · Core Services",
      descKey: "services.tier2Desc",
      defaultDesc: "Retainers mensuales recurrentes y automatizaciones clave.",
      headerColor: "from-sky-500/15 via-cyan-500/10 to-transparent",
      badgeColor: "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30",
      accentBorder: "hover:border-sky-400/50",
      dropBorder: "border-sky-500/60 bg-sky-500/5",
    },
    {
      tier: 3 as const,
      icon: "👑",
      titleKey: "services.tier3",
      defaultTitle: "Tier 3 · High-Ticket & Retainers",
      descKey: "services.tier3Desc",
      defaultDesc: "Sistemas completos de captación, IA avanzada y ads.",
      headerColor: "from-violet-500/15 via-purple-500/10 to-transparent",
      badgeColor: "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30",
      accentBorder: "hover:border-violet-400/50",
      dropBorder: "border-violet-500/60 bg-violet-500/5",
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-24">
      {/* 1. Header & KPI Metrics */}
      <div className="space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold font-display text-slate-900 dark:text-white flex items-center gap-2.5">
              <Package className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              <span>{t("services.title", "Catálogo de Servicios & Precios")}</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
              {t("services.subtitle", "Configura los paquetes de servicios de IA, desarrollo web y automatizaciones para tus propuestas comerciales.")}
            </p>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t("services.kpiTotalServices", "Servicios en Catálogo")}
              </span>
              <span className="text-lg sm:text-xl font-extrabold font-mono text-slate-900 dark:text-white">
                {services.length}
              </span>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/70 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t("services.kpiActiveServices", "Activos en Propuestas")}
              </span>
              <span className="text-lg sm:text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                {activeServices.length} <span className="text-xs font-normal text-slate-400">/ {services.length}</span>
              </span>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100/70 dark:bg-sky-500/20 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t("services.kpiSetupPotential", "Setup Potencial")}
              </span>
              <span className="text-lg sm:text-xl font-extrabold font-mono text-slate-900 dark:text-white">
                ${totalSetup.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/70 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t("services.kpiMonthlyPotential", "MRR Potencial")}
              </span>
              <span className="text-lg sm:text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                ${totalMonthly.toLocaleString()}<span className="text-xs font-normal text-slate-400">/mo</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 backdrop-blur-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder={t("services.searchPlaceholder", "Buscar por servicio, dolor o pitch...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white dark:bg-slate-950/80 border-slate-200 dark:border-white/10 text-xs sm:text-sm h-9 rounded-xl"
          />
        </div>

        {/* Filter Mode Pills */}
        <div className="flex items-center gap-1 bg-white/90 dark:bg-slate-950/90 p-1 rounded-xl border border-slate-200 dark:border-white/10 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              filterMode === "all"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {t("services.filterAll", "Todos")} ({services.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("active")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              filterMode === "active"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
            }`}
          >
            {t("services.filterActiveOnly", "Solo Activos")} ({activeServices.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("disabled")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              filterMode === "disabled"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
            }`}
          >
            {t("services.filterDisabledOnly", "Solo Deshabilitados")} ({services.length - activeServices.length})
          </button>
        </div>
      </div>

      {/* 3. Drag & Drop Helper Hint */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 px-1">
        <Info className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>{t("services.dragDropHint", "Arrastra y suelta las tarjetas entre Tiers para reestructurar tu catálogo en vivo.")}</span>
      </div>

      {/* 4. Kanban 3-Column Board */}
      {loading ? (
        <Card className="card-glass">
          <CardContent className="py-16 text-center text-slate-400 font-medium">
            {t("services.loading", "Cargando servicios...")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {TIER_COLUMNS.map((col) => {
            const items = grouped[col.tier] || [];
            const tierActiveCount = items.filter((s) => s.active === 1 || (s.active as any) === true).length;
            const allActive = items.length > 0 && tierActiveCount === items.length;
            const isToggling = togglingTier === col.tier;
            const isHovered = hoverTier === col.tier;

            return (
              <div
                key={col.tier}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (hoverTier !== col.tier) setHoverTier(col.tier);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setHoverTier(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const serviceId = e.dataTransfer.getData(DRAG_MIME) || e.dataTransfer.getData("text/plain");
                  if (serviceId) {
                    moveServiceToTier(serviceId, col.tier);
                  }
                  setHoverTier(null);
                }}
                className={`flex flex-col rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border-2 transition-all duration-200 min-h-[580px] ${
                  isHovered
                    ? `${col.dropBorder} shadow-lg scale-[1.005]`
                    : "border-slate-200/80 dark:border-white/10"
                }`}
              >
                {/* Column Header */}
                <div className={`p-4 rounded-t-2xl bg-gradient-to-b ${col.headerColor} border-b border-slate-200/80 dark:border-white/10 space-y-2.5`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl">{col.icon}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-display uppercase tracking-wider border ${col.badgeColor}`}>
                        {t(col.titleKey, col.defaultTitle)}
                      </span>
                    </div>

                    {/* Batch Toggle for Column */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={isToggling || items.length === 0}
                        onClick={() => toggleTierActive(col.tier, !allActive)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          allActive ? "bg-emerald-500" : tierActiveCount > 0 ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                        title={allActive ? t("services.tierDeactivateAll", "Desactivar Tier") : t("services.tierActivateAll", "Activar todo el Tier")}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            allActive ? "translate-x-4" : tierActiveCount > 0 ? "translate-x-2" : "translate-x-0"
                          }`}
                        />
                      </button>
                      <span className="text-[10px] font-bold font-mono text-slate-600 dark:text-slate-400">
                        {allActive ? "ON" : tierActiveCount > 0 ? "MIX" : "OFF"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <p className="text-[11.5px] leading-snug line-clamp-1 pr-2">
                      {t(col.descKey, col.defaultDesc)}
                    </p>
                    <span className="font-mono font-bold shrink-0 text-slate-700 dark:text-slate-300">
                      {t("services.activeCount", { active: tierActiveCount, total: items.length }, `${tierActiveCount}/${items.length}`)}
                    </span>
                  </div>
                </div>

                {/* Column Cards Container */}
                <div className="p-3 space-y-3 flex-1">
                  {items.length === 0 ? (
                    <div className="py-12 px-4 text-center rounded-xl border-2 border-dashed border-slate-200 dark:border-white/5 text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                      <Layers className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                      <span>{t("services.emptyTier", "No hay servicios en este Tier. Arrastra una tarjeta aquí.")}</span>
                    </div>
                  ) : (
                    items.map((svc) => {
                      const isActive = svc.active === 1 || (svc.active as any) === true;
                      const isDragging = draggingId === svc.id;
                      const svcName = locale === "en" && svc.name_en ? svc.name_en : svc.name;
                      const svcDesc = locale === "en" && svc.description_en ? svc.description_en : svc.description;
                      const svcPain = locale === "en" && svc.pain_solved_en ? svc.pain_solved_en : svc.pain_solved;

                      return (
                        <div
                          key={svc.id}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData(DRAG_MIME, svc.id);
                            e.dataTransfer.setData("text/plain", svc.id);
                            setDraggingId(svc.id);
                          }}
                          onDragEnd={() => {
                            setDraggingId(null);
                            setHoverTier(null);
                          }}
                          className={`group relative rounded-xl p-4 transition-all duration-200 kanban-grab select-none border ${
                            isDragging
                              ? "opacity-40 scale-95 border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 kanban-grabbing"
                              : !isActive
                              ? "bg-slate-50/60 dark:bg-slate-950/40 border-dashed border-slate-300 dark:border-white/10 opacity-70 hover:opacity-100"
                              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-white/10 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-white/20"
                          }`}
                        >
                          {/* Top Row: Icon + Name + Active Status Toggle */}
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span
                                className="p-1 rounded-md bg-slate-200/90 text-slate-900 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-white/10 transition-colors flex items-center justify-center shrink-0 kanban-grab shadow-xs"
                                title="Arrastrar servicio"
                              >
                                <GripVertical className="w-3.5 h-3.5" />
                              </span>
                              <span className={`text-2xl shrink-0 ${!isActive ? "grayscale opacity-70" : ""}`}>
                                {svc.icon ?? "🔧"}
                              </span>
                              <div className="min-w-0 flex-1">
                                <h3 className={`font-bold text-sm leading-tight tracking-tight ${isActive ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>
                                  {svcName}
                                </h3>
                                {!isActive && (
                                  <span className="inline-block text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20 mt-0.5">
                                    {t("services.disabledBadge", "Excluido de propuestas")}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Service Status Toggle Button */}
                            <button
                              type="button"
                              onClick={() => toggleActive(svc)}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all border shrink-0 cursor-pointer ${
                                isActive
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-200"
                              }`}
                              title={isActive ? t("services.deactivate", "Click para desactivar") : t("services.activate", "Click para activar")}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500 shadow-xs shadow-emerald-500" : "bg-slate-400"}`} />
                              <span>{isActive ? t("services.activeStatus", "Activo") : t("services.inactiveStatus", "Off")}</span>
                            </button>
                          </div>

                          {/* Description */}
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2 line-clamp-2">
                            {svcDesc}
                          </p>

                          {/* Pain Solved Callout */}
                          {svcPain && (
                            <div className="mt-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-white/5 text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                              <span className="font-bold text-amber-700 dark:text-amber-400 mr-1">💡 {t("services.painTitle", "Dolor Resuelto:")}</span>
                              <span>{svcPain.slice(0, 110)}{svcPain.length > 110 ? "..." : ""}</span>
                            </div>
                          )}

                          {/* Price & Action Row */}
                          <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-white/5 flex items-center justify-between gap-2 flex-wrap">
                            <div className="font-mono">
                              <span className={`text-xs font-bold ${isActive ? "text-emerald-700 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
                                ${svc.price_setup} setup
                              </span>
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 ml-1">
                                + ${svc.price_monthly}/mo
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              {/* Edit Button */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEditModal(svc)}
                                className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                              >
                                <Edit3 className="w-3 h-3 mr-1" />
                                <span>{t("services.editBtn", "Editar")}</span>
                              </Button>

                              {/* Directional Move Buttons for Mobile/Accessibility */}
                              {col.tier > 1 && (
                                <button
                                  type="button"
                                  onClick={() => moveServiceToTier(svc.id, (col.tier - 1) as 1 | 2 | 3)}
                                  className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all text-xs"
                                  title={t("services.moveLeft", { tier: col.tier - 1 }, `← Mover a Tier ${col.tier - 1}`)}
                                >
                                  <ArrowLeft className="w-3 h-3" />
                                </button>
                              )}
                              {col.tier < 3 && (
                                <button
                                  type="button"
                                  onClick={() => moveServiceToTier(svc.id, (col.tier + 1) as 1 | 2 | 3)}
                                  className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all text-xs"
                                  title={t("services.moveRight", { tier: col.tier + 1 }, `Mover a Tier ${col.tier + 1} →`)}
                                >
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Complete Edit Service Dialog Modal */}
      <Dialog open={!!editingService} onOpenChange={(open) => !open && closeEditModal()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{editingService?.icon ?? "🔧"}</span>
              <span>{t("services.editModalTitle", "Editar Servicio del Catálogo")}</span>
            </DialogTitle>
            <DialogDescription>
              {t("services.editModalSubtitle", "Ajusta precios, nombres y propuesta de valor comercial.")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name ES & EN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="svcName" className="text-xs font-bold">
                  {t("services.nameLabel", "Nombre del Servicio (ES)")}
                </Label>
                <Input
                  id="svcName"
                  value={editForm.name ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="svcNameEn" className="text-xs font-bold">
                  {t("services.nameEnLabel", "Nombre del Servicio (EN)")}
                </Label>
                <Input
                  id="svcNameEn"
                  value={editForm.name_en ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, name_en: e.target.value })}
                  className="text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Tier Selector + Prices */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="svcTier" className="text-xs font-bold">
                  {t("services.tierLabel", "Nivel de Tier")}
                </Label>
                <select
                  id="svcTier"
                  value={editForm.tier ?? 1}
                  onChange={(e) => setEditForm({ ...editForm, tier: Number(e.target.value) as 1 | 2 | 3 })}
                  className="w-full h-9 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white"
                >
                  <option value={1}>Tier 1 · Quick Wins</option>
                  <option value={2}>Tier 2 · Core Services</option>
                  <option value={3}>Tier 3 · High-Ticket</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="svcSetup" className="text-xs font-bold">
                  {t("services.setupLabel", "Setup USD (Pago único)")}
                </Label>
                <Input
                  id="svcSetup"
                  type="number"
                  value={editForm.price_setup ?? 0}
                  onChange={(e) => setEditForm({ ...editForm, price_setup: parseInt(e.target.value) || 0 })}
                  className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="svcMonthly" className="text-xs font-bold">
                  {t("services.monthlyLabel", "Retainer USD (Mensual MRR)")}
                </Label>
                <Input
                  id="svcMonthly"
                  type="number"
                  value={editForm.price_monthly ?? 0}
                  onChange={(e) => setEditForm({ ...editForm, price_monthly: parseInt(e.target.value) || 0 })}
                  className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Description ES */}
            <div className="space-y-1.5">
              <Label htmlFor="svcDesc" className="text-xs font-bold">
                {t("services.descLabel", "Descripción")}
              </Label>
              <textarea
                id="svcDesc"
                rows={2}
                value={editForm.description ?? ""}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-2 text-xs text-slate-900 dark:text-white leading-relaxed"
              />
            </div>

            {/* Pain Point Solved */}
            <div className="space-y-1.5">
              <Label htmlFor="svcPain" className="text-xs font-bold">
                {t("services.painLabel", "Dolor que Resuelve (Pain Point)")}
              </Label>
              <textarea
                id="svcPain"
                rows={2}
                value={editForm.pain_solved ?? ""}
                onChange={(e) => setEditForm({ ...editForm, pain_solved: e.target.value })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-2 text-xs text-slate-900 dark:text-white leading-relaxed"
              />
            </div>

            {/* Pitch Template */}
            <div className="space-y-1.5">
              <Label htmlFor="svcPitch" className="text-xs font-bold">
                {t("services.pitchLabel", "Plantilla de Pitch Comercial")}
              </Label>
              <textarea
                id="svcPitch"
                rows={3}
                value={editForm.pitch_template ?? ""}
                onChange={(e) => setEditForm({ ...editForm, pitch_template: e.target.value })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-2 text-xs text-slate-900 dark:text-white leading-relaxed font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={closeEditModal} disabled={savingEdit}>
              {t("common.cancel", "Cancelar")}
            </Button>
            <Button onClick={saveEdit} disabled={savingEdit} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              {savingEdit ? t("common.saving", "Guardando...") : `💾 ${t("common.save", "Guardar Cambios")}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
