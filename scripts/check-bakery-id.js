// Check bakery category id using node:sqlite (built-in, matches the app)
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const db = new DatabaseSync(path.join(__dirname, '..', 'data', 'oportunia.db'), { readOnly: true });
const rows = db.prepare("SELECT id, display_name, icon, query, usage_count FROM categories WHERE display_name LIKE '%akery%' OR display_name LIKE '%panader%' LIMIT 10").all();
console.log(JSON.stringify(rows, null, 2));
