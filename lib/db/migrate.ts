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

const SCHEMA_PATH = path.join(process.cwd(), "lib", "db", "schema.sql");

function main() {
  console.log("🔧 Ejecutando migraciones...");

  if (!fs.existsSync(SCHEMA_PATH)) {
    console.error(`❌ No se encontró schema.sql en: ${SCHEMA_PATH}`);
    process.exit(1);
  }

  const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
  const db = getDb();

  // Ejecutar el schema completo
  db.exec(schema);

  // Insertar versión del schema
  const insertVersion = db.prepare(
    "INSERT OR REPLACE INTO schema_version (version, description) VALUES (?, ?)"
  );
  insertVersion.run(1, "Initial schema: 12 tables for MVP");

  // Verificar tablas creadas
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    .all() as { name: string }[];

  console.log(`\n✅ Migración completada. ${tables.length} tablas creadas:\n`);
  tables.forEach((t) => {
    const count = db
      .prepare(`SELECT COUNT(*) as c FROM ${t.name}`)
      .get() as { c: number };
    console.log(`   • ${t.name.padEnd(25)} (${count.c} filas)`);
  });

  closeDb();
}

main();
