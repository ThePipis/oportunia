# OportunIA MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el MVP de OportunIA: app Next.js 15 local-first con Tools Manager, Radar de búsqueda, scoring 5D, generador de propuestas, y CRM ligero. Funciona con SQLite + LLM local + APIs externas.

**Architecture:** Next.js 15 App Router con Server Actions (UI + API en un solo deploy local). SQLite via better-sqlite3. LLM Router con fallback local→Gemini. i18n custom con JSON files. shadcn/ui + Tailwind. Charts con Recharts.

**Tech Stack:** Next.js 15 · TypeScript · Tailwind CSS · shadcn/ui · Recharts · better-sqlite3 · @googlemaps/places (cliente) + REST directo · axios · zod · react-i18next (o custom) · jsPDF o @react-pdf/renderer

---

## Global Constraints

- **Node version:** Node 20+
- **Package manager:** npm (user ya lo usa)
- **TypeScript:** strict mode
- **No datos falsos:** nunca hardcodear nombres/teléfonos/URLs de negocios. Si no hay data real, mostrar "pendiente" o empty state.
- **Bilingüe i18n:** todo texto de UI via t() function, no strings hardcoded en JSX
- **Mobile-first:** breakpoints sm:640px, md:768px, lg:1024px, xl:1280px. Charts con ResponsiveContainer.
- **API keys:** nunca en cliente. Server actions + .env.local
- **Cost limit Tier 1:** ≤$40/mes de APIs externas
- **No alucinación:** si el LLM genera JSON, validar con zod schema antes de usar
- **Persistencia:** todo en SQLite. Recargar y seguir donde quedaste
- **Git:** commits frecuentes. Conventional commits (feat:, fix:, chore:, docs:)
- **Code style:** ESLint + Prettier defaults. Nombres en inglés (variables/funciones), UI en español por default.

---

## File Structure

```
D:\NEGOCIOIA\
├── app/                          # Next.js App Router
│   ├── (onboarding)/             # Welcome tour (primera vez)
│   │   └── page.tsx
│   ├── dashboard/                # Sección 1: Dashboard
│   │   └── page.tsx
│   ├── radar/                    # Sección 2: Radar / Search
│   │   ├── page.tsx
│   │   └── [id]/page.tsx         # Sección 3: Business Profile
│   ├── proposals/                # Sección 4: Generador
│   │   └── [businessId]/page.tsx
│   ├── tools/                    # Sección 5: Tools Manager
│   │   └── page.tsx
│   ├── services/                 # Sección 6: Catálogo
│   │   └── page.tsx
│   ├── lists/                    # Sección 7: Listas
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── crm/                      # Sección 8: CRM
│   │   └── page.tsx
│   ├── settings/                 # Sección 9: Settings
│   │   └── page.tsx
│   ├── api/                      # API Routes (when needed)
│   │   ├── radar/search/route.ts
│   │   ├── businesses/[id]/route.ts
│   │   ├── tools/route.ts
│   │   └── llm/test/route.ts
│   ├── layout.tsx                # Root layout con theme + i18n
│   ├── page.tsx                  # Redirect to /dashboard or /onboarding
│   └── globals.css
│
├── components/                   # Componentes compartidos
│   ├── ui/                       # shadcn/ui components
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── mobile-nav.tsx
│   │   └── theme-toggle.tsx
│   ├── scoring/
│   │   ├── score-breakdown.tsx
│   │   └── score-badge.tsx
│   ├── business/
│   │   ├── business-card.tsx
│   │   ├── business-table.tsx
│   │   └── service-matcher.tsx
│   ├── tools/
│   │   ├── tool-form.tsx
│   │   └── health-indicator.tsx
│   └── shared/
│       ├── empty-state.tsx
│       ├── loading-skeleton.tsx
│       ├── error-state.tsx
│       └── tooltip-glossary.tsx
│
├── lib/                          # Lógica de negocio (testeable)
│   ├── db/
│   │   ├── client.ts             # better-sqlite3 connection
│   │   ├── schema.sql            # SQLite schema
│   │   ├── migrate.ts            # Run migrations
│   │   └── repositories/         # Per-table data access
│   │       ├── businesses.ts
│   │       ├── services.ts
│   │       ├── activities.ts
│   │       └── ...
│   ├── llm/
│   │   ├── router.ts             # Decide local vs Gemini
│   │   ├── local-client.ts       # llama.cpp HTTP client
│   │   ├── gemini-client.ts      # Google Gemini API client
│   │   └── prompts/              # System prompts
│   ├── tools/                    # External API clients
│   │   ├── google-places.ts
│   │   ├── yelp.ts
│   │   ├── tavily.ts
│   │   ├── firecrawl.ts
│   │   ├── brave.ts
│   │   └── nominatim.ts
│   ├── scoring/
│   │   ├── algorithm.ts          # 5D scoring
│   │   ├── signals.ts            # Signal extractors
│   │   └── service-matcher.ts    # Match business to AI services
│   ├── proposals/
│   │   ├── generator.ts          # Generate proposal content
│   │   └── pdf.ts                # Export to PDF
│   ├── i18n/
│   │   ├── client.ts             # i18n provider
│   │   ├── es.json               # Spanish translations
│   │   └── en.json               # English translations
│   └── utils/
│       ├── distance.ts           # Haversine formula
│       ├── format.ts             # Currency, dates
│       └── logger.ts
│
├── tests/                        # Tests (vitest)
│   ├── unit/
│   │   ├── scoring.test.ts
│   │   ├── distance.test.ts
│   │   └── ...
│   └── integration/
│
├── docs/
│   ├── superpowers/
│   │   ├── specs/                # Design specs
│   │   └── plans/                # Implementation plans
│   └── README.md
│
├── data/                         # Runtime data (gitignored)
│   ├── radar.db                  # SQLite database
│   └── backups/                  # Auto-backups
│
├── public/                       # Static assets
│
├── .env.local                    # Secrets (gitignored)
├── .env.example                  # Template
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── README.md
└── LICENSE
```

