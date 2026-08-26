"use client";

import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProposalContent, ProposalServiceItem } from "@/lib/proposals/generator";

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  hot: { label: "🔥 Cerrar esta semana", color: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30" },
  warm: { label: "⚡ Lead caliente", color: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30" },
  nurture: { label: "🌱 Nurture", color: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30" },
  skip: { label: "❌ Skip", color: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/30" },
};

export default function ProposalPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { t, locale } = useT();
  const unwrapped = React.use(params);

  const [proposal, setProposal] = React.useState<ProposalContent | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Interactive Cotizador State
  const [selectedServiceIds, setSelectedServiceIds] = React.useState<string[]>([]);
  const [discountActive, setDiscountActive] = React.useState<boolean>(true);
  const [avgTicket, setAvgTicket] = React.useState<number>(350);
  const [showCatalogModal, setShowCatalogModal] = React.useState<boolean>(false);
  const [customServices, setCustomServices] = React.useState<ProposalServiceItem[]>([]);
  const [copiedToast, setCopiedToast] = React.useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState<boolean>(false);
  const [isDownloadingPptx, setIsDownloadingPptx] = React.useState<boolean>(false);
  const [isRoadmapCollapsed, setIsRoadmapCollapsed] = React.useState<boolean>(true);

  // Initial Load
  React.useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/businesses/${unwrapped.businessId}/proposal`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        const data: ProposalContent = await res.json();
        setProposal(data);
        setCustomServices(data.services || []);
        setSelectedServiceIds((data.services || []).map((s) => s.id));
        setDiscountActive((data.services || []).length >= 2);
        setError(null);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [unwrapped.businessId]);

  // Close catalog modal on Escape key
  React.useEffect(() => {
    if (!showCatalogModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowCatalogModal(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showCatalogModal]);

  // Recalculate Live Totals whenever selections change
  const activeServices = React.useMemo(() => {
    return customServices.filter((s) => selectedServiceIds.includes(s.id));
  }, [customServices, selectedServiceIds]);

  const subtotalSetup = React.useMemo(() => {
    return activeServices.reduce((sum, s) => sum + s.setupPrice, 0);
  }, [activeServices]);

  const totalMonthly = React.useMemo(() => {
    return activeServices.reduce((sum, s) => sum + s.monthlyPrice, 0);
  }, [activeServices]);

  const discountPercent = discountActive && activeServices.length >= 2 ? 15 : 0;
  const discountSetup = Math.round((subtotalSetup * discountPercent) / 100);
  const totalSetup = subtotalSetup - discountSetup;
  const annualTotal = totalSetup + totalMonthly * 12;
  const savingsAmount = discountSetup;

  // ROI calculations
  const clientsNeededToBreakEven = Math.max(1, Math.ceil(totalMonthly / (avgTicket || 1)));
  const estimatedMonthlyRevenue = Math.round(totalMonthly * 3.8);
  const estimatedRevenueImpact = `~$${estimatedMonthlyRevenue.toLocaleString()} / mes`;

  // Toggle single service
  const handleToggleService = (id: string) => {
    setSelectedServiceIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      return next;
    });
  };

  // Remove service completely from current proposal list
  const handleRemoveService = (id: string) => {
    setCustomServices((prev) => prev.filter((s) => s.id !== id));
    setSelectedServiceIds((prev) => prev.filter((x) => x !== id));
  };

  const [catalogSearch, setCatalogSearch] = React.useState<string>("");

  // Toggle or add service from catalog without auto-closing the modal
  const handleToggleCatalogService = (catSvc: any) => {
    const isAlreadySelected = selectedServiceIds.includes(catSvc.id);
    
    if (isAlreadySelected) {
      // Unselect
      setSelectedServiceIds((prev) => prev.filter((id) => id !== catSvc.id));
    } else {
      // Ensure it is in customServices list
      if (!customServices.some((s) => s.id === catSvc.id)) {
        const newSvc: ProposalServiceItem = {
          id: catSvc.id,
          name: catSvc.name,
          icon: catSvc.icon || "⚡",
          tier: catSvc.tier || 1,
          relevance: 95,
          description: catSvc.description || "Solución implementada a medida.",
          pitch: `Implementación especializada de ${catSvc.name} para su negocio.`,
          setupPrice: catSvc.priceSetup || 400,
          monthlyPrice: catSvc.priceMonthly || 250,
          annualPrice: (catSvc.priceSetup || 400) + (catSvc.priceMonthly || 250) * 12,
          isSelected: true,
        };
        setCustomServices((prev) => [...prev, newSvc]);
      }
      setSelectedServiceIds((prev) => [...prev, catSvc.id]);
    }
  };

  // Sort and filter catalog services: already added first, then by usageCount descending
  const sortedAndFilteredCatalog = React.useMemo(() => {
    const list = proposal?.availableCatalogServices || [];
    const query = catalogSearch.trim().toLowerCase();

    const filtered = query
      ? list.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.description.toLowerCase().includes(query) ||
            (c.category && c.category.toLowerCase().includes(query))
        )
      : list;

    return [...filtered].sort((a, b) => {
      const aSelected = selectedServiceIds.includes(a.id);
      const bSelected = selectedServiceIds.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return (b.usageCount || 0) - (a.usageCount || 0);
    });
  }, [proposal?.availableCatalogServices, catalogSearch, selectedServiceIds]);

  // PDF Download: fetch blob → crear object URL → descargar con nombre correcto
  const downloadCustomPDF = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);

    try {
      const serviceIds = selectedServiceIds.join(",");
      const url = `/api/businesses/${unwrapped.businessId}/proposal-pdf?services=${encodeURIComponent(serviceIds)}&discount=${discountPercent}&ticket=${avgTicket}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

      // Leer como ArrayBuffer y reconstruir blob con MIME explícito
      const arrayBuf = await res.arrayBuffer();
      const pdfBlob = new Blob([arrayBuf], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(pdfBlob);

      const safeName = proposal?.to.businessName
        ? proposal.to.businessName.replace(/[^a-zA-Z0-9-_\s]/g, "").replace(/\s+/g, "-").toLowerCase().slice(0, 50)
        : "propuesta";
      const filename = `propuesta-${safeName}.pdf`;

      // Crear anchor, asignar nombre, disparar click y NO eliminar de inmediato
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      // Limpiar después de que el navegador haya procesado la descarga completa
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 60_000);
    } catch (err) {
      console.error("Error al descargar PDF:", err);
      alert("No se pudo generar el PDF. Intenta de nuevo.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // PPTX Pitch Deck Download (6 slides para reuniones con el cliente)
  const downloadPitchDeck = async () => {
    if (isDownloadingPptx) return;
    setIsDownloadingPptx(true);

    try {
      const serviceIds = selectedServiceIds.join(",");
      const url = `/api/businesses/${unwrapped.businessId}/proposal-pptx?services=${encodeURIComponent(serviceIds)}&discount=${discountPercent}&ticket=${avgTicket}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

      const arrayBuf = await res.arrayBuffer();
      const pptxBlob = new Blob([arrayBuf], {
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      });
      const blobUrl = URL.createObjectURL(pptxBlob);

      const safeName = proposal?.to.businessName
        ? proposal.to.businessName.replace(/[^a-zA-Z0-9-_\s]/g, "").replace(/\s+/g, "-").toLowerCase().slice(0, 50)
        : "pitch-deck";
      const filename = `pitch-deck-${safeName}.pptx`;

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 60_000);
    } catch (err) {
      console.error("Error al generar Pitch Deck:", err);
      alert("No se pudo generar el Pitch Deck. Intenta de nuevo.");
    } finally {
      setIsDownloadingPptx(false);
    }
  };

  // WhatsApp Pitch Copy
  const generateWhatsAppMessage = () => {
    if (!proposal) return "";
    const svcList = activeServices.map((s) => `• ${s.icon} ${s.name}`).join("\n");
    return `Hola ${proposal.to.businessName}, te comparto el resumen de la solución de IA que preparamos para tu negocio:

${svcList}

💰 Inversión de Setup: $${totalSetup.toLocaleString()} ${discountPercent > 0 ? `(Ahorras $${savingsAmount} con 15% desc. paquete)` : ""}
🔄 Mantenimiento Mensual: $${totalMonthly.toLocaleString()}/mes
📈 Con solo ${clientsNeededToBreakEven} cliente(s) nuevo(s) al mes pagas el 100% de la solución.

Quedo atento para agendar la puesta en marcha en 72 horas.`;
  };

  const copyWhatsAppPitch = () => {
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-radial flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-slate-400 font-medium">Cargando cotizador interactivo...</p>
        </div>
      </main>
    );
  }

  if (error || !proposal) {
    return (
      <main className="min-h-screen bg-gradient-radial p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="py-8 text-center">
              <p className="text-red-300 text-lg">⚠️ {error ?? "Propuesta no encontrada"}</p>
              <a href={`/radar/${unwrapped.businessId}`} className="mt-4 inline-block text-sky-400 underline">
                ← Volver a la ficha del negocio
              </a>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const tierInfo = TIER_LABELS[proposal.diagnostic.tier] ?? TIER_LABELS.warm;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto pb-20">
      {/* 2-Column Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Proposal Business Header Card */}
          <Card className="card-glass border-slate-200/80 dark:border-white/10 shadow-xs bg-white/95 dark:bg-slate-900/90 backdrop-blur-md">
            <CardContent className="p-5 md:p-6 space-y-2">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 font-mono">
                  {t("proposals.badge", "COTIZADOR DINÁMICO")}
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {proposal.proposalNumber}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold font-display text-slate-900 dark:text-white">
                {t("proposals.quoteFor", { name: proposal.to.businessName }, `Cotización para ${proposal.to.businessName}`)}
              </h1>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium">
                {t("proposals.validUntil", { city: proposal.to.city || "Corona", state: proposal.to.state || "CA", date: proposal.validUntil }, `${proposal.to.city || "Corona"}, ${proposal.to.state || "CA"} · Válida hasta ${proposal.validUntil}`)}
              </p>
            </CardContent>
          </Card>
          
          {/* Services Selector Card */}
          <Card className="card-glass">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {t("proposals.servicesSelectionTitle", { count: activeServices.length }, `🎯 Selección de Servicios a Cotizar (${activeServices.length} activos)`)}
                </CardTitle>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                  {t("proposals.servicesSelectionDesc", "Marca o desmarca los servicios según la necesidad del cliente para recalcular en vivo.")}
                </p>
              </div>
              <Button 
                onClick={() => setShowCatalogModal(true)} 
                variant="outline" 
                size="sm"
                className="border-sky-300 dark:border-sky-500/40 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-500/10 text-xs font-semibold"
              >
                {t("proposals.addFromCatalog", "➕ Agregar del Catálogo")}
              </Button>
            </CardHeader>

              <CardContent className="space-y-3 pt-2">
                {customServices.map((svc) => {
                  const isChecked = selectedServiceIds.includes(svc.id);
                  return (
                    <div
                      key={svc.id}
                      onClick={() => handleToggleService(svc.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                        isChecked
                          ? "bg-orange-50/80 dark:bg-slate-900 border-orange-400 dark:border-orange-500/60 shadow-md ring-1 ring-orange-400 dark:ring-orange-500/30"
                          : "bg-white/80 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800/80 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="mt-1.5 h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-orange-500 focus:ring-orange-400 bg-white dark:bg-slate-800 accent-orange-500"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{svc.icon}</span>
                              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{svc.name}</h3>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                Tier {svc.tier}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">{svc.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                              ${svc.setupPrice} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{t("services.setupFee", "setup")}</span>
                            </div>
                            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 font-mono">
                              +${svc.monthlyPrice}<span className="text-slate-500 dark:text-slate-400">/mo</span>
                            </div>
                          </div>

                          {/* Delete from proposal button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveService(svc.id);
                            }}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800/60 hover:bg-red-50 dark:hover:bg-red-500/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700/50 hover:border-red-300 dark:hover:border-red-500/40 flex items-center justify-center text-xs transition-all"
                            title="Eliminar servicio de esta propuesta"
                            aria-label={`Eliminar ${svc.name}`}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {isChecked && (
                        <p className="text-xs text-slate-700 dark:text-slate-300 italic border-l-2 border-orange-500/50 pl-3 mt-3">
                          "{svc.pitch}"
                        </p>
                      )}
                    </div>
                  );
                })}

                {customServices.length === 0 && (
                  <p className="text-center py-6 text-slate-500 text-sm">
                    No hay servicios seleccionados. Haz clic en "Agregar del Catálogo".
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Roadmap de Crecimiento · Fase 2 (Futuro Upsell) - Collapsible */}
            {proposal.futureUpsellServices && proposal.futureUpsellServices.length > 0 && (
              <Card className="card-glass border-violet-200/80 dark:border-violet-500/30 bg-violet-50/20 dark:bg-violet-950/10 shadow-xs transition-all">
                <CardHeader
                  onClick={() => setIsRoadmapCollapsed((prev) => !prev)}
                  className={`pb-2.5 transition-colors cursor-pointer select-none ${
                    !isRoadmapCollapsed ? "border-b border-violet-100 dark:border-white/5" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🌱</span>
                      <div>
                        <CardTitle className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
                          <span>{t("proposals.roadmapTitle", "Roadmap de Crecimiento · Fase 2")}</span>
                          <span className="text-xs font-normal text-slate-500 dark:text-slate-400 font-mono">
                            ({proposal.futureUpsellServices.length} {t("nav.services", "servicios")})
                          </span>
                        </CardTitle>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                          {t("proposals.roadmapSubtitle", "Servicios estratégicos recomendados para expandir la facturación tras consolidar los Quick Wins.")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300 border border-violet-200 dark:border-violet-500/40 uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                        {t("proposals.roadmapBadge", "Futuro Upsell (Tier 2 & 3)")}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsRoadmapCollapsed((prev) => !prev);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-violet-700 hover:text-violet-900 bg-violet-100/70 hover:bg-violet-200/80 dark:text-violet-300 dark:bg-violet-500/20 dark:hover:bg-violet-500/30 border border-violet-200 dark:border-violet-500/30 transition-all cursor-pointer shadow-2xs"
                        title={isRoadmapCollapsed ? t("proposals.expandRoadmapTitle", "Desplegar roadmap de expansión") : t("proposals.collapseRoadmapTitle", "Plegar roadmap de expansión")}
                        aria-expanded={!isRoadmapCollapsed}
                      >
                        <span>{isRoadmapCollapsed ? t("proposals.expandRoadmap", "Desplegar") : t("proposals.collapseRoadmap", "Plegar")}</span>
                        <span className="text-[10px] font-mono leading-none">
                          {isRoadmapCollapsed ? "▼" : "▲"}
                        </span>
                      </button>
                    </div>
                  </div>
                </CardHeader>

                {!isRoadmapCollapsed && (
                  <CardContent className="space-y-3 pt-3.5 animate-in fade-in-50 duration-150">
                    <div className="grid grid-cols-1 gap-3">
                      {proposal.futureUpsellServices.map((upsell) => (
                        <div
                          key={upsell.id}
                          className="p-3.5 rounded-xl border border-dashed border-violet-200 dark:border-violet-500/30 bg-white/80 dark:bg-slate-900/60 flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap transition-all hover:border-violet-400 dark:hover:border-violet-500/60"
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <span className="text-2xl shrink-0 p-1.5 rounded-lg bg-violet-50 dark:bg-violet-500/10 border border-violet-200/60 dark:border-violet-500/20">
                              {upsell.icon}
                            </span>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                  {locale === "en" && upsell.name_en ? upsell.name_en : upsell.name}
                                </h4>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  Tier {upsell.tier}
                                </span>
                                <span className="text-[10px] font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-200/70 dark:border-violet-500/20">
                                  {t("proposals.roadmapReserved", "🔒 Reservado para Fase 2")}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                {locale === "en" && upsell.description_en ? upsell.description_en : upsell.description}
                              </p>
                              {upsell.reasoning && (
                                <p className="text-[11px] text-amber-800 dark:text-amber-300/90 font-medium italic flex items-center gap-1 pt-0.5">
                                  <span>💡</span>
                                  <span>{upsell.reasoning}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Price Reference Pill */}
                          <div className="text-right shrink-0 sm:self-center">
                            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 block">
                              ${upsell.priceSetup} + ${upsell.priceMonthly}/mo
                            </span>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              ({t("proposals.roadmapEstimated", "Proyección estimada")})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-2.5 rounded-lg bg-violet-100/50 dark:bg-violet-950/30 border border-violet-200/60 dark:border-violet-500/20 flex items-center justify-between gap-3 text-xs">
                      <span className="text-violet-900 dark:text-violet-200 text-[11.5px]">
                        🎯 <strong>{t("proposals.roadmapStrategy", "Estrategia de Venta: Cierra primero los Quick Wins activos de Fase 1 para generar ROI rápido, y presenta estos servicios en el check-in de los 60 días.")}</strong>
                      </span>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

          </div>

          {/* Right Column (1 Col wide): Quick Actions + Live Pricing Summary & ROI Calculator */}
          <div className="space-y-4 md:space-y-6">
            
            {/* Quick Action Buttons Stack */}
            <div className="space-y-2.5">
              <Button 
                onClick={copyWhatsAppPitch} 
                variant="outline" 
                className="w-full justify-center gap-2 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 font-bold shadow-xs py-5 text-sm"
              >
                {copiedToast ? (
                  <>
                    <span className="text-base">✅</span>
                    <span>{t("proposals.pitchCopied", "¡Copiado al portapapeles!")}</span>
                  </>
                ) : (
                  <>
                    <span className="text-base">💬</span>
                    <span>{t("proposals.copyPitchWhatsApp", "Copiar Pitch WhatsApp")}</span>
                  </>
                )}
              </Button>
              <Button 
                onClick={downloadPitchDeck} 
                disabled={isDownloadingPptx}
                className="w-full justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-md shadow-sky-600/20 py-5 text-sm"
              >
                <span className="text-base">{isDownloadingPptx ? "⏳" : "📊"}</span>
                <span>{isDownloadingPptx ? t("proposals.generatingPitchDeck", "Generando Pitch Deck...") : t("proposals.downloadPitchDeck", "Descargar Pitch Deck PPTX")}</span>
              </Button>
            </div>

            {/* Live Investment Card */}
            <Card className="card-glass border-slate-200/80 dark:border-white/10 shadow-lg">
              <CardHeader className="pb-3 border-b border-slate-200 dark:border-white/10">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>{t("proposals.liveBudgetTitle", "💰 Presupuesto en Vivo")}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 font-mono">
                    {t("proposals.activeServicesBadge", { count: activeServices.length }, `${activeServices.length} Servicios`)}
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                
                {/* Bundle Discount Toggle */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t("proposals.packageDiscountTitle", "Descuento Paquete (15%)")}</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{t("proposals.packageDiscountSubtitle", "Para 2 o más servicios")}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={discountActive}
                    onChange={(e) => setDiscountActive(e.target.checked)}
                    disabled={activeServices.length < 2}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-slate-800 accent-emerald-600"
                  />
                </div>

                {/* Pricing Line Items */}
                <div className="space-y-2 text-sm border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                    <span>{t("proposals.setupSubtotal", "Subtotal Setup")}</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">${subtotalSetup.toLocaleString()}</span>
                  </div>
                  {discountSetup > 0 && (
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                      <span>{t("proposals.packageSavings", "Ahorro Paquete (-15%)")}</span>
                      <span className="font-mono">-${discountSetup.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-900 dark:text-slate-100 font-bold pt-1">
                    <span>{t("proposals.oneTimeSetup", "Pago Único de Setup")}</span>
                    <span className="text-xl font-mono text-slate-900 dark:text-white">${totalSetup.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-300 font-bold pt-1">
                    <span>{t("proposals.monthlyRetainer", "Retainer Mensual (MRR)")}</span>
                    <span className="text-xl font-mono text-emerald-700 dark:text-emerald-400">${totalMonthly.toLocaleString()}<span className="text-xs font-normal text-slate-500 dark:text-slate-400">/mo</span></span>
                  </div>
                </div>

                {/* Total Year 1 */}
                <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-200 dark:border-emerald-500/20 text-center">
                  <span className="text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">{t("proposals.totalYear1", "Inversión Total Año 1")}</span>
                  <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                    ${annualTotal.toLocaleString()}
                  </p>
                </div>

                {/* Primary Download Button */}
                <Button 
                  onClick={downloadCustomPDF} 
                  disabled={isDownloadingPdf}
                  className="w-full justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-5 text-sm shadow-lg shadow-emerald-600/20"
                >
                  <span className="text-base">{isDownloadingPdf ? "⏳" : "📥"}</span>
                  <span>{isDownloadingPdf ? t("proposals.generatingPdf", "Generando...") : t("proposals.downloadPdf", "Descargar Propuesta PDF")}</span>
                </Button>
              </CardContent>
            </Card>

            {/* Interactive ROI Calculator */}
            <Card className="card-glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {t("proposals.roiSimulatorTitle", "📈 Simulador de ROI & Cierre")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{t("proposals.avgTicketLabel", "Ticket Promedio del Cliente ($):")}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-slate-500 font-mono text-sm">$</span>
                    <Input
                      type="number"
                      value={avgTicket}
                      onChange={(e) => setAvgTicket(Math.max(1, Number(e.target.value)))}
                      className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-center space-y-1">
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 uppercase tracking-wider font-bold">{t("proposals.breakEvenTitle", "Punto de Equilibrio")}</p>
                  <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                    {t("proposals.breakEvenClients", { count: clientsNeededToBreakEven, unit: clientsNeededToBreakEven === 1 ? t("proposals.clientUnitSingle", "cliente") : t("proposals.clientUnitPlural", "clientes") })}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    {t("proposals.breakEvenDesc", { count: clientsNeededToBreakEven }, `Solo necesita ${clientsNeededToBreakEven} venta(s) al mes para cubrir el 100% del servicio.`)}
                  </p>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pt-1 font-medium">
                  <div className="flex justify-between">
                    <span>{t("proposals.estimatedImpact", "Impacto Estimado:")}</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200">{estimatedRevenueImpact}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("proposals.paybackTime", "Tiempo de Payback:")}</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200">{t("proposals.paybackValue", "< 3 semanas")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>

        {/* Modal: Agregar Servicios del Catálogo */}
        {showCatalogModal && (
          <div
            onClick={() => setShowCatalogModal(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col p-6 space-y-4 shadow-2xl overflow-hidden cursor-default"
            >
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📦</span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {t("proposals.catalogModalTitle", "Catálogo de Servicios AI")}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t("proposals.catalogModalSubtitle", "Selecciona múltiples servicios para añadirlos a la cotización")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCatalogModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center text-sm font-bold transition-colors"
                  aria-label="Cerrar modal"
                >
                  ✕
                </button>
              </div>

              {/* Real-Time Search Bar */}
              <div className="relative flex-shrink-0">
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder={t("proposals.catalogSearchPlaceholder", "🔍 Buscar servicio (ej. llamadas, WhatsApp, reviews, ads, citas, chat)...")}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
                {catalogSearch && (
                  <button
                    onClick={() => setCatalogSearch("")}
                    className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded"
                  >
                    {t("common.clear", "Limpiar")}
                  </button>
                )}
              </div>

              {/* Service Cards List */}
              <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
                {sortedAndFilteredCatalog.map((cat) => {
                  const isSelected = selectedServiceIds.includes(cat.id);
                  return (
                    <div
                      key={cat.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                        isSelected
                          ? "bg-orange-50/80 dark:bg-slate-950/90 border-orange-300 dark:border-orange-500/40 shadow-xs"
                          : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Service Icon */}
                        <span className="text-2xl flex-shrink-0">{cat.icon}</span>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{cat.name}</h4>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400">
                              Tier {cat.tier}
                            </span>
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 text-[11px] font-bold text-sky-700 dark:text-sky-400 font-mono"
                              title={`Este servicio ha sido seleccionado en ${cat.usageCount} propuestas comerciales`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                              {cat.usageCount} {t("radar.reviews", "usos")}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5">{cat.description}</p>
                          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                            Setup: <span className="text-slate-800 dark:text-slate-300 font-semibold">${cat.priceSetup}</span> · Mensual: <span className="text-emerald-700 dark:text-emerald-400 font-semibold">${cat.priceMonthly}/mo</span>
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        size="sm"
                        variant={isSelected ? "secondary" : "default"}
                        onClick={() => handleToggleCatalogService(cat)}
                        className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 transition-all ${
                          isSelected
                            ? "bg-slate-100 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-500/20 dark:hover:text-red-400 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30"
                            : "bg-orange-500 hover:bg-orange-600 text-white shadow-xs"
                        }`}
                      >
                        {isSelected ? t("proposals.addedBtn", "✓ Agregado") : t("proposals.addBtn", "+ Agregar")}
                      </Button>
                    </div>
                  );
                })}

                {sortedAndFilteredCatalog.length === 0 && (
                  <div className="py-8 text-center text-slate-500 text-sm">
                    {t("common.empty", "Sin resultados")} "{catalogSearch}".
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex items-center justify-between flex-shrink-0">
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-white font-bold">{selectedServiceIds.length}</strong> {t("proposals.selectedCount", { count: selectedServiceIds.length }, `${selectedServiceIds.length} servicio(s) seleccionados en la cotización`)}
                </span>
                <Button
                  onClick={() => setShowCatalogModal(false)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2"
                >
                  {t("proposals.doneBackToBudget", "✓ Listo / Volver al Presupuesto")}
                </Button>
              </div>

            </div>
          </div>
        )}
      </div>
  );
}
