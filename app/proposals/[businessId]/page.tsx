"use client";

import * as React from "react";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Proposal {
  proposalNumber: string;
  proposalDate: string;
  validUntil: string;
  companyName: string;
  companyTagline: string;
  to: {
    businessName: string;
    address: string | null;
    city: string | null;
    state: string | null;
  };
  executiveSummary: string;
  diagnostic: {
    opportunityScore: number;
    tier: string;
    breakdown: {
      brechaDigital: number;
      gapOperativo: number;
      fitNegocio: number;
      senalesCompra: number;
      proximidad: number;
    };
    painPoints: string[];
  };
  services: Array<{
    name: string;
    icon: string;
    tier: number;
    relevance: number;
    description: string;
    pitch: string;
    setupPrice: number;
    monthlyPrice: number;
    annualPrice: number;
  }>;
  investment: {
    totalSetup: number;
    totalMonthly: number;
    annualTotal: number;
    packageVsAlaCarte: string;
  };
  roi: {
    estimatedCallsCaptured: string;
    estimatedRevenueImpact: string;
    paybackPeriod: string;
  };
  nextSteps: string[];
  footer: {
    contactEmail: string;
    contactPhone: string;
    website: string;
  };
}

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  hot: { label: "🔥 Cerrar esta semana", color: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  warm: { label: "⚡ Lead caliente", color: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  nurture: { label: "🌱 Nurture", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  skip: { label: "❌ Skip", color: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
};

export default function ProposalPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { t } = useT();
  const [proposal, setProposal] = React.useState<Proposal | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const unwrapped = React.use(params);

  React.useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/businesses/${unwrapped.businessId}/proposal`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        setProposal(await res.json());
        setError(null);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [unwrapped.businessId]);

  const downloadPDF = () => {
    window.open(`/api/businesses/${unwrapped.businessId}/proposal-pdf`, "_blank");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-radial flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-slate-400">Generando propuesta...</p>
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
              <a href={`/radar/${unwrapped.businessId}`} className="mt-4 inline-block text-sky-400">
                ← Volver a la ficha
              </a>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const tierInfo = TIER_LABELS[proposal.diagnostic.tier] ?? TIER_LABELS.warm;

  return (
    <main className="min-h-screen bg-gradient-radial">
      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display text-gradient-brand">
              Propuesta para {proposal.to.businessName}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {proposal.proposalNumber} · {proposal.proposalDate} · Válida hasta {proposal.validUntil}
            </p>
          </div>
          <div className="flex items-center gap-2"><Button onClick={downloadPDF} size="lg">
              📥 Descargar PDF
            </Button>
          </div>
        </div>

        {/* Nav */}
        <div className="flex items-center gap-3 text-sm">
          <a href="/" className="text-sky-400">← Inicio</a>
          <span className="text-slate-700">·</span>
          <a href={`/radar/${unwrapped.businessId}`} className="text-sky-400">← Ficha</a>
        </div>

        {/* Hero card */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">De</p>
                <p className="text-lg font-bold text-slate-100">{proposal.companyName}</p>
                <p className="text-sm text-slate-400">{proposal.companyTagline}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Para</p>
                <p className="text-lg font-bold text-slate-100">{proposal.to.businessName}</p>
                {proposal.to.address && <p className="text-xs text-slate-400">{proposal.to.address}</p>}
                {(proposal.to.city || proposal.to.state) && (
                  <p className="text-xs text-slate-400">
                    {proposal.to.city}, {proposal.to.state}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Executive summary */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Resumen Ejecutivo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-200 leading-relaxed">{proposal.executiveSummary}</p>
          </CardContent>
        </Card>

        {/* Diagnostic */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Diagnóstico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-4xl font-bold font-display text-sky-300">
                {proposal.diagnostic.opportunityScore}
                <span className="text-base text-slate-500 font-normal">/100</span>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${tierInfo.color}`}>
                {tierInfo.label}
              </span>
            </div>

            <div className="space-y-2">
              {[
                { name: "Brecha Digital", value: proposal.diagnostic.breakdown.brechaDigital, color: "bg-orange-500" },
                { name: "Gap Operativo", value: proposal.diagnostic.breakdown.gapOperativo, color: "bg-amber-500" },
                { name: "Fit del Negocio", value: proposal.diagnostic.breakdown.fitNegocio, color: "bg-sky-500" },
                { name: "Señales de Compra", value: proposal.diagnostic.breakdown.senalesCompra, color: "bg-emerald-500" },
                { name: "Proximidad", value: proposal.diagnostic.breakdown.proximidad, color: "bg-violet-500" },
              ].map((d) => (
                <div key={d.name} className="flex items-center gap-3 text-sm">
                  <span className="w-32 text-slate-300">{d.name}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${d.color}`}
                      style={{ width: `${d.value}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-mono text-slate-300">{d.value}</span>
                </div>
              ))}
            </div>

            {proposal.diagnostic.painPoints.length > 0 && (
              <div className="pt-2">
                <p className="text-sm font-semibold text-slate-200 mb-2">Puntos de dolor:</p>
                <ul className="space-y-1">
                  {proposal.diagnostic.painPoints.map((p, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-orange-400 mt-0.5">⚠</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 Servicios Recomendados ({proposal.services.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {proposal.services.map((svc, i) => (
              <div key={i} className="p-4 rounded-lg bg-slate-900/60 border border-white/5 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{svc.icon}</span>
                    <div>
                      <h3 className="font-semibold text-slate-100">{svc.name}</h3>
                      <p className="text-xs text-slate-500">Tier {svc.tier} · Match {svc.relevance}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-100 font-semibold">
                      ${svc.setupPrice} + ${svc.monthlyPrice}/mo
                    </p>
                    <p className="text-xs text-slate-500">${svc.annualPrice.toLocaleString()}/año</p>
                  </div>
                </div>
                <p className="text-sm text-slate-300 italic border-l-2 border-orange-500/40 pl-3">
                  "{svc.pitch}"
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Investment */}
        <Card>
          <CardHeader>
            <CardTitle>💰 Inversión Total</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Setup</p>
                <p className="text-2xl font-bold font-display text-slate-100">
                  ${proposal.investment.totalSetup.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Mensual</p>
                <p className="text-2xl font-bold font-display text-slate-100">
                  ${proposal.investment.totalMonthly.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Total Año 1</p>
                <p className="text-2xl font-bold font-display text-orange-300">
                  ${proposal.investment.annualTotal.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-400 italic border-l-2 border-slate-700 pl-3">
              {proposal.investment.packageVsAlaCarte}
            </p>
          </CardContent>
        </Card>

        {/* ROI */}
        <Card>
          <CardHeader>
            <CardTitle>📈 ROI Estimado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Llamadas capturadas</p>
                <p className="text-lg font-semibold text-slate-100">{proposal.roi.estimatedCallsCaptured}</p>
                <p className="text-xs text-slate-500">/mes</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Impacto</p>
                <p className="text-lg font-semibold text-emerald-300">{proposal.roi.estimatedRevenueImpact}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Payback</p>
                <p className="text-lg font-semibold text-emerald-300">{proposal.roi.paybackPeriod}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next steps */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Próximos Pasos</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {proposal.nextSteps.map((step, i) => (
                <li key={i} className="text-sm text-slate-200 flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Bottom CTA */}
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-sm text-slate-300">
              Esta propuesta es válida por 14 días. ¿Listos para empezar?
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button size="lg" onClick={downloadPDF}>📥 Descargar PDF</Button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Hola, recibí tu propuesta ${proposal.proposalNumber}. Me interesa avanzar.`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary" size="lg">
                  💬 Contactar por WhatsApp
                </Button>
              </a>
            </div>
            <p className="text-xs text-slate-500 pt-2">
              {proposal.footer.contactEmail} · {proposal.footer.contactPhone}
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
