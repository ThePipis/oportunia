// Reset stale error/cooldown state on a specific tool_api_keys row
// so the user can re-run the (now-fixed) health check immediately.
const { DatabaseSync } = require("node:sqlite");
const path = require("node:path");

const dbPath = path.resolve(process.argv[2] || "./data/radar.db");
const keyId = process.argv[3]; // e.g. acc_google-places-8ed79279_072d65a9

if (!keyId) {
  console.error("Usage: node reset-tool-api-key.js <dbPath> <keyId>");
  process.exit(1);
}

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL");

// Before
const before = db.prepare(`
  SELECT id, label, status, cooldown_until, last_error_at,
         substr(last_error, 1, 100) AS err_preview
  FROM tool_api_keys WHERE id = ?
`).all(keyId);
console.log("BEFORE:");
console.table(before);

// Reset
const result = db.prepare(`
  UPDATE tool_api_keys
  SET status = 'active',
      cooldown_until = NULL,
      last_error = NULL,
      last_error_at = NULL
  WHERE id = ?
`).run(keyId);
console.log(`\nUpdated ${result.changes} row(s).`);

// Also reset the parent tool_configs.status if it was 'error'
const toolId = before[0]?.id?.startsWith("acc_")
  ? db.prepare("SELECT tool_id FROM tool_api_keys WHERE id = ?").get(keyId)?.tool_id
  : null;

if (toolId) {
  const updTool = db.prepare(`
    UPDATE tool_configs
    SET status = CASE WHEN status = 'error' THEN 'active' ELSE status END
    WHERE id = ?
  `).run(toolId);
  console.log(`Reset tool_configs.status (${updTool.changes} row affected).`);
}

// After
const after = db.prepare(`
  SELECT id, label, status, cooldown_until, last_error_at,
         substr(last_error, 1, 100) AS err_preview
  FROM tool_api_keys WHERE id = ?
`).all(keyId);
console.log("\nAFTER:");
console.table(after);
