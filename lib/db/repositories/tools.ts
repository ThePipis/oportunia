/**
 * Tools Repository - CRUD operations for tool_configs table.
 *
 * "Tools" en OportunIA son APIs externas (Google Places, Yelp, etc),
 * MCP servers, o LLM endpoints. Cada tool tiene su API key y config.
 */

import { getDb } from "../client";
import { randomUUID } from "node:crypto";

export type ToolType = "api_key" | "mcp_server" | "oauth" | "llm_endpoint";
export type ToolStatus =
  | "unconfigured"
  | "active"
  | "error"
  | "rate_limited"
  | "disabled";

export interface Tool {
  id: string;
  type: ToolType;
  name: string;
  display_name: string | null;
  description: string | null;
  api_key_encrypted: string | null;
  endpoint: string | null;
  config_json: string | null;
  status: ToolStatus;
  last_health_check: number | null;
  last_used: number | null;
  quota_used: number;
  quota_limit: number | null;
  quota_period: "day" | "month" | "request" | null;
  supports_multiple_keys: number;
  icon: string | null;
  docs_url: string | null;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

export interface NewTool {
  id?: string;
  type: ToolType;
  name: string;
  display_name?: string;
  description?: string;
  api_key?: string;
  endpoint?: string;
  config?: Record<string, unknown>;
  icon?: string;
  docs_url?: string;
  sort_order?: number;
  quota_limit?: number;
  quota_period?: "day" | "month" | "request";
}

/** Generate a new tool ID (slug-style) */
function makeToolId(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    randomUUID().slice(0, 8)
  );
}

export function listTools(): Tool[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM tool_configs ORDER BY sort_order ASC, name ASC`
    )
    .all() as Tool[];
}

export function getTool(id: string): Tool | null {
  const db = getDb();
  return (
    (db.prepare(`SELECT * FROM tool_configs WHERE id = ?`).get(id) as Tool) ??
    null
  );
}

export function getToolByName(name: string): Tool | null {
  const db = getDb();
  return (
    (db.prepare(`SELECT * FROM tool_configs WHERE name = ? LIMIT 1`).get(name) as Tool) ??
    null
  );
}

export function createTool(input: NewTool): Tool {
  const db = getDb();
  const id = input.id ?? makeToolId(input.name);
  const now = Math.floor(Date.now() / 1000);

  db.prepare(
    `INSERT INTO tool_configs (
      id, type, name, display_name, description, api_key_encrypted,
      endpoint, config_json, status, icon, docs_url, sort_order,
      quota_limit, quota_period, supports_multiple_keys, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.type,
    input.name,
    input.display_name ?? null,
    input.description ?? null,
    input.api_key ?? null,
    input.endpoint ?? null,
    input.config ? JSON.stringify(input.config) : null,
    "unconfigured",
    input.icon ?? null,
    input.docs_url ?? null,
    input.sort_order ?? 100,
    input.quota_limit ?? null,
    input.quota_period ?? null,
    (input as any).supports_multiple_keys ?? 0,
    now,
    now
  );

  return getTool(id)!;
}

export function updateTool(
  id: string,
  patch: Partial<NewTool>
): Tool | null {
  const db = getDb();
  const existing = getTool(id);
  if (!existing) return null;

  const now = Math.floor(Date.now() / 1000);
  const fields: string[] = [];
  const values: unknown[] = [];

  if (patch.type !== undefined) {
    fields.push("type = ?");
    values.push(patch.type);
  }
  if (patch.name !== undefined) {
    fields.push("name = ?");
    values.push(patch.name);
  }
  if (patch.display_name !== undefined) {
    fields.push("display_name = ?");
    values.push(patch.display_name);
  }
  if (patch.description !== undefined) {
    fields.push("description = ?");
    values.push(patch.description);
  }
  if (patch.api_key !== undefined) {
    fields.push("api_key_encrypted = ?");
    values.push(patch.api_key);
  }
  if (patch.endpoint !== undefined) {
    fields.push("endpoint = ?");
    values.push(patch.endpoint);
  }
  if (patch.config !== undefined) {
    fields.push("config_json = ?");
    values.push(JSON.stringify(patch.config));
  }
  if (patch.icon !== undefined) {
    fields.push("icon = ?");
    values.push(patch.icon);
  }
  if (patch.docs_url !== undefined) {
    fields.push("docs_url = ?");
    values.push(patch.docs_url);
  }
  if (patch.sort_order !== undefined) {
    fields.push("sort_order = ?");
    values.push(patch.sort_order);
  }
  if (patch.quota_limit !== undefined) {
    fields.push("quota_limit = ?");
    values.push(patch.quota_limit);
  }
  if (patch.quota_period !== undefined) {
    fields.push("quota_period = ?");
    values.push(patch.quota_period);
  }
  if ((patch as any).supports_multiple_keys !== undefined) {
    fields.push("supports_multiple_keys = ?");
    values.push((patch as any).supports_multiple_keys ? 1 : 0);
  }

  fields.push("updated_at = ?");
  values.push(now);

  values.push(id);
  db.prepare(`UPDATE tool_configs SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values
  );

  // If API key was just set, mark as active (will be verified by health check)
  if (patch.api_key) {
    db.prepare(
      `UPDATE tool_configs SET status = 'active', updated_at = ? WHERE id = ?`
    ).run(now, id);
  }

  return getTool(id);
}

export function deleteTool(id: string): boolean {
  const db = getDb();
  const result = db.prepare(`DELETE FROM tool_configs WHERE id = ?`).run(id);
  return result.changes > 0;
}

export function setToolStatus(
  id: string,
  status: ToolStatus,
  healthCheckTime: number = Math.floor(Date.now() / 1000)
): void {
  const db = getDb();
  db.prepare(
    `UPDATE tool_configs SET status = ?, last_health_check = ?, updated_at = ? WHERE id = ?`
  ).run(status, healthCheckTime, healthCheckTime, id);
}

export function incrementQuota(id: string, by: number = 1): void {
  const db = getDb();
  db.prepare(
    `UPDATE tool_configs SET quota_used = quota_used + ?, last_used = ? WHERE id = ?`
  ).run(by, Math.floor(Date.now() / 1000), id);
}

export function resetQuota(id: string): void {
  const db = getDb();
  db.prepare(`UPDATE tool_configs SET quota_used = 0 WHERE id = ?`).run(id);
}