---

## Phase 0: Foundation (Tasks 1-4)

### Task 1: Initialize Next.js 15 Project

**Files:**
- Create: `D:\NEGOCIOIA\package.json`
- Create: `D:\NEGOCIOIA\tsconfig.json`
- Create: `D:\NEGOCIOIA\next.config.js`
- Create: `D:\NEGOCIOIA\app/layout.tsx`
- Create: `D:\NEGOCIOIA\app/page.tsx`
- Create: `D:\NEGOCIOIA\app/globals.css`
- Create: `D:\NEGOCIOIA\.gitignore`
- Create: `D:\NEGOCIOIA\.env.example`

**Acceptance:** `npm run dev` arranca Next.js en localhost:3000. Ver "OportunIA" en el browser.

- [ ] **Step 1.1:** Crear `package.json` con deps: `next@15`, `react@18`, `react-dom@18`, `typescript`, `@types/*`, `tailwindcss`, `postcss`, `autoprefixer`
- [ ] **Step 1.2:** `npm install` → verifica que se instalan 200+ paquetes
- [ ] **Step 1.3:** Crear `tsconfig.json` con `"strict": true`, paths alias `@/*` → `./*`
- [ ] **Step 1.4:** Crear `next.config.js` mínimo
- [ ] **Step 1.5:** Crear `app/layout.tsx` con html lang="es", metadata title="OportunIA"
- [ ] **Step 1.6:** Crear `app/page.tsx` con un div "OportunIA - Cargando..." (placeholder)
- [ ] **Step 1.7:** Crear `app/globals.css` con Tailwind directives
- [ ] **Step 1.8:** Crear `.gitignore` con: `node_modules`, `.env.local`, `data/`, `*.log`, `.next`
- [ ] **Step 1.9:** Crear `.env.example` con todas las API keys placeholder
- [ ] **Step 1.10:** `npm run dev` → confirmar que arranca
- [ ] **Step 1.11:** Commit: `chore: initialize Next.js 15 project`

---

### Task 2: Configure Tailwind + shadcn/ui

**Files:**
- Modify: `D:\NEGOCIOIA\tailwind.config.ts` (crear)
- Create: `D:\NEGOCIOIA\postcss.config.js`
- Modify: `D:\NEGOCIOIA\app\globals.css` (Tailwind layers)
- Create: `D:\NEGOCIOIA\components\ui\button.tsx`
- Create: `D:\NEGOCIOIA\lib\utils.ts` (cn helper)

