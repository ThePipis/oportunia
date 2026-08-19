import { getDb } from "../lib/db/client";
import { listAccounts } from "../lib/db/repositories/tool-api-keys";
import { listTools } from "../lib/db/repositories/tools";

const db = getDb();
console.log("=== tool_api_keys (todas) ===");
const keys = db.prepare("SELECT id, tool_id, label, status, sort_order, LENGTH(api_key_encrypted) as key_len FROM tool_api_keys").all();
console.log(JSON.stringify(keys, null, 2));

console.log("\n=== tool_configs con supports_multiple_keys=1 ===");
const tools = listTools().filter((t) => t.supports_multiple_keys === 1);
console.log(JSON.stringify(tools.map((t) => ({ id: t.id, name: t.name, supports_multiple_keys: t.supports_multiple_keys, has_key: !!t.api_key_encrypted })), null, 2));

console.log("\n=== Accounts de gemini-pro ===");
const gemini = tools.find((t) => t.name === "gemini-pro");
if (gemini) {
  const accs = listAccounts(gemini.id);
  console.log(`Total: ${accs.length}`);
  for (const a of accs) {
    console.log(`  ${a.label} | status=${a.status} | last_used=${a.last_used} | key_len=${a.api_key_encrypted.length}`);
  }
}
