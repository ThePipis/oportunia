// Read-only schema check using node:sqlite
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/radar.db', { readOnly: true });

console.log('--- schema_version ---');
console.log(db.prepare('SELECT * FROM schema_version ORDER BY version').all());

console.log('\n--- activities table SQL ---');
const row = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='activities'").get();
console.log(row?.sql ?? '(not found)');

console.log('\n--- activity types count ---');
console.log(db.prepare("SELECT type, COUNT(*) as c FROM activities GROUP BY type").all());

console.log('\n--- kanban sample (latest 5 activities) ---');
console.log(db.prepare(`
  SELECT b.name, a.type, a.pipeline_stage, a.title, a.created_at
  FROM activities a JOIN businesses b ON b.id = a.business_id
  ORDER BY a.created_at DESC LIMIT 5
`).all());

console.log('\n--- businesses in kanban (latest stage per biz) ---');
const k = db.prepare(`
  SELECT b.id, b.name, a.pipeline_stage, a.type as last_type
  FROM businesses b
  LEFT JOIN (
    SELECT business_id, pipeline_stage, type,
      ROW_NUMBER() OVER (PARTITION BY business_id ORDER BY created_at DESC) as rn
    FROM activities
  ) a ON a.business_id = b.id AND a.rn = 1
  WHERE a.business_id IS NOT NULL
`).all();
console.log(k);
