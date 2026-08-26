// Test the /api/crm/remove endpoint against the live dev server
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/radar.db');

const BIZ = 'biz-f185adcb-59e'; // Corky's — known to be in LEAD

console.log('BEFORE: latest activities for Corky:');
console.log(
  db
    .prepare(
      `SELECT type, pipeline_stage, title, created_at
       FROM activities WHERE business_id = ?
       ORDER BY created_at DESC LIMIT 3`
    )
    .all(BIZ)
);

console.log('\nCalling POST /api/crm/remove for Corky...');
const res = await fetch('http://localhost:3000/api/crm/remove', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ business_id: BIZ }),
});
const body = await res.json();
console.log('HTTP status:', res.status);
console.log('Response body:', JSON.stringify(body, null, 2));

console.log('\nAFTER: latest activities for Corky:');
console.log(
  db
    .prepare(
      `SELECT type, pipeline_stage, title, created_at
       FROM activities WHERE business_id = ?
       ORDER BY created_at DESC LIMIT 3`
    )
    .all(BIZ)
);

console.log('\nKanban query result (after remove):');
const kanban = db
  .prepare(
    `SELECT b.id, b.name, a.pipeline_stage, a.type as last_type
     FROM businesses b
     LEFT JOIN (
       SELECT business_id, pipeline_stage, type, created_at,
         ROW_NUMBER() OVER (PARTITION BY business_id ORDER BY created_at DESC) as rn
       FROM activities
       WHERE pipeline_stage IS NOT NULL OR type = 'pipeline_removed'
     ) a ON a.business_id = b.id AND a.rn = 1
     WHERE a.business_id IS NOT NULL
       AND a.type != 'pipeline_removed'
     ORDER BY a.created_at DESC`
  )
  .all();
console.log(kanban);

db.close();
