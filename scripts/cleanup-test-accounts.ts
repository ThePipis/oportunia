import { getDb } from "../lib/db/client";

const db = getDb();
const before = db.prepare("SELECT COUNT(*) as c FROM tool_api_keys").get() as { c: number };
console.log(`Before: ${before.c} accounts`);

const result = db.prepare("DELETE FROM tool_api_keys WHERE label = 'Test account'").run();
console.log(`Deleted ${result.changes} test accounts`);

const after = db.prepare("SELECT COUNT(*) as c FROM tool_api_keys").get() as { c: number };
console.log(`After: ${after.c} accounts`);
