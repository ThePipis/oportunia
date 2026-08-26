// Verify the new list was created and the business was NOT auto-added
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/radar.db');

const BIZ = 'biz-ddd7a356-b15'; // Panaderia Jalisco Bakery

console.log('All lists (in DB order, most recent first):');
console.log(db.prepare('SELECT id, name, created_at FROM lists ORDER BY created_at DESC').all());

console.log(`\nIs Panaderia (${BIZ}) in any of these lists?`);
console.log(
  db
    .prepare(
      `SELECT l.name as list_name
       FROM list_items li
       JOIN lists l ON l.id = li.list_id
       WHERE li.business_id = ?`
    )
    .all(BIZ)
);

console.log('\nSpecifically: prueba-flujo-nuevo list contents:');
console.log(
  db
    .prepare(
      `SELECT b.name as business_name
       FROM list_items li
       JOIN lists l ON l.id = li.list_id
       JOIN businesses b ON b.id = li.business_id
       WHERE l.name = 'prueba-flujo-nuevo'`
    )
    .all()
);

db.close();
