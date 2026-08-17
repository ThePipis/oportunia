import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-radial">
      <div className="text-center space-y-6 max-w-4xl">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-sky-500 shadow-2xl shadow-orange-500/30">
          <span className="text-5xl">◎</span>
        </div>

        {/* Title */}
        <h1 className="text-6xl md:text-7xl font-bold tracking-tight font-display">
          <span className="text-gradient-brand">OportunIA</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-slate-300 max-w-2xl mx-auto">
          Radar de clientes de alto valor para vendedores de servicios de AI
        </p>

        {/* Tagline */}
        <p className="text-sm text-sky-400 italic">
          Tu próximo cliente, con probabilidad real de cerrar.
        </p>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
          <Card className="text-left card-glass-hover">
            <CardHeader>
              <div className="text-3xl">🎯</div>
              <CardTitle className="text-sky-300 text-base">Encuentra</CardTitle>
              <CardDescription>
                Negocios reales en tu zona con data pública verificada de Google Places, Yelp y web.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-left card-glass-hover">
            <CardHeader>
              <div className="text-3xl">⚡</div>
              <CardTitle className="text-orange-300 text-base">Califica</CardTitle>
              <CardDescription>
                Score 5D (Brecha Digital + Gap Operativo + Fit + Compra + Proximidad) que predice probabilidad de cierre.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-left card-glass-hover">
            <CardHeader>
              <div className="text-3xl">🚀</div>
              <CardTitle className="text-emerald-300 text-base">Propón</CardTitle>
              <CardDescription>
                Generador automático de propuestas personalizadas. PDF listo para imprimir o enviar.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-8">
          <Button size="lg">Empezar a buscar prospectos</Button>
          <Button variant="secondary" size="lg">
            Configurar herramientas
          </Button>
        </div>

        {/* Phase 0 indicator */}
        <div className="pt-12 flex items-center justify-center gap-2 text-xs text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
          <span>
            <strong className="text-slate-400">Phase 0 · Foundation</strong> · Tailwind + shadcn/ui
            listos
          </span>
        </div>

        <div className="text-xs text-slate-600">v0.1.0 · D:\NEGOCIOIA</div>
      </div>
    </main>
  );
}
