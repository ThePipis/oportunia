# OportunIA · Design Spec

**Fecha:** 2026-08-17
**Versión:** 1.0 (Tier 1 MVP)
**Autor:** Mavis (brainstorming con el usuario)

---

## 1. Visión del producto

**OportunIA** es el radar de clientes de alto valor para vendedores de servicios de AI a negocios locales. Encuentra negocios en cualquier ciudad y sector, los califica con un score multi-dimensional basado en data pública real, y genera propuestas personalizadas listas para presentar.

**Tagline:**
- ES: "Tu próximo cliente, con probabilidad real de cerrar."
- EN: "Your next client, with real closing probability."

**Target user (Tier 1):** el usuario único (LATAM-AI agency operator en Inland Empire). En Tier 2: otros vendedores de servicios AI.

**Punto de origen para distancias:** 7940 Vandewater St, Eastvale, CA (casa del usuario).

---

## 2. Objetivos y no-objetivos

### Objetivos Tier 1 (MVP)
- Encontrar ≥100 prospectos/mes con data pública real (sin alucinar)
- Calificar cada prospecto con score 0-100 basado en 5 dimensiones
- Generar propuestas personalizadas exportables (PDF)
- Operar completamente en local + LLM local + ~$16/mes de APIs externas
- Estar 100% traducido a español e inglés con toggle global
- Persistir todo en SQLite local

### No-objetivos Tier 1
- Multi-tenant / multi-usuario
- SaaS público / landing page
- Billing / Stripe
- Envío automatizado de emails
- iOS / Android nativo (web responsive es suficiente)

---

## 3. Stack técnico Tier 1

| Capa | Tecnología |
|---|---|
| Frontend + Backend | Next.js 15 (App Router, Server Actions) |
| UI | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Database | SQLite (better-sqlite3) |
| LLM principal | llama.cpp local en srvubuntu01:8080 (Qwen3.5-4B Q8_0) |
| LLM fallback | Google Gemini Pro API (1 de las 4 cuentas Pro) |
| Búsqueda web | Tavily MCP (en .env) |
| Web crawling | Firecrawl MCP ($16/mo Hobby) |
| Local business data | Google Places API (New) + Yelp Fusion + OpenStreetMap Nominatim |
| Backup search | Brave Search API |
| i18n | Custom i18n con es.json + en.json |
| Hosting | Local (localhost:3000) |

**Costo mensual Tier 1:** ~$16-36/mes (solo Firecrawl obligatorio).

---

## 4. Secciones de la aplicación (9)

1. **Dashboard** — KPIs del día, top 5 leads, mapa de calor
2. **Radar / Search** — Búsqueda con filtros + tabla ordenable + vista mapa
3. **Business Profile** — Data completa + score 5D con barras + servicios matcheados + talking points
4. **Generador de Propuesta** — PDF editable con diagnóstico + servicios + pricing
5. **Tools & Integrations Manager** — CRUD de API keys + health-check + cuotas + LLM endpoints
6. **Catálogo de Servicios AI** — Los 12 servicios (4 Tier 1 + 4 Tier 2 + 4 Tier 3) editables
7. **Listas & Búsquedas Guardadas** — Filtros recurrentes, listas de prospectos, export CSV
8. **CRM Ligero / Actividad** — Pipeline por negocio: Lead → Contactado → Reunión → Propuesta → Cerrado
9. **Settings** — Dirección origen, perfil, idioma, tema, precios default

---

## 5. Algoritmo de scoring

Score final (0-100) = suma ponderada de 5 dimensiones:

