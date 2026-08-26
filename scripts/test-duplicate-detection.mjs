// Test the duplicate-detection API contracts
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/radar.db');

// Find an existing list with at least one item, so we can test "already in this list"
const sample = db.prepare(`
  SELECT li.list_id, li.business_id, l.name as list_name, b.name as biz_name
  FROM list_items li
  JOIN lists l ON l.id = li.list_id
  JOIN businesses b ON b.id = li.business_id
  LIMIT 1
`).get();

if (!sample) {
  console.log('No list_items rows found — please add a business to a list first.');
  process.exit(1);
}

console.log('Sample (already in list):', sample);

// 1) Try to add the same (list, business) — should return added:false
const dupRes = await fetch(
  `http://localhost:3000/api/lists/${sample.list_id}/items/${sample.business_id}`,
  { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }
);
const dupBody = await dupRes.json();
console.log(`\n[Duplicate add] HTTP ${dupRes.status}:`, JSON.stringify(dupBody));

// 2) GET /api/lists?business_id=… — should mark this list as contains_business:true
const listsRes = await fetch(
  `http://localhost:3000/api/lists?business_id=${sample.business_id}`
);
const listsBody = await listsRes.json();
const marked = listsBody.lists.find((l) => l.id === sample.list_id);
console.log(`\n[/api/lists?business_id=…] mark on the known list:`, {
  id: marked?.id,
  name: marked?.name,
  contains_business: marked?.contains_business,
});

// 3) Test the CRM pipeline duplicate detection
// Corky's is in LEAD (from earlier), so clicking +Pipeline on it should be a duplicate
const crmRes = await fetch('http://localhost:3000/api/crm/move', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ business_id: sample.business_id, stage: 'lead' }),
});
const crmBody = await crmRes.json();
console.log(`\n[CRM /api/crm/move duplicate] HTTP ${crmRes.status}:`, JSON.stringify(crmBody));

// 4) Test CRM with a business NOT in pipeline — but all 4 of ours are.
//     Try with a non-existent business to confirm validation still works:
const fakeRes = await fetch('http://localhost:3000/api/crm/move', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ business_id: 'biz-does-not-exist', stage: 'lead' }),
});
const fakeBody = await fakeRes.json().catch(() => ({}));
console.log(`\n[CRM fake business] HTTP ${fakeRes.status}:`, JSON.stringify(fakeBody));

db.close();
