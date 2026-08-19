/**
 * Categories repository
 *
 * CRUD for the categories table — used by the multi-select tag input in
 * /radar. Categories are seeded with the 12 hardcoded quick picks + ~50
 * common Google Places types. As the user searches, usage_count is
 * incremented and the "most used" bubbles to the top.
 */

import { getDb } from "../client";

export interface Category {
  id: string;
  display_name: string;
  display_name_en: string | null;
  icon: string | null;
  query: string;
  aliases: string | null;
  usage_count: number;
  last_used: number | null;
  is_system: number;
  is_quick_pick: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

/**
 * Search categories by name (autocomplete).
 * Matches against display_name, display_name_en, id, and aliases (case-insensitive).
 * Excludes categories already in the `exclude` set.
 */
export function searchCategories(
  query: string,
  limit: number = 8,
  exclude: Set<string> = new Set()
): Category[] {
  const db = getDb();
  const q = query.trim().toLowerCase();
  if (!q) {
    // Empty query → return top most-used (excluding already-selected)
    return listMostUsed(limit, exclude);
  }
  // LIKE match on multiple fields + JSON aliases contains
  const pattern = `%${q}%`;
  const rows = db
    .prepare(
      `SELECT * FROM categories
       WHERE (
         LOWER(display_name) LIKE ? OR
         LOWER(display_name_en) LIKE ? OR
         LOWER(id) LIKE ? OR
         LOWER(query) LIKE ? OR
         LOWER(COALESCE(aliases, '')) LIKE ?
       )
       AND id NOT IN (${exclude.size ? [...exclude].map(() => "?").join(",") : "''"})
       ORDER BY
         CASE WHEN LOWER(display_name) = ? THEN 0
              WHEN LOWER(display_name) LIKE ? THEN 1
              WHEN LOWER(id) = ? THEN 2
              WHEN LOWER(id) LIKE ? THEN 3
              ELSE 4 END,
         usage_count DESC,
         sort_order ASC
       LIMIT ?`
    )
    .all(
      pattern, pattern, pattern, pattern, pattern,
      ...(exclude.size ? [...exclude] : []),
      q, `${q}%`, q, `${q}%`,
      limit
    ) as Category[];
  return rows;
}

/**
 * Get a single category by id.
 */
export function getCategoryById(id: string): Category | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM categories WHERE id = ?").get(id) as Category | undefined;
  return row ?? null;
}

/**
 * Get all quick-pick categories (the 12 always-visible chips).
 */
export function listQuickPicks(): Category[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM categories WHERE is_quick_pick = 1 ORDER BY sort_order ASC")
    .all() as Category[];
}

/**
 * Get the N most-used categories (excluding already-selected).
 * Ties are broken by last_used DESC.
 */
export function listMostUsed(limit: number = 16, exclude: Set<string> = new Set()): Category[] {
  const db = getDb();
  const excludeIds = [...exclude];
  if (excludeIds.length) {
    return db
      .prepare(
        `SELECT * FROM categories
         WHERE id NOT IN (${excludeIds.map(() => "?").join(",")})
         ORDER BY usage_count DESC, last_used DESC, sort_order ASC
         LIMIT ?`
      )
      .all(...excludeIds, limit) as Category[];
  }
  return db
    .prepare(
      `SELECT * FROM categories
       ORDER BY usage_count DESC, last_used DESC, sort_order ASC
       LIMIT ?`
    )
    .all(limit) as Category[];
}

/**
 * Get all categories (for the "+N más" popover). Capped at 200 for safety.
 */
export function listAll(): Category[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM categories ORDER BY usage_count DESC, sort_order ASC LIMIT 200")
    .all() as Category[];
}

/**
 * Increment the usage counter for a category. Called after a successful
 * radar search that used this category.
 */
export function incrementUsage(id: string): void {
  const db = getDb();
  db.prepare(
    `UPDATE categories
     SET usage_count = usage_count + 1,
         last_used = strftime('%s', 'now'),
         updated_at = strftime('%s', 'now')
     WHERE id = ?`
  ).run(id);
}

/**
 * Increment usage for multiple category ids. Uses manual BEGIN/COMMIT
 * because node:sqlite has no db.transaction() helper.
 */
export function incrementUsageBatch(ids: string[]): void {
  if (ids.length === 0) return;
  const db = getDb();
  const stmt = db.prepare(
    `UPDATE categories
     SET usage_count = usage_count + 1,
         last_used = strftime('%s', 'now'),
         updated_at = strftime('%s', 'now')
     WHERE id = ?`
  );
  db.exec("BEGIN");
  try {
    for (const id of ids) stmt.run(id);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