| Letra | Dimensión | Peso | Señales principales |
|---|---|---|---|
| A | Brecha Digital | 25% | Sin web / web no-responsive, sin reseñas recientes, sin chat, sin booking, sin social |
| B | Gap Operativo | 25% | No 24/7, respuesta lenta a leads, sin CRM/automation, <5 empleados, no multi-sede |
| C | Fit del Negocio | 25% | Sector de alto ticket, perfil de emergencia, ticket promedio ≥$500 |
| D | Señales de Compra | 15% | Reseñas positivas recientes, crecimiento visible, anuncios activos, >3 empleados, >3 años con buen rating |
| E | Proximidad | 10% | Distancia desde 7940 Vandewater St (≤5mi = max, ≥40mi = min) |

**Rangos de acción:**
- 80-100 → 🔥 Cerrar esta semana (SMS + llamada inmediata)
- 60-79 → ⚡ Lead caliente (email + LinkedIn + visita)
- 40-59 → 🌱 Nurture (secuencia 14 días)
- <40 → ❌ Skip (revisar en 3 meses)

---

## 6. LLM routing (manual toggle)

Tres opciones configurables por el usuario antes de cada búsqueda:

1. **Local · Qwen3.5 4B** — Rápido, gratis, para scoring y resúmenes cortos
2. **Cloud · Gemini Pro** — Mejor razonamiento, para propuestas largas y análisis de muchas reseñas
3. **Auto · Router** — Empieza local, escala a Gemini si la complejidad es alta

Default: Auto. La preferencia se guarda en el perfil del usuario.

---

## 7. Data model (SQLite)

```sql
-- Configuración
settings (key TEXT PRIMARY KEY, value TEXT, updated_at INTEGER)

-- Tools / Integrations
tool_configs (id TEXT PK, type TEXT, name TEXT, api_key TEXT, endpoint TEXT, status TEXT, last_health_check INTEGER, last_used INTEGER, quota_used INTEGER, quota_limit INTEGER)

-- Búsquedas guardadas
saved_searches (id TEXT PK, name TEXT, filters JSON, created_at INTEGER, last_used INTEGER)

-- Catálogo de servicios AI
service_catalog (id TEXT PK, tier INT, name TEXT, name_en TEXT, description TEXT, description_en TEXT, example TEXT, example_en TEXT, price_setup REAL, price_monthly REAL, signals TEXT, pitch TEXT, pitch_en TEXT, active INT)

-- Negocios prospectados
businesses (id TEXT PK, google_place_id TEXT, name TEXT, address TEXT, city TEXT, state TEXT, zip TEXT, lat REAL, lng REAL, phone TEXT, website TEXT, google_rating REAL, review_count INT, hours JSON, types TEXT, source_url TEXT, last_crawled INTEGER, created_at INTEGER)

-- Scoring
business_scores (business_id TEXT PK, score_breakdown JSON, total_score INT, signals JSON, last_calculated INTEGER)

-- Servicios matcheados por negocio
business_services (business_id TEXT, service_id TEXT, relevance INT, pitch TEXT, PRIMARY KEY(business_id, service_id))

-- Listas
lists (id TEXT PK, name TEXT, description TEXT, created_at INTEGER)
list_items (list_id TEXT, business_id TEXT, position INT, PRIMARY KEY(list_id, business_id))

-- Actividad / CRM
activities (id TEXT PK, business_id TEXT, type TEXT, notes TEXT, status TEXT, created_at INTEGER)

-- Propuestas
proposals (id TEXT PK, business_id TEXT, content JSON, pdf_path TEXT, status TEXT, created_at INTEGER, sent_at INTEGER)
```

---

## 8. Endpoints de la API (Next.js Server Actions + API Routes)

| Endpoint | Método | Propósito |
|---|---|---|
| `/api/radar/search` | POST | Buscar negocios por ciudad/sector/radio |
| `/api/businesses/[id]` | GET | Detalle completo de un negocio |
| `/api/businesses/[id]/rescore` | POST | Recalcular score |
| `/api/businesses/[id]/proposal` | POST | Generar propuesta PDF |
| `/api/tools` | GET/POST/PUT/DELETE | CRUD de tools/API keys |
| `/api/tools/[id]/health` | POST | Health check de un tool |
| `/api/services` | GET/POST/PUT/DELETE | CRUD del catálogo de servicios |
| `/api/lists` | GET/POST | CRUD de listas |
| `/api/activities` | GET/POST | Log de actividades |
| `/api/proposals` | GET/POST | CRUD de propuestas |
| `/api/settings` | GET/PUT | Settings del usuario |
| `/api/llm/test` | POST | Probar un LLM endpoint |
| `/api/export/csv` | GET | Exportar lista a CSV |

