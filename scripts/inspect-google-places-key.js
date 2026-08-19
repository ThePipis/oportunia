// Inspect Google Places tool_api_keys state using node:sqlite
const { DatabaseSync } = require("node:sqlite");
const path = require("node:path");

const dbPath = path.resolve(process.argv[2] || "./data/radar.db");
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL");

// Find the tool
const tool = db.prepare(`
  SELECT id, name, display_name, status, supports_multiple_keys
  FROM tool_configs
  WHERE name = 'google-places' OR name LIKE '%places%'
`).all();
console.log("=== tool_configs (google-places) ===");
console.table(tool);

if (tool.length === 0) {
  console.log("No google-places tool found. Available tools:");
  console.table(db.prepare("SELECT id, name, display_name, status FROM tool_configs").all());
  process.exit(1);
}

const toolId = tool[0].id;
const rows = db.prepare(`
  SELECT id, label, status, sort_order, cooldown_until,
         substr(last_error, 1, 250) AS err,
         last_error_at,
         quota_used, quota_limit,
         length(api_key_encrypted) AS key_len
  FROM tool_api_keys
  WHERE tool_id = ?
  ORDER BY sort_order ASC, id ASC
`).all(toolId);

console.log(`\n=== tool_api_keys for ${tool[0].name} (id=${toolId}) ===`);
console.table(rows);
