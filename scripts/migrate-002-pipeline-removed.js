/**
 * Migration 003 — extend activities.type CHECK constraint
 *
 * The original schema only allowed 7 activity types. We now need an
 * 8th one: 'pipeline_removed', which acts as a soft-delete marker
 * so we can hide a business from the kanban while keeping the audit
 * trail.
 *
 * SQLite has no ALTER TABLE ... DROP CONSTRAINT, so we recreate the
 * table inside a single transaction:
 *   1. Create activities_new with the new CHECK
 *   2. Copy all rows from activities
 *   3. Drop activities
 *   4. Rename activities_new -> activities
 *   5. Recreate the indexes
 *
 * Safe to re-run: if migration v3 is already applied, it's a no-op.
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

// Check if migration is already applied by looking at the constraint
const currentSql = db
  .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='activities'")
  .get();

if (currentSql?.sql?.includes("'pipeline_removed'")) {
  console.log('Migration 003 already applied (CHECK constraint includes pipeline_removed).');
  process.exit(0);
}

console.log('Current activities table SQL:');
console.log(currentSql?.sql);
console.log('\nApplying migration 003...');

db.exec('BEGIN');
try {
  // 1. New table with extended CHECK
  db.exec(`
    CREATE TABLE activities_new (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'proposal_sent', 'status_change', 'task', 'pipeline_removed')),
      status TEXT CHECK (status IN ('pending', 'completed', 'cancelled') OR status IS NULL),
      pipeline_stage TEXT CHECK (pipeline_stage IN ('lead', 'contacted', 'meeting', 'proposal', 'closed_won', 'closed_lost') OR pipeline_stage IS NULL),
      title TEXT NOT NULL,
      notes TEXT,
      due_date INTEGER,
      completed_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    )
  `);

  // 2. Copy all data
  db.exec(`
    INSERT INTO activities_new
      (id, business_id, type, status, pipeline_stage, title, notes, due_date, completed_at, created_at)
    SELECT
      id, business_id, type, status, pipeline_stage, title, notes, due_date, completed_at, created_at
    FROM activities
  `);

  // 3. Drop old
  db.exec('DROP TABLE activities');

  // 4. Rename
  db.exec('ALTER TABLE activities_new RENAME TO activities');

  // 5. Recreate indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_activities_business ON activities(business_id);
    CREATE INDEX IF NOT EXISTS idx_activities_stage ON activities(pipeline_stage);
    CREATE INDEX IF NOT EXISTS idx_activities_due ON activities(due_date);
  `);

  // 6. Record migration
  db.prepare(
    "INSERT INTO schema_version (version, description) VALUES (3, 'Extend activities.type CHECK to include pipeline_removed (soft-delete marker)')"
  ).run();

  db.exec('COMMIT');
  console.log('✅ Migration 003 applied successfully.');
} catch (e) {
  db.exec('ROLLBACK');
  console.error('❌ Migration failed:', e.message);
  process.exit(1);
}

// Verify
const after = db
  .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='activities'")
  .get();
console.log('\nNew activities table SQL:');
console.log(after?.sql);

const version = db.prepare('SELECT * FROM schema_version ORDER BY version').all();
console.log('\nFinal schema_version:');
console.log(version);

db.close();
