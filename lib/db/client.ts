/**
 * OportunIA - SQLite Database Client
 *
 * Usa node:sqlite nativo de Node 22+ (experimental pero estable).
 * Singleton que mantiene la conexión a la base de datos local.
 * Usa WAL mode para mejor concurrencia y FK constraints activados.
 */

import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "radar.db");

// Asegurar que el directorio existe
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Singleton: una sola instancia de DB por proceso
let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (_db) return _db;

  _db = new DatabaseSync(DB_PATH);

  // WAL mode: mejor performance para lecturas concurrentes
  _db.exec("PRAGMA journal_mode = WAL");

  // Foreign keys: integridad referencial
  _db.exec("PRAGMA foreign_keys = ON");

  // Buscar y crear más rápido
  _db.exec("PRAGMA synchronous = NORMAL");

  return _db;
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

// Para tests: resetear la DB
export function resetDb(): void {
  closeDb();
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }
  const walPath = `${DB_PATH}-wal`;
  const shmPath = `${DB_PATH}-shm`;
  if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
  if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
}

export { DB_PATH, DB_DIR };
