// Re-add Corky's to the LEAD stage so the user sees the original 4 cards again
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';

const db = new DatabaseSync('data/radar.db');
const BIZ = 'biz-f185adcb-59e';
const id = 'act-' + randomUUID().slice(0, 12);
const now = Math.floor(Date.now() / 1000);

db.prepare(
  `INSERT INTO activities
    (id, business_id, type, status, pipeline_stage, title, notes, due_date, created_at)
   VALUES (?, ?, 'status_change', 'completed', 'lead', 'Re-agregado al pipeline', NULL, NULL, ?)`
).run(id, BIZ, now);

console.log('✅ Corky re-added to LEAD. Activity id:', id);
db.close();
