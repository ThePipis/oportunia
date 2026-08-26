// Verify the kanban shows all 4 businesses again
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/radar.db');

const k = db
  .prepare(
    `SELECT b.name, a.pipeline_stage, a.type as last_type, a.title, a.created_at
     FROM businesses b
     LEFT JOIN (
       SELECT business_id, pipeline_stage, type, title, created_at,
         ROW_NUMBER() OVER (PARTITION BY business_id ORDER BY created_at DESC) as rn
       FROM activities
     ) a ON a.business_id = b.id AND a.rn = 1
     WHERE a.business_id IS NOT NULL
       AND a.type != 'pipeline_removed'
     ORDER BY a.created_at DESC`
  )
  .all();

console.log('Kanban now (should show 4 businesses in LEAD):');
console.log(k);
db.close();