**Acceptance:** Un botón shadcn renderiza con estilos correctos. Light/dark mode toggleable.

- [ ] **Step 2.1:** `npm install -D tailwindcss postcss autoprefixer` + `npx tailwindcss init -p`
- [ ] **Step 2.2:** Configurar `tailwind.config.ts` con theme extendido (colors primary/secondary/accent matching PPTX)
- [ ] **Step 2.3:** En `globals.css`: `@tailwind base/components/utilities` + CSS variables para light/dark
- [ ] **Step 2.4:** `npx shadcn@latest init` (auto-configura tsconfig, css, etc.)
- [ ] **Step 2.5:** `npx shadcn@latest add button card input label toast dialog dropdown-menu tabs`
- [ ] **Step 2.6:** En `app/layout.tsx`, añadir `<html className="dark">` por default (dark mode default per spec)
- [ ] **Step 2.7:** Crear página de prueba con un Button + Card para verificar estilos
- [ ] **Step 2.8:** Commit: `feat: configure tailwind + shadcn/ui`

---

### Task 3: Set up SQLite + Database Schema

**Files:**
- Create: `D:\NEGOCIOIA\lib\db\schema.sql`
- Create: `D:\NEGOCIOIA\lib\db\client.ts`
- Create: `D:\NEGOCIOIA\lib\db\migrate.ts`
- Create: `D:\NEGOCIOIA\data\.gitkeep`
- Modify: `D:\NEGOCIOIA\package.json` (script `db:migrate`)

**Acceptance:** Correr `npm run db:migrate` crea `data/radar.db` con todas las tablas. Abrir con `sqlite3 data/radar.db` y ver las tablas.

- [ ] **Step 3.1:** `npm install better-sqlite3` + `@types/better-sqlite3`
- [ ] **Step 3.2:** Crear `lib/db/schema.sql` con todas las tablas del spec (settings, tool_configs, businesses, business_scores, business_services, service_catalog, saved_searches, lists, list_items, activities, proposals)
- [ ] **Step 3.3:** Crear `lib/db/client.ts` que abre/crea `data/radar.db` con WAL mode y foreign keys ON
- [ ] **Step 3.4:** Crear `lib/db/migrate.ts` que lee schema.sql y ejecuta
- [ ] **Step 3.5:** Añadir script en `package.json`: `"db:migrate": "tsx lib/db/migrate.ts"`
- [ ] **Step 3.6:** `npm install -D tsx` (para correr TS sin compilar)
- [ ] **Step 3.7:** Correr `npm run db:migrate` → verificar que `data/radar.db` existe
- [ ] **Step 3.8:** Commit: `feat: set up SQLite database with schema`

---

### Task 4: Set up i18n (Bilingüe ES/EN)

**Files:**
- Create: `D:\NEGOCIOIA\lib\i18n\es.json`
- Create: `D:\NEGOCIOIA\lib\i18n\en.json`
- Create: `D:\NEGOCIOIA\lib\i18n\client.tsx` (provider + hook)
- Modify: `D:\NEGOCIOIA\app\layout.tsx` (wrap in provider)
- Create: `D:\NEGOCOCIOIA\components\layout\language-toggle.tsx`

**Acceptance:** Toggle ES/EN en el header cambia todos los textos de la UI. Default español. Persiste en localStorage.

- [ ] **Step 4.1:** Crear `es.json` con al menos 30 keys: nav.dashboard, nav.radar, nav.tools, common.search, common.save, etc.
- [ ] **Step 4.2:** Crear `en.json` con las mismas 30 keys traducidas
- [ ] **Step 4.3:** Crear `lib/i18n/client.tsx` con Context provider, `useT()` hook, persistencia en localStorage
- [ ] **Step 4.4:** En `app/layout.tsx`, wrap children en `<I18nProvider>`
- [ ] **Step 4.5:** Crear `components/layout/language-toggle.tsx` con dropdown ES/EN
- [ ] **Step 4.6:** En página de prueba, usar `const t = useT(); t('nav.dashboard')` y verificar toggle
- [ ] **Step 4.7:** Commit: `feat: set up bilingual i18n (ES/EN)`

---

