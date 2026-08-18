/**
 * Tool API Keys Repository
 *
 * Multi-account API key store for tools that support it (e.g. several Gemini Pro
 * accounts with auto-fallback when one hits quota/rate-limit).
 *
 * The LLM router in lib/llm/router.ts uses these helpers to pick the next
 * available key, and to mark accounts as rate_limited / errored when they fail.
 */

import { getDb } from "../client";
import { randomUUID } from "node:crypto";

export type AccountStatus =
  | "active"
  | "rate_limited"
  | "error"
  | "disabled"
  | "paused";

export interface ToolApiKey {
  id: string;
  tool_id: string;
  label: string | null;
  api_key_encrypted: string;
  sort_order: number;
  status: AccountStatus;
  last_used: number | null;
  last_error: string | null;
  last_error_at: number | null;
  quota_used: number;
  quota_limit: number | null;
  cooldown_until: number | null;
  created_at: number;
  updated_at: number;
}

function makeAccountId(toolId: string): string {
  return `acc_${toolId.replace(/[^a-z0-9-]/gi, "")}_${randomUUID().slice(0, 8)}`;
}

/** List ALL accounts for a tool, ordered by sort_order. */
export function listAccounts(toolId: string): ToolApiKey[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM tool_api_keys WHERE tool_id = ? ORDER BY sort_order ASC, created_at ASC`
    )
    .all(toolId) as ToolApiKey[];
}

/** List accounts that are usable right now (active + not in cooldown). */
export function listActiveAccounts(toolId: string, nowSec: number): ToolApiKey[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM tool_api_keys
       WHERE tool_id = ?
         AND status = 'active'
         AND (cooldown_until IS NULL OR cooldown_until <= ?)
       ORDER BY sort_order ASC, created_at ASC`
    )
    .all(toolId, nowSec) as ToolApiKey[];
}

/** Get a single account by id. */
export function getAccount(id: string): ToolApiKey | null {
  const db = getDb();
  return (
    (db.prepare(`SELECT * FROM tool_api_keys WHERE id = ?`).get(id) as ToolApiKey) ??
    null
  );
}

/** Add a new account for a tool. Auto-assigns sort_order to last+10. */
export function addAccount(
  toolId: string,
  input: { label?: string; api_key: string; quota_limit?: number }
): ToolApiKey {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const lastRow = db
    .prepare(
      `SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM tool_api_keys WHERE tool_id = ?`
    )
    .get(toolId) as { max_order: number };
  const sortOrder = (lastRow?.max_order ?? 0) + 10;
  const id = makeAccountId(toolId);

  db.prepare(
    `INSERT INTO tool_api_keys (
      id, tool_id, label, api_key_encrypted, sort_order, status,
      quota_used, quota_limit, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'active', 0, ?, ?, ?)`
  ).run(
    id,
    toolId,
    input.label ?? null,
    input.api_key,
    sortOrder,
    input.quota_limit ?? null,
    now,
    now
  );

  return getAccount(id)!;
}

