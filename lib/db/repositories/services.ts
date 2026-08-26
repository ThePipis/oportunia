/**
 * Services Repository - CRUD for service_catalog table.
 */

import { getDb } from "../client";

export interface Service {
  id: string;
  tier: 1 | 2 | 3;
  name: string;
  name_en: string | null;
  icon: string | null;
  description: string;
  description_en: string | null;
  example: string | null;
  example_en: string | null;
  pain_solved: string | null;
  pain_solved_en: string | null;
  price_setup: number;
  price_monthly: number;
  signals_json: string | null;
  pitch_template: string;
  pitch_template_en: string | null;
  category: string | null;
  active: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

export interface NewService {
  id: string;
  tier: 1 | 2 | 3;
  name: string;
  name_en?: string;
  icon?: string;
  description: string;
  description_en?: string;
  example?: string;
  example_en?: string;
  pain_solved?: string;
  pain_solved_en?: string;
  price_setup?: number;
  price_monthly?: number;
  signals?: string[];
  pitch_template: string;
  pitch_template_en?: string;
  category?: string;
  sort_order?: number;
  active?: boolean;
}

export function listServices(options: { tier?: number; activeOnly?: boolean } = {}): Service[] {
  const db = getDb();
  const params: unknown[] = [];
  let where = "1=1";
  if (options.tier) {
    where += " AND tier = ?";
    params.push(options.tier);
  }
  if (options.activeOnly) {
    where += " AND active = 1";
  }
  return db
    .prepare(`SELECT * FROM service_catalog WHERE ${where} ORDER BY tier ASC, sort_order ASC`)
    .all(...params) as Service[];
}

export function getService(id: string): Service | null {
  const db = getDb();
  return (
    (db.prepare(`SELECT * FROM service_catalog WHERE id = ?`).get(id) as Service) ?? null
  );
}

export function updateService(
  id: string,
  patch: Partial<NewService>
): Service | null {
  const db = getDb();
  const existing = getService(id);
  if (!existing) return null;
  const now = Math.floor(Date.now() / 1000);

  const fields: string[] = [];
  const values: unknown[] = [];

  const map: Array<[keyof NewService, string]> = [
    ["tier", "tier"],
    ["name", "name"],
    ["name_en", "name_en"],
    ["icon", "icon"],
    ["description", "description"],
    ["description_en", "description_en"],
    ["example", "example"],
    ["example_en", "example_en"],
    ["pain_solved", "pain_solved"],
    ["pain_solved_en", "pain_solved_en"],
    ["price_setup", "price_setup"],
    ["price_monthly", "price_monthly"],
    ["pitch_template", "pitch_template"],
    ["pitch_template_en", "pitch_template_en"],
    ["category", "category"],
    ["sort_order", "sort_order"],
  ];
  for (const [key, col] of map) {
    if (patch[key] !== undefined) {
      fields.push(`${col} = ?`);
      values.push(patch[key] as any);
    }
  }
  if (patch.signals !== undefined) {
    fields.push("signals_json = ?");
    values.push(JSON.stringify(patch.signals));
  }
  if (patch.active !== undefined) {
    fields.push("active = ?");
    values.push(patch.active ? 1 : 0);
  }
  fields.push("updated_at = ?");
  values.push(now);
  values.push(id);

  db.prepare(`UPDATE service_catalog SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getService(id);
}

export function toggleServiceActive(id: string): Service | null {
  const db = getDb();
  db.prepare(`UPDATE service_catalog SET active = 1 - active, updated_at = ? WHERE id = ?`)
    .run(Math.floor(Date.now() / 1000), id);
  return getService(id);
}

export function updateTierActive(tier: number, active: boolean): void {
  const db = getDb();
  db.prepare(`UPDATE service_catalog SET active = ?, updated_at = ? WHERE tier = ?`)
    .run(active ? 1 : 0, Math.floor(Date.now() / 1000), tier);
}
