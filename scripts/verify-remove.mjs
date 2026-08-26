// Verify Q3 no longer contains Panaderia
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/radar.db');

const BIZ = 'biz-ddd7a356-b15';

console.log(`Which lists does Panaderia (${BIZ}) still belong to?`);
console.log(
  db
    .prepare(
      `SELECT l.name as list_name
       FROM list_items li
       JOIN lists l ON l.id = li.list_id
       WHERE li.business_id = ?
       ORDER BY l.name`
    )
    .all(BIZ)
);

console.log('\nQ3 contents (should NOT include Panaderia):');
console.log(
  db
    .prepare(
      `SELECT b.name as business_name
       FROM list_items li
       JOIN lists l ON l.id = li.list_id
       JOIN businesses b ON b.id = li.business_id
       WHERE l.name = 'Q3'`
    )
    .all()
);

db.close();
