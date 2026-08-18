# 🎯 OportunIA

> **Radar de clientes de alto valor para vendedores de servicios de AI a negocios locales.**

**Tagline:** _"Tu próximo cliente, con probabilidad real de cerrar."_

OportunIA encuentra negocios reales en tu zona, los califica con un score 5D, matchea con tus servicios de AI, y genera propuestas PDF listas para presentar. Construido para Inland Empire / SoCal.

---

## 🏗️ Estado del proyecto

**MVP v0.1.0 — COMPLETADO** · 20/20 tareas (100%)

| Fase | Tareas | Estado |
|---|---|---|
| 0. Foundation | Next.js 15, Tailwind, SQLite (node:sqlite), i18n ES/EN | ✅ |
| 1. Tools Manager | CRUD de 6 APIs, health-checks, LLM Router (local + Gemini) | ✅ |
| 2. Radar | Google Places + Yelp + Brave + Tavily + Firecrawl + Signals | ✅ |
| 3. Scoring 5D | Algoritmo multi-dimensional + Service Matcher | ✅ |
| 4. Profile + Talking Points | UI completa con score 5D + LLM talking points | ✅ |
| 5. Proposal | Generador JSON + PDF multi-página con jspdf | ✅ |
| 6. Catalog + Settings | Catálogo editable de 12 servicios + Settings + Onboarding | ✅ |
| 7. Polish | Listas + CRM Kanban + E2E test | ✅ |

**Tests:** 24/24 E2E passing · 15/15 scoring unit tests passing

---

## 🚀 Quick Start

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus API keys (ver "Setup de cuentas" abajo)

# 3. Inicializar la base de datos
npm run db:migrate
npm run db:seed-tools        # 6 herramientas seedeadas
npm run db:seed-services     # 12 servicios AI seedeados

