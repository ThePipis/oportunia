/**
 * Migration 003 — add businesses.review_breakdown_json
 *
 * Persists the star-by-star review count (5★, 4★, 3★, 2★, 1★) per
 * business. The Google Places API (New) basic endpoint does NOT
 * return this — we have to either:
 *   - call Place Details with the reviews field mask (paid),
 *   - or wire up Yelp Fusion (which does return this natively).
 *
 * This migration is preparation for that future integration. It is
 * safe to re-run: the column add is wrapped in a try/catch that
 * treats a "duplicate column name" error as "already applied".
 *
 * Shape once populated: { "5": 42, "4": 10, "3": 3, "2": 1, "1": 0 }
 * (the StarRatingBreakdown component also accepts other shapes).
 */

const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(process.cwd(), 'data', 'radar.db');

if (!fs.existsSync(DB_PATH)) {
  console.error(`DB not found at ${DB_PATH}`);
  process.exit(1);
}

const db = new DatabaseSync(DB_PATH);

// Quick check: does the column already exist?
const cols = db
  .prepare("PRAGMA table_info(businesses)")
  .all();
const hasCol = cols.some((c) => c.name === 'review_breakdown_json');

if (hasCol) {
  console.log('Migration 003 already applied (review_breakdown_json column exists).');
  process.exit(0);
}

console.log('Adding businesses.review_breakdown_json column...');
try {
  db.exec(
    "ALTER TABLE businesses ADD COLUMN review_breakdown_json TEXT"
  );
  console.log('Done.');
} catch (e) {
  console.error('ALTER TABLE failed:', e.message);
  process.exit(1);
}

// Update the schema_version table so other code paths can detect the
// migration is applied without re-trying it.
const currentVersion = db
  .prepare("SELECT version FROM schema_version ORDER BY version DESC LIMIT 1")
  .get();
if (!currentVersion || currentVersion.version < 3) {
  try {
    db.exec(
      "INSERT INTO schema_version (version, applied_at) VALUES (3, strftime('%s', 'now'))"
    );
  } catch {
    // schema_version table might not exist; the column add is the
    // important part. Just warn.
    console.warn(
      'Could not update schema_version (the table might not exist). Column is in place.'
    );
  }
}
