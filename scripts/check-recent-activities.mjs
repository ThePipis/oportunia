// Confirm the click actually saved a status_change activity
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/radar.db');

console.log('Latest 3 activities for Panaderia:');
console.log(
  db
    .prepare(
      `SELECT type, pipeline_stage, title, datetime(created_at, 'unixepoch') as created
       FROM activities WHERE business_id = 'biz-ddd7a356-b15'
       ORDER BY created_at DESC LIMIT 3`
    )
    .all()
);

db.close();
