# 🎯 OportunIA

> **Radar de clientes de alto valor para vendedores de servicios de AI a negocios locales.**

**Tagline:** _"Tu próximo cliente, con probabilidad real de cerrar."_

---

## ¿Qué hace?

1. **Encuentra** negocios reales en tu zona con data pública verificada (Google Places, Yelp, web).
2. **Califica** cada uno con un score 5D (Brecha Digital + Gap Operativo + Fit + Señales de Compra + Proximidad).
3. **Matchea** con los 12 servicios de AI que tu agencia vende (AI Receptionist, Speed-to-Lead, Review Booster, etc.).
4. **Genera** propuestas personalizadas listas para presentar al prospecto.

---

## Quick Start (Tier 1 — local)

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# (editar .env.local con tus API keys)

# 3. Inicializar la base de datos
npm run db:migrate
npm run db:seed-tools
npm run db:seed-services

# 4. Arrancar el servidor de desarrollo
npm run dev
# → http://localhost:3000
```

---

## Stack técnico (Tier 1)

| Capa | Tecnología |
|---|---|
| App | Next.js 15 (App Router) + TypeScript |
| UI | (Tailwind + shadcn/ui — Task 2) |
| Database | SQLite (better-sqlite3) |
| LLM | Local llama.cpp + Google Gemini Pro (toggle) |
| Tools externas | Google Places, Yelp, Tavily, Firecrawl, Brave |

**Costo mensual Tier 1:** ~$16/mes (solo Firecrawl obligatorio, el resto tiene free tier generoso).

---

## Estructura del proyecto

```
D:\NEGOCIOIA\
├── app/                  # Next.js App Router (UI + API)
├── components/           # Componentes React compartidos
├── lib/                  # Lógica de negocio
│   ├── db/              # SQLite + repositorios
│   ├── llm/             # LLM Router (local + Gemini)
│   ├── tools/           # Clientes de APIs externas
│   ├── scoring/         # Algoritmo 5D + service matcher
│   ├── proposals/       # Generador + PDF
│   └── i18n/            # Bilingüe ES/EN
├── data/                # SQLite DB + backups (gitignored)
├── docs/
│   └── superpowers/
│       ├── specs/       # Design specs
│       └── plans/       # Implementation plans
├── slides/              # PPTX pitch + assets
├── .env.example
├── package.json
└── README.md
```

---

## Las 9 secciones

1. **Dashboard** — KPIs del día, top 5 leads
2. **Radar / Search** — Búsqueda con filtros + tabla de resultados
3. **Business Profile** — Ficha completa con score 5D
4. **Generador de Propuesta** — PDF personalizado
5. **Tools & Integrations Manager** — CRUD de API keys
6. **Catálogo de Servicios AI** — Los 12 servicios editables
7. **Listas & Búsquedas Guardadas** — Filtros recurrentes
8. **CRM Ligero** — Pipeline Lead → Cerrado
9. **Settings** — Perfil, idioma, tema, dirección de origen

---

## Documentación adicional

- 📄 [Design Spec](./docs/superpowers/specs/2026-08-16-oportunia-design.md) — Visión completa, scoring, data model
- 📋 [Implementation Plan](./docs/superpowers/plans/2026-08-17-oportunia-mvp.md) — 20 tareas paso a paso
- 📊 [Pitch PPTX](./slides/output/AI_Sales_Radar_Plan.pptx) — Presentación de 13 slides

---

## Licencia

Privado — uso interno del operador de la agencia.