/** Update mutable fields on an account. Pass `null` to clear string fields. */
export function updateAccount(
  id: string,
  patch: {
    label?: string | null;
    api_key?: string;
    sort_order?: number;
    status?: AccountStatus;
    quota_limit?: number | null;
  }
): ToolApiKey | null {
  const db = getDb();
  const existing = getAccount(id);
  if (!existing) return null;
  const now = Math.floor(Date.now() / 1000);
  const fields: string[] = [];
  const values: unknown[] = [];

  if (patch.label !== undefined) {
    fields.push("label = ?");
    values.push(patch.label);
  }
  if (patch.api_key !== undefined) {
    fields.push("api_key_encrypted = ?");
    values.push(patch.api_key);
  }
  if (patch.sort_order !== undefined) {
    fields.push("sort_order = ?");
    values.push(patch.sort_order);
  }
  if (patch.status !== undefined) {
    fields.push("status = ?");
    values.push(patch.status);
  }
  if (patch.quota_limit !== undefined) {
    fields.push("quota_limit = ?");
    values.push(patch.quota_limit);
  }

  if (fields.length === 0) return existing;
  fields.push("updated_at = ?");
  values.push(now);
  values.push(id);

  db.prepare(`UPDATE tool_api_keys SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values
  );
  return getAccount(id);
}

/** Delete an account. Returns true if a row was removed. */
export function deleteAccount(id: string): boolean {
  const db = getDb();
  const result = db.prepare(`DELETE FROM tool_api_keys WHERE id = ?`).run(id);
  return result.changes > 0;
}

/** Reorder accounts by passing an array of ids in the desired order. */
export function reorderAccounts(toolId: string, ids: string[]): void {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const stmt = db.prepare(
    `UPDATE tool_api_keys SET sort_order = ?, updated_at = ? WHERE id = ? AND tool_id = ?`
  );
  const tx = db.transaction((orderedIds: string[]) => {
    orderedIds.forEach((id, idx) => {
      stmt.run((idx + 1) * 10, now, id, toolId);
    });
  });
  tx(ids);
}

/** Mark an account as used and clear any prior error. */
export function markAccountUsed(id: string): void {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    `UPDATE tool_api_keys
     SET quota_used = quota_used + 1,
         last_used = ?,
         last_error = NULL,
         last_error_at = NULL,
         cooldown_until = NULL,
         status = CASE WHEN status IN ('rate_limited','error') THEN 'active' ELSE status END,
         updated_at = ?
     WHERE id = ?`
  ).run(now, now, id);
}

/** Mark an account as rate-limited with a cooldown (default 5 min). */
export function markAccountRateLimited(
  id: string,
  errorMessage: string,
  cooldownSec: number = 300
): void {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    `UPDATE tool_api_keys
     SET status = 'rate_limited',
         last_error = ?,
         last_error_at = ?,
         cooldown_until = ?,
         updated_at = ?
     WHERE id = ?`
  ).run(errorMessage.slice(0, 500), now, now + cooldownSec, now, id);
}

/** Mark an account as errored (no auto-recovery — admin must fix or delete). */
export function markAccountError(id: string, errorMessage: string): void {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    `UPDATE tool_api_keys
     SET status = 'error',
         last_error = ?,
         last_error_at = ?,
         updated_at = ?
     WHERE id = ?`
  ).run(errorMessage.slice(0, 500), now, now, id);
}

/** Reset an account's quota (e.g. daily cron for quota_period='day'). */
export function resetAccountQuota(id: string): void {
  const db = getDb();
  db.prepare(`UPDATE tool_api_keys SET quota_used = 0 WHERE id = ?`).run(id);
}

/**
 * One-shot data migration: for any tool that has supports_multiple_keys=1 and
 * an api_key_encrypted on tool_configs, move it into tool_api_keys as the
 * first account. Safe to call repeatedly.
 */
export function migrateLegacyKeysToAccounts(): number {
  const db = getDb();
  const tools = db
    .prepare(
      `SELECT id, name, display_name, api_key_encrypted FROM tool_configs
       WHERE supports_multiple_keys = 1
         AND api_key_encrypted IS NOT NULL
         AND api_key_encrypted != ''`
    )
    .all() as { id: string; name: string; display_name: string | null; api_key_encrypted: string }[];

  let migrated = 0;
  const now = Math.floor(Date.now() / 1000);
  for (const t of tools) {
    const existingCount = db
      .prepare(`SELECT COUNT(*) as c FROM tool_api_keys WHERE tool_id = ?`)
      .get(t.id) as { c: number };
    if (existingCount.c > 0) continue; // already migrated

    const id = makeAccountId(t.id);
    db.prepare(
      `INSERT INTO tool_api_keys (
        id, tool_id, label, api_key_encrypted, sort_order, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 10, 'active', ?, ?)`
    ).run(
      id,
      t.id,
      `${t.display_name ?? t.name} - Cuenta principal`,
      t.api_key_encrypted,
      now,
      now
    );
    migrated++;
  }
  return migrated;
}