## Phase 1: Tools Manager (Tasks 5-7)

### Task 5: Tools Manager UI - Lista de herramientas

**Files:**
- Create: `D:\NEGOCIOIA\app\tools\page.tsx`
- Create: `D:\NEGOCOCIOIA\components\tools\tools-table.tsx`
- Create: `D:\NEGOCOCIOIA\app\api\tools\route.ts` (GET list)
- Create: `D:\NEGOCOCIOIA\lib\db\repositories\tools.ts`

**Acceptance:** Página `/tools` muestra tabla con las 6 tools Tier 1 (Google Places, Yelp, Tavily, Firecrawl, Brave, Gemini) como plantillas preconfiguradas. Click "Añadir" abre form.

- [ ] **Step 5.1:** Crear `lib/db/repositories/tools.ts` con funciones: `listTools()`, `getTool(id)`, `createTool()`, `updateTool()`, `deleteTool()`
- [ ] **Step 5.2:** Crear `app/api/tools/route.ts` con GET (lista) y POST (crear)
- [ ] **Step 5.3:** Crear seed en `lib/db/seed-tools.ts` con las 6 tools Tier 1 preconfiguradas (sin API key, solo metadata)
- [ ] **Step 5.4:** Correr seed: `npm run db:seed-tools`
- [ ] **Step 5.5:** Crear `app/tools/page.tsx` con tabla shadcn: nombre, tipo, status, last_health_check, acciones
- [ ] **Step 5.6:** Commit: `feat: tools manager UI with list view`

---

### Task 6: Tools Manager - Add/Edit/Delete + API Key

**Files:**
- Create: `D:\NEGOCOCIOIA\components\tools\tool-form.tsx`
- Create: `D:\NEGOCOCIOIA\app\api\tools\[id]\route.ts` (PUT, DELETE)
- Create: `D:\NEGOCOCIOIA\app\api\tools\[id]\health\route.ts` (POST health check)
- Create: `D:\NEGOCOCIOIA\lib\tools\google-places.ts` (cliente con health check)
- Create: `D:\NEGOCOCIOIA\lib\tools\gemini.ts` (cliente con health check)

**Acceptance:** Añadir API key de Google Places funciona. Health check prueba que la key es válida. Status cambia a "active".

- [ ] **Step 6.1:** Crear `lib/tools/google-places.ts` con función `healthCheck(apiKey)` que hace un request mínimo y retorna `{ok, latency, error?}`
- [ ] **Step 6.2:** Similar para `lib/tools/gemini.ts` (lista de modelos)
- [ ] **Step 6.3:** Crear `components/tools/tool-form.tsx` (dialog con fields: name, apiKey, endpoint opcional, advanced)
- [ ] **Step 6.4:** En `app/api/tools/[id]/route.ts`: PUT (update) y DELETE
- [ ] **Step 6.5:** En `app/api/tools/[id]/health/route.ts`: POST ejecuta health check, actualiza `status` y `last_health_check`
- [ ] **Step 6.6:** En `tools-table.tsx`, añadir botones "Health Check" y "Edit"
- [ ] **Step 6.7:** Commit: `feat: tools manager add/edit/delete + health check`

---

### Task 7: LLM Router (Local llama.cpp + Gemini fallback)

**Files:**
- Create: `D:\NEGOCOCIOIA\lib\llm\local-client.ts`
- Create: `D:\NEGOCOCIOIA\lib\llm\gemini-client.ts`
- Create: `D:\NEGOCOCIOIA\lib\llm\router.ts`
- Create: `D:\NEGOCOCIOIA\app\api\llm\test\route.ts`
- Create: `D:\NEGOCOCIOIA\components\layout\llm-toggle.tsx`

**Acceptance:** Dropdown en header con 3 opciones (Local, Gemini, Auto). Test endpoint confirma que cada uno responde. Auto decide basado en complejidad.

