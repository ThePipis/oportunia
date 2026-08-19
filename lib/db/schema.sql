-- ============================================================================
-- OportunIA - SQLite Schema
-- Versión: 1.0 (Tier 1 MVP)
-- Fecha: 2026-08-17
--
-- Tablas:
--   1. settings          - Configuración global (KV)
--   2. tool_configs      - API keys, MCPs, health-checks
--   3. businesses        - Negocios prospectados
--   4. business_scores   - Score 5D por negocio
--   5. business_signals  - Señales individuales detectadas
--   6. business_services - Servicios AI matcheados
--   7. service_catalog   - Los 12 servicios AI
--   8. saved_searches    - Filtros guardados
--   9. lists             - Listas de prospectos
--  10. list_items        - Items en cada lista
--  11. activities        - CRM pipeline
--  12. proposals         - Propuestas generadas
-- ============================================================================

-- Configuración global key-value
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Configuración de herramientas externas (APIs, MCPs, LLM endpoints)
CREATE TABLE IF NOT EXISTS tool_configs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('api_key', 'mcp_server', 'oauth', 'llm_endpoint')),
  name TEXT NOT NULL,
  display_name TEXT,
  description TEXT,
  api_key_encrypted TEXT,  -- Never plaintext in queries
  endpoint TEXT,
  config_json TEXT,        -- JSON for additional config
  status TEXT NOT NULL DEFAULT 'unconfigured' CHECK (status IN ('unconfigured', 'active', 'error', 'rate_limited', 'disabled')),
  last_health_check INTEGER,
  last_used INTEGER,
  quota_used INTEGER DEFAULT 0,
  quota_limit INTEGER,
  quota_period TEXT CHECK (quota_period IN ('day', 'month', 'request') OR quota_period IS NULL),
  supports_multiple_keys INTEGER NOT NULL DEFAULT 0,  -- 1 = tool can have many API keys (e.g. multi-account Gemini)
  icon TEXT,
  docs_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_tool_configs_type ON tool_configs(type);
CREATE INDEX IF NOT EXISTS idx_tool_configs_status ON tool_configs(status);

