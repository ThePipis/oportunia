/**
 * OportunIA - Database Migration Script
 *
 * Lee lib/db/schema.sql y lo aplica a la base de datos.
 * Crea las tablas si no existen. Idempotente.
 *
 * Uso: npm run db:migrate
 */

import fs from "node:fs";
import path from "node:path";
import { getDb, closeDb } from "./client";
import { migrateLegacyKeysToAccounts } from "./repositories/tool-api-keys";

const SCHEMA_PATH = path.join(process.cwd(), "lib", "db", "schema.sql");

function addColumnIfMissing(table: string, column: string, ddl: string): boolean {
  const db = getDb();
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (cols.some((c) => c.name === column)) return false;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  return true;
}

async function main() {
  console.log("🔧 Ejecutando migraciones...");

  if (!fs.existsSync(SCHEMA_PATH)) {
    console.error(`❌ No se encontró schema.sql en: ${SCHEMA_PATH}`);
    process.exit(1);
  }

  const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
  const db = getDb();

  // Ejecutar el schema completo (CREATE IF NOT EXISTS → idempotente)
  db.exec(schema);

  // -------------------------------------------------------------------------
  // Incremental ALTERs para columnas añadidas en versiones posteriores
  // -------------------------------------------------------------------------
  if (addColumnIfMissing("tool_configs", "supports_multiple_keys", "INTEGER NOT NULL DEFAULT 0")) {
    console.log("   ↪ tool_configs.supports_multiple_keys añadida");
  }

  // Marcar tools multi-key para instalaciones existentes
  const multiKeyTools = [
    "gemini-pro",
    "google-places",
    "yelp-fusion",
    "tavily",
    "firecrawl",
    "brave-search",
  ];
  const stmt = db.prepare(
    `UPDATE tool_configs SET supports_multiple_keys = 1
     WHERE name = ? AND supports_multiple_keys = 0`
  );
  for (const name of multiKeyTools) {
    const r = stmt.run(name);
    if (r.changes > 0) console.log(`   ↪ ${name} marcado como multi-cuenta`);
  }

  // Migrar API keys legacy (gemini-pro) al nuevo esquema multi-cuenta
  const migrated = migrateLegacyKeysToAccounts();
  if (migrated > 0) {
    console.log(`   ↪ ${migrated} API key(s) legacy migradas a tool_api_keys`);
  }

  // Insertar versión del schema
  const insertVersion = db.prepare(
    "INSERT OR REPLACE INTO schema_version (version, description) VALUES (?, ?)"
  );
  insertVersion.run(2, "Multi-account API keys for Gemini Pro (tool_api_keys table)");

  // Auto-seed categorías si la tabla está vacía
  const catCount = (db.prepare("SELECT COUNT(*) as c FROM categories").get() as { c: number }).c;
  if (catCount === 0) {
    const { execSync } = await import("node:child_process");
    try {
      execSync("npm run db:seed-categories", { stdio: "inherit", cwd: process.cwd() });
    } catch (e) {
      console.warn("   ⚠️  No se pudo auto-seed categorías:", (e as Error).message);
    }
  } else {
    console.log(`   ↪ ${catCount} categorías ya en DB (skip seed)`);
  }

  // Verificar tablas creadas
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    .all() as { name: string }[];

  console.log(`\n✅ Migración completada. ${tables.length} tablas:\n`);
  tables.forEach((t) => {
    const count = db
      .prepare(`SELECT COUNT(*) as c FROM ${t.name}`)
      .get() as { c: number };
    console.log(`   • ${t.name.padEnd(25)} (${count.c} filas)`);
  });

  closeDb();
}

main();
