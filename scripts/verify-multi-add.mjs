// Check the state of Panaderia in lists
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/radar.db');

const BIZ = 'biz-ddd7a356-b15';

console.log('Lists and whether they contain Panaderia:');
console.log(
  db.prepare(`
    SELECT l.name, l.id, EXISTS(
      SELECT 1 FROM list_items li
      WHERE li.list_id = l.id AND li.business_id = ?
    ) as contains
    FROM lists l
    ORDER BY l.created_at DESC
  `).all(BIZ)
);

db.close();
