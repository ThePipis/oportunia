"use client";

import * as React from "react";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STEPS = [
  {
    icon: "👋",
    title: "¡Bienvenido a OportunIA!",
    body: "Radar de clientes de alto valor para vendedores de servicios de AI a negocios locales. Te tomará 60 segundos configurarlo.",
    cta: "Empezar tour",
  },
  {
    icon: "🔧",
    title: "1. Configurá tus herramientas",
    body: "Para encontrar negocios reales, necesitás API keys de Google Places (gratis), Yelp, Firecrawl, etc. Andá a Tools para configurarlas.",
    cta: "Ir a Tools",
  },
  {
    icon: "◎",
    title: "2. Buscá tu primer prospecto",
    body: "Elegí sector (HVAC, plomería, dentistas...) y ciudad (Eastvale, Corona...). Te devolvemos negocios reales con score 0-100.",
    cta: "Ir al Radar",
  },
];

export default function OnboardingPage() {
  const [step, setStep] = React.useState(0);
  const [done, setDone] = React.useState(false);

  if (done) {
    return (
      <main className="min-h-screen bg-gradient-radial flex items-center justify-center p-8">
        <Card className="max-w-lg w-full">
          <CardContent className="py-12 text-center space-y-4">
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-bold text-slate-100">¡Todo listo!</h2>
            <p className="text-slate-300">
              Empezá buscando tu primer prospecto. El score te dirá cuáles están listos para contratar.
            </p>
            <a href="/radar" className="inline-block">
              <Button size="lg">🚀 Ir al Radar</Button>
            </a>
          </CardContent>
        </Card>
      </main>
    );
  }

  const current = STEPS[step];

  return (
    <main className="min-h-screen bg-gradient-radial flex items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i <= step ? "w-8 bg-sky-400" : "w-2 bg-slate-700"
                }`}
              />
            ))}
          </div>
          <LanguageToggle />
        </div>

        {/* Step card */}
        <Card>
          <CardContent className="py-12 px-8 text-center space-y-6">
            <div className="text-7xl">{current.icon}</div>
            <div>
              <h2 className="text-3xl font-bold text-slate-100">{current.title}</h2>
              <p className="text-slate-300 mt-3 max-w-md mx-auto leading-relaxed">
                {current.body}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-4">
              {step > 0 && (
                <Button variant="ghost" onClick={() => setStep(step - 1)}>
                  ← Atrás
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button size="lg" onClick={() => setStep(step + 1)}>
                  {current.cta} →
                </Button>
              ) : (
                <Button size="lg" onClick={() => setDone(true)}>
                  {current.cta} →
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">
          Paso {step + 1} de {STEPS.length} · Esta pantalla solo aparece la primera vez
        </p>
      </div>
    </main>
  );
}