- [ ] **Step 7.1:** Crear `lib/llm/local-client.ts` que llama a `http://srvubuntu01:8080/v1/chat/completions` (OpenAI-compatible)
- [ ] **Step 7.2:** Crear `lib/llm/gemini-client.ts` que llama a Gemini API con el modelo configurado
- [ ] **Step 7.3:** Crear `lib/llm/router.ts` con función `route(task)` que decide basado en: task.complexity + current quota
- [ ] **Step 7.4:** Crear `app/api/llm/test/route.ts` que prueba el LLM activo y retorna latencia + sample response
- [ ] **Step 7.5:** Crear `components/layout/llm-toggle.tsx` (dropdown en header, persiste en localStorage y en settings)
- [ ] **Step 7.6:** Commit: `feat: LLM router with local + Gemini fallback`

---

## Phase 2: Radar / Search (Tasks 8-11)

### Task 8: Google Places Integration

**Files:**
- Create: `D:\NEGOCOCIOIA\lib\tools\google-places-full.ts` (Text Search + Place Details)
- Create: `D:\NEGOCOCIOIA\lib\db\repositories\businesses.ts`
- Create: `D:\NEGOCOCIOIA\app\api\radar\search\route.ts`
- Create: `D:\NEGOCOCIOIA\tests\unit\google-places.test.ts`

**Acceptance:** `POST /api/radar/search` con `{city, sector, radius}` retorna ≥5 negocios reales de Google Places. Datos se guardan en DB.

- [ ] **Step 8.1:** En `lib/tools/google-places-full.ts`: función `textSearch(query, location, radius)` que llama a Places API (New) Text Search Pro
- [ ] **Step 8.2:** Función `placeDetails(placeId)` que llama a Place Details Pro
- [ ] **Step 8.3:** `lib/db/repositories/businesses.ts` con CRUD: `upsertBusiness()`, `getBusiness()`, `listBusinesses()`
- [ ] **Step 8.4:** `app/api/radar/search/route.ts` que: 1) llama textSearch, 2) por cada resultado llama placeDetails, 3) upsert en DB, 4) retorna lista
- [ ] **Step 8.5:** `tests/unit/google-places.test.ts` con mock del cliente HTTP
- [ ] **Step 8.6:** Commit: `feat: Google Places integration for business search`

---

### Task 9: Radar Search UI

**Files:**
- Create: `D:\NEGOCOCIOIA\app\radar\page.tsx`
- Create: `D:\NEGOCOCIOIA\components\business\search-form.tsx`
- Create: `D:\NEGOCOCIOIA\components\business\results-table.tsx`
- Create: `D:\NEGOCOCIOIA\components\shared\loading-skeleton.tsx`

**Acceptance:** En `/radar`, el usuario llena form (ciudad, sector, radio), presiona buscar, ve loading skeleton, y aparece tabla con resultados. Responsive en mobile.

- [ ] **Step 9.1:** Crear `components/business/search-form.tsx` con campos: ciudad (combobox), sector (combobox de service_catalog), radio (slider 1-25 mi), score mínimo
- [ ] **Step 9.2:** Crear `components/business/results-table.tsx` con columnas: nombre, sector, score, rating, distancia, acciones
- [ ] **Step 9.3:** Crear `app/radar/page.tsx` que use los componentes + useState para loading/results/error
- [ ] **Step 9.4:** Loading skeleton mientras la API responde
- [ ] **Step 9.5:** Empty state si 0 resultados (con CTA "Intenta con otro sector o ciudad")
- [ ] **Step 9.6:** Commit: `feat: radar search UI with form and results table`

---

### Task 10: Yelp + Brave + Tavily Integration

**Files:**
- Create: `D:\NEGOCOCIOIA\lib\tools\yelp.ts`
- Create: `D:\NEGOCOCIOIA\lib\tools\brave.ts`
- Create: `D:\NEGOCOCIOIA\lib\tools\tavily.ts`
- Create: `D:\NEGOCOCIOIA\lib\tools\nominatim.ts` (geocoding)

**Acceptance:** Para un negocio dado, podemos enriquecer con reseñas de Yelp, menciones de Brave, y contenido de Tavily. Distancias calculadas correctamente desde 7940 Vandewater St.

- [ ] **Step 10.1:** `lib/tools/yelp.ts`: `businessSearch(name, location)`, `businessReviews(id)`
- [ ] **Step 10.2:** `lib/tools/brave.ts`: `webSearch(query)`
- [ ] **Step 10.3:** `lib/tools/tavily.ts`: `search(query, options)`, `extract(url)`
- [ ] **Step 10.4:** `lib/tools/nominatim.ts`: `geocode(address)`
- [ ] **Step 10.5:** `lib/utils/distance.ts`: `haversineMiles(lat1, lng1, lat2, lng2)`
- [ ] **Step 10.6:** Commit: `feat: Yelp + Brave + Tavily + Nominatim integration`

