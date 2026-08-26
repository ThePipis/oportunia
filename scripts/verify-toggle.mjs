// Verify the toggle worked: Panaderia should now have a
// pipeline_removed activity as the latest, and the kanban query
// should exclude it.
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/radar.db');

const BIZ = 'biz-ddd7a356-b15';

console.log('Latest 3 activities for Panaderia:');
console.log(
  db
    .prepare(
      `SELECT type, pipeline_stage, title, datetime(created_at, 'unixepoch') as at
       FROM activities WHERE business_id = ?
       ORDER BY created_at DESC LIMIT 3`
    )
    .all(BIZ)
);

console.log('\nIs Panaderia in the kanban? (should be empty / excluded):');
console.log(
  db
    .prepare(
      `SELECT b.name, a.pipeline_stage, a.type as last_type
       FROM businesses b
       LEFT JOIN (
         SELECT business_id, pipeline_stage, type,
           ROW_NUMBER() OVER (PARTITION BY business_id ORDER BY created_at DESC) as rn
         FROM activities
         WHERE pipeline_stage IS NOT NULL OR type = 'pipeline_removed'
       ) a ON a.business_id = b.id AND a.rn = 1
       WHERE a.business_id IS NOT NULL
         AND a.type != 'pipeline_removed'`
    )
    .all(BIZ)
);

console.log('\nPipeline status from /full endpoint perspective:');
const latest = db.prepare(
  `SELECT type, pipeline_stage FROM activities
   WHERE business_id = ? ORDER BY created_at DESC LIMIT 1`
).get(BIZ);
console.log({
  latest_type: latest?.type,
  pipeline_stage: latest?.pipeline_stage,
  in_pipeline: latest?.type === 'status_change' && !!latest?.pipeline_stage,
});

db.close();
