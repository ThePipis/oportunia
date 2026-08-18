/**
 * E2E test helpers.
 */

import fs from "node:fs";
import path from "node:path";
import { getDb } from "../../lib/db/client";

const SCHEMA_PATH = path.join(process.cwd(), "lib", "db", "schema.sql");

export function runMigrations(): void {
  const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
  const db = getDb();
  db.exec(schema);
  db.prepare(
    "INSERT OR REPLACE INTO schema_version (version, description) VALUES (?, ?)"
  ).run(1, "E2E test setup");
}