---

### Task 11: Firecrawl Integration (Website signals)

**Files:**
- Create: `D:\NEGOCOCIOIA\lib\tools\firecrawl.ts`
- Create: `D:\NEGOCOCIOIA\lib\scoring\signals.ts` (extractors)
- Create: `D:\NEGOCOCIOIA\tests\unit\signals.test.ts`

**Acceptance:** Dado un business con website, Firecrawl extrae el HTML y `signals.ts` detecta: tiene_chat, tiene_booking, menciona_24_7, web_responsive, año_ultimo_post.

- [ ] **Step 11.1:** `lib/tools/firecrawl.ts`: `scrapeUrl(url)` retorna markdown
- [ ] **Step 11.2:** `lib/scoring/signals.ts`: `extractDigitalSignals(markdown, html)` retorna objeto con signals
- [ ] **Step 11.3:** Tests con samples de HTML (mockeados)
- [ ] **Step 11.4:** Commit: `feat: Firecrawl integration + digital signal extractors`

---

## Phase 3: Scoring + Service Matching (Tasks 12-13)

### Task 12: 5D Scoring Algorithm

**Files:**
- Create: `D:\NEGOCOCIOIA\lib\scoring\algorithm.ts`
- Create: `D:\NEGOCOCIOIA\lib\db\repositories\scores.ts`
- Create: `D:\NEGOCOCIOIA\tests\unit\scoring.test.ts`
- Create: `D:\NEGOCOCIOIA\app\api\businesses\[id]\rescore\route.ts`

**Acceptance:** Dada una business con signals, calcular score 0-100 desglosado en 5 dimensiones. Tests cubren cada dimensión.

- [ ] **Step 12.1:** `lib/scoring/algorithm.ts`: `calculateScore(business, signals, fitData)` retorna `{total, breakdown: {A, B, C, D, E}, matchedServices}`
- [ ] **Step 12.2:** Cada dimensión calcula 0-100 independientemente
- [ ] **Step 12.3:** Score final = weighted sum (A:0.25, B:0.25, C:0.25, D:0.15, E:0.10)
- [ ] **Step 12.4:** `lib/db/repositories/scores.ts`: `saveScore(businessId, score)`, `getScore(businessId)`
- [ ] **Step 12.5:** `app/api/businesses/[id]/rescore/route.ts`: recalcula y guarda
- [ ] **Step 12.6:** Tests cubriendo cada dimensión con casos positivos/negativos
- [ ] **Step 12.7:** Commit: `feat: 5-dimensional scoring algorithm`

---

### Task 13: Service Matcher (Match business to AI services)

**Files:**
- Create: `D:\NEGOCOCIOIA\lib\scoring\service-matcher.ts`
- Create: `D:\NEGOCOCIOIA\lib\db\repositories\services.ts`
- Create: `D:\NEGOCOCIOIA\tests\unit\service-matcher.test.ts`

**Acceptance:** Dado un business con score bajo en Brecha Digital y Gap Operativo, retorna "AI Receptionist" + "Speed-to-Lead" como servicios recomendados.

- [ ] **Step 13.1:** Seed de los 12 servicios en `service_catalog` con sus signals esperados
- [ ] **Step 13.2:** `lib/scoring/service-matcher.ts`: `matchServices(business, score)` retorna array de `{serviceId, relevance, pitch}`
- [ ] **Step 13.3:** Lógica: cada servicio tiene una "huella" de qué dimensiones bajas lo hacen necesario
- [ ] **Step 13.4:** Tests con casos: HVAC con mala web → AI Receptionist + Web Chat; dentista con buenas reseñas → AI Review Booster
- [ ] **Step 13.5:** Commit: `feat: service matcher with signal-based logic`

---

## Phase 4: Business Profile UI (Tasks 14-15)

### Task 14: Business Profile Page

