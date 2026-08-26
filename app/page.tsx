"use client";

import * as React from "react";
import Link from "next/link";
import {
  Radar,
  Users,
  Package,
  Kanban,
  Wrench,
  Settings,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Target,
  CheckCircle2,
} from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { t } = useT();

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-sky-500/10 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100/80 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("app.suiteTitle", "OportunIA B2B Prospecting Suite")}</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold font-display tracking-tight text-slate-900 dark:text-slate-100">
              {t("app.heroTitle", "Panel de Control y Prospección")}
            </h1>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 font-medium">
              {t("app.heroDescription", "Encuentra negocios reales, califícalos con IA y genera propuestas comerciales de alto impacto para servicios de automatización e inteligencia artificial.")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link href="/radar" prefetch={true}>
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 shadow-md shadow-emerald-600/20">
                <Radar className="w-4 h-4" />
                <span>{t("app.launchRadar", "Lanzar Radar")}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/services" prefetch={true}>
              <Button variant="outline" size="lg" className="font-semibold border-slate-300 dark:border-white/15">
                <Package className="w-4 h-4 mr-2" />
                <span>{t("app.viewServices", "Ver Servicios")}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Quick KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 dark:border-white/10 shadow-xs hover:border-emerald-500/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("dashboard.kpiRadarTitle", "Prospector Radar")}
              </p>
              <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {t("dashboard.kpiRadarValue", "Google Places")}
              </h3>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {t("dashboard.kpiRadarSub", "Búsqueda en vivo y mapa")}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300 flex items-center justify-center">
              <Radar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-white/10 shadow-xs hover:border-sky-500/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("dashboard.kpiCrmTitle", "Pipeline CRM")}
              </p>
              <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {t("dashboard.kpiCrmValue", "6 Etapas")}
              </h3>
              <p className="text-[11px] text-sky-700 dark:text-sky-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                {t("dashboard.kpiCrmSub", "Kanban de conversión")}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300 flex items-center justify-center">
              <Kanban className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-white/10 shadow-xs hover:border-amber-500/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("dashboard.kpiCatalogTitle", "Catálogo IA")}
              </p>
              <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {t("dashboard.kpiCatalogValue", "3 Tiers")}
              </h3>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {t("dashboard.kpiCatalogSub", "Cotizador dinámico")}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-white/10 shadow-xs hover:border-violet-500/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("dashboard.kpiEngineTitle", "Motor 5D")}
              </p>
              <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {t("dashboard.kpiEngineValue", "100 Puntos")}
              </h3>
              <p className="text-[11px] text-violet-700 dark:text-violet-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                {t("dashboard.kpiEngineSub", "Triaje inteligente")}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Core Modules Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Module 1: Radar Prospector */}
        <Card className="border-slate-200/80 dark:border-white/10 flex flex-col justify-between group hover:border-emerald-500/40 transition-all shadow-xs">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 flex items-center justify-center mb-2 font-bold">
              🎯
            </div>
            <CardTitle className="text-lg text-slate-900 dark:text-slate-100 font-bold">
              {t("dashboard.cardRadarTitle", "Radar de Búsqueda")}
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              {t("dashboard.cardRadarDesc", "Explora en tiempo real negocios locales en cualquier sector, aplica filtros por categorías más usadas, radio geográfico y calificación de oportunidad.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/radar" prefetch={true}>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1.5 text-xs">
                <span>{t("dashboard.cardRadarBtn", "Abrir Radar")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Module 2: CRM & Lists */}
        <Card className="border-slate-200/80 dark:border-white/10 flex flex-col justify-between group hover:border-sky-500/40 transition-all shadow-xs">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 flex items-center justify-center mb-2 font-bold">
              📊
            </div>
            <CardTitle className="text-lg text-slate-900 dark:text-slate-100 font-bold">
              {t("dashboard.cardCrmTitle", "CRM & Gestión de Listas")}
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              {t("dashboard.cardCrmDesc", "Organiza prospectos en listas de outreach y arrastra cuentas en el embudo comercial Kanban desde Lead hasta Cerrado Ganado.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/crm" prefetch={true}>
              <Button variant="outline" className="w-full font-semibold gap-1.5 text-xs border-slate-300 dark:border-white/15">
                <span>{t("dashboard.cardCrmBtn", "Ver Pipeline CRM")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Module 3: Services & Proposals */}
        <Card className="border-slate-200/80 dark:border-white/10 flex flex-col justify-between group hover:border-orange-500/40 transition-all shadow-xs">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 flex items-center justify-center mb-2 font-bold">
              🚀
            </div>
            <CardTitle className="text-lg text-slate-900 dark:text-slate-100 font-bold">
              {t("dashboard.cardServicesTitle", "Servicios & Propuestas IA")}
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              {t("dashboard.cardServicesDesc", "Configura paquetes de servicios con precios por tier, calcula retornos de inversión (ROI) y genera propuestas comerciales listas para clientes.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/services" prefetch={true}>
              <Button variant="outline" className="w-full font-semibold gap-1.5 text-xs border-slate-300 dark:border-white/15">
                <span>{t("dashboard.cardServicesBtn", "Explorar Catálogo")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* 4. Quick Setup Checklist */}
      <Card className="border-slate-200/80 dark:border-white/10 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base text-slate-900 dark:text-slate-100 font-bold">
              {t("dashboard.setupTitle", "Flujo Rápido de Configuración")}
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500">
            {t("dashboard.setupDesc", "Completa estos tres pasos para maximizar la efectividad de tus escaneos")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/settings"
            prefetch={true}
            className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors block group"
          >
            <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
              {t("dashboard.stepBadge", { n: 1 }, "PASO 1")}
            </span>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
              {t("dashboard.step1Title", "Datos de Empresa & Origen →")}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {t("dashboard.step1Desc", "Configura tu ciudad base para cálculo de distancias.")}
            </p>
          </Link>

          <Link
            href="/tools"
            prefetch={true}
            className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors block group"
          >
            <span className="text-[11px] font-mono font-bold text-sky-700 dark:text-sky-400">
              {t("dashboard.stepBadge", { n: 2 }, "PASO 2")}
            </span>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1 group-hover:text-sky-700 dark:group-hover:text-sky-300">
              {t("dashboard.step2Title", "API Key de Google Places →")}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {t("dashboard.step2Desc", "Activa la búsqueda en vivo con tu credencial.")}
            </p>
          </Link>
          
          <Link
            href="/radar"
            prefetch={true}
            className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors block group"
          >
            <span className="text-[11px] font-mono font-bold text-violet-700 dark:text-violet-400">
              {t("dashboard.stepBadge", { n: 3 }, "PASO 3")}
            </span>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1 group-hover:text-violet-700 dark:group-hover:text-violet-300">
              {t("dashboard.step3Title", "Primer Escaneo de Prospectos →")}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {t("dashboard.step3Desc", "Filtra por oportunidad y genera cotizaciones.")}
            </p>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
