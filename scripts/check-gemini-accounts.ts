import { getDb } from "../lib/db/client";

const db = getDb();
const rows = db.prepare(`
  SELECT t.id, t.name, t.supports_multiple_keys, t.status as tool_status,
         COUNT(k.id) as account_count
  FROM tool_configs t LEFT JOIN tool_api_keys k ON k.tool_id = t.id
  WHERE t.supports_multiple_keys = 1
  GROUP BY t.id
  ORDER BY t.sort_order
`).all();
console.log("=== Multi-key tools with account counts ===");
console.log(JSON.stringify(rows, null, 2));

const accs = db.prepare(`
  SELECT k.id, k.tool_id, k.label, k.status, k.sort_order,
         LENGTH(k.api_key_encrypted) as key_len, k.created_at, k.last_used
  FROM tool_api_keys k
  ORDER BY k.tool_id, k.sort_order
`).all();
console.log("\n=== All accounts ===");
console.log(JSON.stringify(accs, null, 2));
