// Read-only schema check
const Database = require('better-sqlite3');
const db = new Database('data/oportunia.db', { readonly: true });

console.log('--- schema_version ---');
console.log(db.prepare('SELECT * FROM schema_version ORDER BY version').all());

console.log('\n--- activities table SQL ---');
const row = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='activities'").get();
console.log(row?.sql ?? '(not found)');

console.log('\n--- activity types count ---');
console.log(db.prepare("SELECT type, COUNT(*) as c FROM activities GROUP BY type").all());

console.log('\n--- kanban sample (latest 5) ---');
console.log(db.prepare(`
  SELECT b.name, a.type, a.pipeline_stage, a.title, a.created_at
  FROM activities a JOIN businesses b ON b.id = a.business_id
  ORDER BY a.created_at DESC LIMIT 5
`).all());