# 4. Arrancar
npm run dev
# → http://localhost:3000
```

Para correr los tests:
```bash
node --experimental-sqlite --import tsx tests/e2e/oportunia.ts
npx tsx --import tsx tests/unit/scoring.test.ts
```

---

## 🗺️ Las 9 secciones

| Ruta | Qué hace |
|---|---|
| `/` | Landing con toggle ES/EN |
| `/radar` | Buscar negocios reales (Google Places) con filtros |
| `/radar/[id]` | Ficha del negocio: score 5D, servicios matcheados, talking points con IA |
| `/proposals/[id]` | Propuesta editable + descarga PDF |
| `/tools` | CRUD de 6 APIs externas + health-checks |
| `/services` | Catálogo editable de los 12 servicios AI |
| `/settings` | Empresa, dirección de origen, LLM default |
| `/onboarding` | Tour de bienvenida de 3 pasos |
| `/lists` + `/lists/[id]` | Listas temáticas con export CSV |
| `/crm` | Pipeline kanban: Lead → Contactado → Reunión → Propuesta → Cerrado |

---

## 🧮 Algoritmo de Scoring 5D

Score 0-100 con 5 dimensiones:

| Letra | Dimensión | Peso | Qué mide |
|---|---|---|---|
| A | **Brecha Digital** | 25% | Atraso en web/chat/24-7/social/booking |
| B | **Gap Operativo** | 25% | Sin 24/7, no responde leads, sin contacto |
| C | **Fit del Negocio** | 25% | Sector de alto ticket + 24/7 emergency |
| D | **Señales de Compra** | 15% | Empleados, multi-sede, reseñas recientes, ads |
| E | **Proximidad** | 10% | Distancia desde 7940 Vandewater St, Eastvale |

**Tiers:**
- 🔥 80-100: Cerrar esta semana
- ⚡ 60-79: Lead caliente
- 🌱 40-59: Nurture 14 días
- ❌ <40: Skip

---

## 🔌 Setup de cuentas Tier 1 (~$16/mes)

| Servicio | Costo | Para qué |
|---|---|---|
| **Google Places API (New)** | Free (5K-10K/mes) | Encontrar negocios |
| **Yelp Fusion** | Free (5K/día) | Reseñas adicionales |
| **Tavily** | Free (1K/mes) | Búsqueda web + extracción |
| **Firecrawl** | $16/mes | Crawling de sitios web |
| **Brave Search** | Free (2K/mes) | Búsqueda alternativa |
| **Gemini Pro API** | $0 (cuenta Pro) | LLM fallback |
| **llama.cpp local** | $0 (ya corriendo) | LLM principal |

URLs de signup están en `.env.example`.

---

## 🏗️ Arquitectura

```
Next.js 15 (App Router) · TypeScript · Tailwind · shadcn-style UI
├── Frontend + Backend (single deploy local)
├── SQLite via node:sqlite (native Node 22+)
├── LLM Router: local (Qwen3.5 4B) ↔ Gemini Pro
└── External APIs: Google Places, Yelp, Tavily, Firecrawl, Brave, Gemini
```

**Flujo de un lead:**
1. `/radar` → Google Places busca negocios reales
2. Cada negocio se guarda en SQLite con datos verificados (sin alucinar)
3. `/radar/[id]` → 5D score + servicios AI matcheados
4. "Generar Talking Points" → LLM produce 3-5 bullets persuasivos
5. "Generar Propuesta" → PDF multi-página con ROI estimado
6. `/crm` → Mover entre stages del pipeline
7. `/lists` → Agrupar en listas temáticas + export CSV

---

## 📂 Estructura

```
D:\NEGOCIOIA\
├── app/                      # Next.js routes (10 páginas + APIs)
│   ├── api/                  # 17 endpoints REST
│   ├── radar/                # Búsqueda + ficha
│   ├── proposals/            # Generador + PDF
│   ├── services/             # Catálogo CRUD
│   ├── tools/                # Tools Manager
│   ├── settings/             # Settings
│   ├── lists/                # Listas
│   ├── crm/                  # Kanban
│   └── onboarding/           # Tour 3 pasos
├── components/               # Componentes compartidos
│   ├── ui/                   # shadcn-style (button, card, dialog, input, label)
│   ├── business/             # Business header
│   ├── scoring/              # Score badge + breakdown
│   └── layout/               # Language toggle
├── lib/                      # Lógica de negocio
│   ├── db/                   # SQLite + schema + repos
│   ├── llm/                  # Router + clients + prompts
│   ├── tools/                # Clientes de APIs externas
│   ├── scoring/              # Algoritmo 5D + signals + matcher
│   ├── proposals/            # Generador + PDF
│   ├── i18n/                 # Bilingüe ES/EN
│   └── utils/                # Distance (Haversine)
├── tests/
│   ├── unit/scoring.test.ts  # 15 tests
│   └── e2e/oportunia.ts      # 24 tests
├── docs/
│   └── superpowers/
│       ├── specs/            # Design spec
│       └── plans/            # Implementation plan (20 tasks)
├── slides/                   # PPTX pitch (13 slides)
├── data/                     # SQLite (gitignored)
├── .env.example
└── package.json
```

---

## 🧪 Tests

```bash
# E2E test (24 checks)
node --experimental-sqlite --import tsx tests/e2e/oportunia.ts

# Unit test (15 checks)
npx tsx --import tsx tests/unit/scoring.test.ts
```

Coverage:
- DB initialization (13 tablas)
- Tools + Services seeding
- Settings round-trip
- Scoring 5D (HVAC high-ticket → warm/hot)
- Service matching (Receptionist matched for 24/7 HVAC)
- Proposal generation (services, ROI, next steps)
- PDF generation (real bytes con %PDF magic)

---

## 📋 Scripts npm

| Script | Qué hace |
|---|---|
| `npm run dev` | Dev server con experimental-sqlite |
| `npm run build` | Build de producción |
| `npm run start` | Iniciar build de prod |
| `npm run db:migrate` | Crear/actualizar schema |
| `npm run db:seed-tools` | Seedear 6 tools |
| `npm run db:seed-services` | Seedear 12 servicios |
| `npm run typecheck` | TypeScript check |

---

## 💰 Costos operacionales

- **Tier 1 (local, actual):** $16/mes (solo Firecrawl)
- **Tier 2 (cloud, cuando monetices):** $200-500/mes
- **Tier 3 (SaaS):** escala con Supabase + Stripe

---

## 🚀 Roadmap Tier 2 (cuando monetices)

- Multi-tenant con Supabase
- Auth con Supabase Auth
- Billing con Stripe
- Landing page pública
- Email transaccional (Resend)
- Scraping a escala (Apify)
- Cache layer (Upstash Redis)
- Premium LLM tier (Claude)

---

## 📄 Licencia

Privado — uso interno del operador de la agencia.