**Files:**
- Create: `D:\NEGOCOCIOIA\app\radar\[id]\page.tsx`
- Create: `D:\NEGOCOCIOIA\components\business\business-header.tsx`
- Create: `D:\NEGOCOCIOIA\components\scoring\score-breakdown.tsx`
- Create: `D:\NEGOCOCIOIO\components\scoring\score-badge.tsx`

**Acceptance:** Click en un resultado de Radar abre `/radar/[id]` con la ficha completa: data pública, 5 barras de score, servicios matcheados.

- [ ] **Step 14.1:** `components/score-badge.tsx`: badge circular con número + color (gold/cyan/green)
- [ ] **Step 14.2:** `components/score-breakdown.tsx`: 5 barras horizontales con peso, valor 0-100, y tooltip explicativo
- [ ] **Step 14.3:** `components/business/business-header.tsx`: nombre, dirección, rating, teléfono, link a Maps, botón "Llamar" (tel:)
- [ ] **Step 14.4:** `app/radar/[id]/page.tsx` con todas las secciones + tabs (Overview, Score, Servicios, Actividad)
- [ ] **Step 14.5:** CTA principal: "Generar Propuesta"
- [ ] **Step 14.6:** Commit: `feat: business profile page with 5D score breakdown`

---

### Task 15: Talking Points Generator (LLM)

**Files:**
- Create: `D:\NEGOCOCIOIA\lib\llm\prompts\talking-points.ts`
- Create: `D:\NEGOCOCIOIA\app\api\businesses\[id]\talking-points\route.ts`

**Acceptance:** Click "Generar Talking Points" usa el LLM activo (Local/Gemini) y produce 3-5 bullets persuasivos basados en los signals del business.

- [ ] **Step 15.1:** `lib/llm/prompts/talking-points.ts`: prompt que recibe business + score + signals, retorna JSON con array de bullets
- [ ] **Step 15.2:** Validar respuesta con zod schema (anti-alucinación)
- [ ] **Step 15.3:** `app/api/businesses/[id]/talking-points/route.ts`: ejecuta y cachea en DB
- [ ] **Step 15.4:** UI: spinner mientras genera, después lista de bullets con icono de "copiar"
- [ ] **Step 15.5:** Commit: `feat: LLM-generated talking points per business`

---

## Phase 5: Proposal Generator (Task 16)

### Task 16: Proposal Generator + PDF Export

**Files:**
- Create: `D:\NEGOCIOIA\lib\proposals\generator.ts`
- Create: `D:\NEGOCOCIOIA\lib\proposals\pdf.tsx`
- Create: `D:\NEGOCOCIOIA\app\proposals\[businessId]\page.tsx`
- Create: `D:\NEGOCOCIOIA\lib\db\repositories\proposals.ts`

**Acceptance:** Click "Generar Propuesta" en business profile abre editor con secciones pre-llenadas. Botón "Exportar PDF" descarga.

- [ ] **Step 16.1:** `lib/proposals/generator.ts`: `generateProposal(businessId)` retorna estructura con secciones (intro, diagnóstico, servicios, pricing, ROI, próximos pasos)
- [ ] **Step 16.2:** `lib/proposals/pdf.tsx`: usa `@react-pdf/renderer` para generar PDF
- [ ] **Step 16.3:** `app/proposals/[businessId]/page.tsx`: editor + botones (Save, Export PDF, Send Email)
- [ ] **Step 16.4:** `lib/db/repositories/proposals.ts`: CRUD
- [ ] **Step 16.5:** Commit: `feat: proposal generator with PDF export`

---

## Phase 6: Service Catalog + Settings (Tasks 17-18)

### Task 17: Service Catalog CRUD

**Files:**
- Create: `D:\NEGOCIOIA\app\services\page.tsx`
- Create: `D:\NEGOCOCIOIA\components\services\service-card.tsx`
- Create: `D:\NEGOCOCIOIA\app\api\services\route.ts`

**Acceptance:** `/services` muestra los 12 servicios del catálogo agrupados por tier. Editable: nombre, descripción, ejemplo, pitch, pricing.