---

## 9. UI/UX principles (12 reglas)

1. Un CTA principal por pantalla
2. Glosario inline con icono `?` para términos técnicos
3. Onboarding guiado de 3 pasos en la primera sesión
4. Cero datos falsos — solo data verificada de fuentes reales
5. Charts con insight + acción ("¿Qué hago con esto?")
6. Persistencia total en SQLite
7. Light + dark mode con toggle
8. Mobile-first real (bottom nav, swipe, captura en 1 tap)
9. Bilingüe i18n ES/EN con toggle global
10. Tools Manager primero — sin API keys, no se puede buscar
11. Progressive disclosure (wizard: 1. Qué → 2. Filtros → 3. Resultados → 4. Detalle)
12. Estados completos: loading con skeleton, empty con CTA, error con retry

---

## 10. Criterios de aceptación (MVP done)

- [ ] El usuario puede crear cuentas de Google Places, Yelp, Tavily, Firecrawl, Brave, Gemini y configurarlas en Tools Manager
- [ ] El usuario puede hacer una búsqueda "HVAC en Corona 5mi" y obtener ≥10 negocios reales con data de Google
- [ ] Cada negocio tiene score 0-100 desglosado en 5 dimensiones con explicación humana
- [ ] Cada negocio tiene 1-3 servicios AI matcheados con reasoning
- [ ] El usuario puede generar una propuesta PDF lista para imprimir/enviar
- [ ] El toggle ES/EN cambia todos los textos de la UI
- [ ] El toggle de LLM (Local/Gemini/Auto) funciona y el default persiste
- [ ] Búsquedas guardadas y listas funcionan
- [ ] Pipeline de actividades funciona (Lead → Contactado → Reunión → Propuesta → Cerrado)
- [ ] Light + dark mode funcionan
- [ ] Funciona en mobile (375px), tablet (768px), desktop (1440px)
- [ ] La app corre 100% en localhost sin servicios cloud obligatorios (excepto las APIs externas configuradas)

---

## 11. Out of scope (Tier 2)

Cuando se monetice:
- Multi-tenant (Supabase)
- Auth (Supabase Auth)
- Billing (Stripe)
- Landing page pública
- Email transactional (Resend)
- Scraping a escala (Apify Pro)
- Cache layer (Upstash Redis)
- Premium LLM tier (Claude API)

---

## 12. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Google Places API cambia pricing/structure | Monitorear quota usage en Tools Manager; tener Apify como backup |
| LLM local (4B) da resultados pobres | Routing automático a Gemini; prompts con few-shot examples |
| Datos desactualizados de un negocio | Cada score tiene timestamp; UI muestra "datos de hace X días" |
| Quota de Gemini excedida | Tools Manager alerta; fallback a local + degradación graceful |
| SQLite se corrompe | Backups automáticos diarios a `./data/backups/` |
| API key leakada | Keys nunca en el cliente; siempre en server actions con .env |

---

## 13. Próximos pasos

1. **Hoy:** Validar este spec con el usuario
2. **Después:** Crear el plan de implementación detallado (writing-plans skill)
3. **Implementación:** Scaffold del proyecto Next.js + estructura de archivos + dependencias
4. **Iteración por sección:** Dashboard → Radar → Business Profile → Tools Manager → Propuesta → CRM → Settings
5. **Testing:** Búsqueda real con un negocio conocido para verificar end-to-end

---

**FIN DEL SPEC**