-- Multi-account API keys for tools that support it (e.g. multiple Gemini Pro accounts).
-- The LLM router tries accounts in sort_order; on 429/5xx it falls back to the next.
-- On 403/400 it marks the account as 'error' but may try others.
CREATE TABLE IF NOT EXISTS tool_api_keys (
  id TEXT PRIMARY KEY,
  tool_id TEXT NOT NULL,
  label TEXT,                -- "Account #1 (Personal)", "Work #1", etc.
  api_key_encrypted TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'rate_limited', 'error', 'disabled', 'paused')),
  last_used INTEGER,
  last_error TEXT,
  last_error_at INTEGER,
  quota_used INTEGER NOT NULL DEFAULT 0,
  quota_limit INTEGER,        -- per-key override; null = inherit from tool
  cooldown_until INTEGER,     -- unix seconds; skip until this time
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (tool_id) REFERENCES tool_configs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tool_api_keys_tool_order ON tool_api_keys(tool_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_tool_api_keys_status ON tool_api_keys(status);

-- Negocios prospectados (de Google Places, Yelp, etc.)
CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  google_place_id TEXT UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'US',
  lat REAL,
  lng REAL,
  phone TEXT,
  website TEXT,
  email TEXT,
  google_rating REAL,
  review_count INTEGER,
  hours_json TEXT,
  business_types TEXT,         -- comma-separated
  primary_type TEXT,
  photos_json TEXT,            -- JSON array
  source_url TEXT,             -- donde se encontró originalmente
  source_engine TEXT,          -- 'google_places' | 'yelp' | 'brave' | 'tavily'
  sector_id TEXT,              -- FK to service_catalog
  sector_confidence REAL,      -- 0-1
  distance_miles REAL,
  last_crawled INTEGER,
  raw_data_json TEXT,          -- full raw API response for debugging
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_businesses_city ON businesses(city);
CREATE INDEX IF NOT EXISTS idx_businesses_sector ON businesses(sector_id);
CREATE INDEX IF NOT EXISTS idx_businesses_google_place_id ON businesses(google_place_id);
CREATE INDEX IF NOT EXISTS idx_businesses_distance ON businesses(distance_miles);
CREATE INDEX IF NOT EXISTS idx_businesses_rating ON businesses(google_rating);

-- Score 5D por negocio
CREATE TABLE IF NOT EXISTS business_scores (
  business_id TEXT PRIMARY KEY,
  total_score INTEGER NOT NULL CHECK (total_score BETWEEN 0 AND 100),
  -- 5 dimensiones (0-100 cada una)
  score_brecha_digital INTEGER NOT NULL DEFAULT 0,
  score_gap_operativo INTEGER NOT NULL DEFAULT 0,
  score_fit_negocio INTEGER NOT NULL DEFAULT 0,
  score_senales_compra INTEGER NOT NULL DEFAULT 0,
  score_proximidad INTEGER NOT NULL DEFAULT 0,
  -- Detalles de cada dimensión (JSON con explicación humana)
  breakdown_json TEXT,
  -- Tier resultante
  tier TEXT NOT NULL DEFAULT 'skip' CHECK (tier IN ('hot', 'warm', 'nurture', 'skip')),
  -- Reasoning generado por LLM (opcional, Tier 2)
  reasoning_text TEXT,
  last_calculated INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_business_scores_tier ON business_scores(tier);
CREATE INDEX IF NOT EXISTS idx_business_scores_total ON business_scores(total_score);

-- Señales individuales detectadas por cada análisis
CREATE TABLE IF NOT EXISTS business_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id TEXT NOT NULL,
  signal_type TEXT NOT NULL,  -- 'has_website', 'has_chat', 'mentions_24_7', 'review_count', etc.
  signal_key TEXT NOT NULL,
  signal_value TEXT,           -- texto o número como string
  signal_source TEXT NOT NULL, -- 'google_places' | 'firecrawl' | 'yelp' | 'tavily' | 'manual'
  confidence REAL DEFAULT 1.0,
  detected_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_signals_business ON business_signals(business_id);
CREATE INDEX IF NOT EXISTS idx_signals_type ON business_signals(signal_type);

-- Servicios AI matcheados a cada negocio
CREATE TABLE IF NOT EXISTS business_services (
  business_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  relevance INTEGER NOT NULL CHECK (relevance BETWEEN 0 AND 100),  -- qué tan relevante es este servicio para este business
  reasoning TEXT,  -- por qué se matcheó
  pitch TEXT,       -- pitch personalizado generado por LLM
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'presented', 'accepted', 'rejected')),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  PRIMARY KEY (business_id, service_id),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES service_catalog(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_business_services_status ON business_services(status);

-- Catálogo de servicios AI (los 12)
CREATE TABLE IF NOT EXISTS service_catalog (
  id TEXT PRIMARY KEY,
  tier INTEGER NOT NULL CHECK (tier IN (1, 2, 3)),
  name TEXT NOT NULL,
  name_en TEXT,
  icon TEXT,
  description TEXT NOT NULL,
  description_en TEXT,
  example TEXT,
  example_en TEXT,
  pain_solved TEXT,
  pain_solved_en TEXT,
  price_setup REAL NOT NULL DEFAULT 0,
  price_monthly REAL NOT NULL DEFAULT 0,
  signals_json TEXT,    -- JSON array de signal_types que indican necesidad
  pitch_template TEXT, -- template base del pitch (con placeholders)
  pitch_template_en TEXT,
  category TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_service_catalog_tier ON service_catalog(tier);
CREATE INDEX IF NOT EXISTS idx_service_catalog_active ON service_catalog(active);

-- Búsquedas guardadas (filtros recurrentes)
CREATE TABLE IF NOT EXISTS saved_searches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  filters_json TEXT NOT NULL,  -- JSON con {city, sector, radius, minScore, etc.}
  use_count INTEGER DEFAULT 0,
  last_used INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Listas de prospectos
CREATE TABLE IF NOT EXISTS lists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'sky',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Items en listas
CREATE TABLE IF NOT EXISTS list_items (
  list_id TEXT NOT NULL,
  business_id TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  notes TEXT,
  added_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  PRIMARY KEY (list_id, business_id),
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- Actividades del CRM (pipeline por negocio)
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'proposal_sent', 'status_change', 'task')),
  status TEXT CHECK (status IN ('pending', 'completed', 'cancelled') OR status IS NULL),
  pipeline_stage TEXT CHECK (pipeline_stage IN ('lead', 'contacted', 'meeting', 'proposal', 'closed_won', 'closed_lost') OR pipeline_stage IS NULL),
  title TEXT NOT NULL,
  notes TEXT,
  due_date INTEGER,
  completed_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activities_business ON activities(business_id);
CREATE INDEX IF NOT EXISTS idx_activities_stage ON activities(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_activities_due ON activities(due_date);

-- Propuestas generadas
CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content_json TEXT NOT NULL,    -- estructura completa de la propuesta
  pdf_path TEXT,                 -- path al PDF generado
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected')),
  total_setup_price REAL,
  total_monthly_price REAL,
  services_included TEXT,        -- JSON array de service_ids
  sent_at INTEGER,
  viewed_at INTEGER,
  responded_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_proposals_business ON proposals(business_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);

-- Tabla de versionado del schema (para futuras migrations)
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  description TEXT
);

-- ============================================================================
-- Catálogo de categorías de búsqueda (multi-select tag input en /radar)
-- ============================================================================
-- Cada categoría es un término que Google Places entiende. El usuario puede
-- seleccionar múltiples categorías en una búsqueda. Las categorías usadas se
-- rankean por usage_count DESC para que las "más usadas" aparezcan primero
-- en el tag picker. El campo is_quick_pick marca las categorías que siempre
-- se muestran en la fila de "Acceso rápido" (los 12 chips hardcoded).
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,             -- slug: "restaurant", "hvac"
  display_name TEXT NOT NULL,      -- nombre legible: "Restaurant"
  display_name_en TEXT,            -- nombre en inglés (opcional, fallback)
  icon TEXT,                       -- emoji: "🍽️"
  query TEXT NOT NULL,             -- término que Google Places entiende: "hvac contractor"
  aliases TEXT,                    -- JSON array: ["food", "dining"]
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used INTEGER,
  is_system INTEGER NOT NULL DEFAULT 1,    -- 1 = seeded, 0 = user-added
  is_quick_pick INTEGER NOT NULL DEFAULT 0, -- 1 = aparece en "Acceso rápido"
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_categories_usage ON categories(usage_count DESC, last_used DESC);
CREATE INDEX IF NOT EXISTS idx_categories_quick ON categories(is_quick_pick) WHERE is_quick_pick = 1;
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(display_name);