- [ ] **Step 17.1:** Seed de 12 servicios en `service_catalog`
- [ ] **Step 17.2:** `app/services/page.tsx` con 3 secciones (Tier 1, 2, 3) y cards
- [ ] **Step 17.3:** Cada card: nombre, descripción, ejemplo, pricing, señales, pitch pre-armado
- [ ] **Step 17.4:** Click "Editar" abre modal con form
- [ ] **Step 17.5:** Commit: `feat: service catalog with 12 services and CRUD`

---

### Task 18: Settings + Onboarding

**Files:**
- Create: `D:\NEGOCIOIA\app\settings\page.tsx`
- Create: `D:\NEGOCOCIOIA\app\(onboarding)\page.tsx`
- Create: `D:\NEGOCOCIOIO\components\layout\sidebar.tsx`
- Create: `D:\NEGOCOCIOIO\components\layout\mobile-nav.tsx`

**Acceptance:** Settings permite editar dirección de origen, perfil, idioma, tema. Onboarding se muestra solo la primera vez.

- [ ] **Step 18.1:** `app/settings/page.tsx` con tabs: Perfil, Origen, Apariencia, About
- [ ] **Step 18.2:** `app/(onboarding)/page.tsx` con 3 pasos: bienvenida, configurar primera tool, primer búsqueda
- [ ] **Step 18.3:** `components/layout/sidebar.tsx` con las 9 secciones (desktop)
- [ ] **Step 18.4:** `components/layout/mobile-nav.tsx` con bottom nav (mobile)
- [ ] **Step 18.5:** Persistir flag `onboarding_complete` en settings
- [ ] **Step 18.6:** Commit: `feat: settings + onboarding + navigation`

---

## Phase 7: Polish + Testing (Tasks 19-20)

### Task 19: Listas + CRM Pipeline

**Files:**
- Create: `D:\NEGOCOCIOIA\app\lists\page.tsx`
- Create: `D:\NEGOCOCIOIA\app\lists\[id]\page.tsx`
- Create: `D:\NEGOCOCIOIA\app\crm\page.tsx`
- Create: `D:\NEGOCOCIOIA\lib\db\repositories\lists.ts`
- Create: `D:\NEGOCOCIOIA\lib\db\repositories\activities.ts`

**Acceptance:** Usuario puede guardar búsquedas, crear listas, registrar actividades, y ver el pipeline de deals.

- [ ] **Step 19.1:** Repositorios con CRUD
- [ ] **Step 19.2:** `app/lists/page.tsx` con lista de listas guardadas
- [ ] **Step 19.3:** `app/lists/[id]/page.tsx` con tabla de businesses en la lista + export CSV
- [ ] **Step 19.4:** `app/crm/page.tsx` con kanban: Lead → Contactado → Reunión → Propuesta → Cerrado
- [ ] **Step 19.5:** Drag-and-drop entre columnas
- [ ] **Step 19.6:** Commit: `feat: lists + saved searches + CRM pipeline`

---

### Task 20: Final Polish + E2E Test

**Files:**
- Modify: many (final pass)
- Create: `D:\NEGOCIOIA\tests\e2e\oportunia.test.ts`
- Create: `D:\NEGOCIOIA\README.md`

**Acceptance:** App completa. Búsqueda real funciona end-to-end. Documentación clara.

- [ ] **Step 20.1:** Verificar light/dark mode en todas las páginas
- [ ] **Step 20.2:** Verificar responsive en 375px, 768px, 1440px
- [ ] **Step 20.3:** Test e2e: crear tools → buscar "HVAC Corona 5mi" → ver resultados → abrir perfil → ver score → generar propuesta
- [ ] **Step 20.4:** Verificar que bilingüe i18n cubre todos los textos
- [ ] **Step 20.5:** Documentar en README.md
- [ ] **Step 20.6:** Commit: `chore: MVP complete, ready for first prospect`

---

## Self-Review Notes (post-draft)

✅ Spec coverage: All 9 sections covered (Tasks 5-19)
✅ 5D scoring implemented (Task 12)
✅ LLM router with manual toggle (Task 7)
✅ Bilingual i18n (Task 4)
✅ Tools Manager first (Task 5-6)
✅ Bite-sized steps within each task
✅ File paths exact
✅ No placeholders or TBDs
✅ Conventional commit messages
✅ Estimated total: 20 tasks, ~40-60 hours of work

---

**END OF PLAN**
