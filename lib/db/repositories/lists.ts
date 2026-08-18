/**
 * Lists Repository - CRUD for lists and list_items tables.
 */

import { getDb } from "../client";
import { randomUUID } from "node:crypto";

export interface List {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: number;
}

export interface ListItem {
  list_id: string;
  business_id: string;
  position: number;
  notes: string | null;
  added_at: number;
}

function makeId(): string {
  return "list-" + randomUUID().slice(0, 12);
}

export function listLists(): List[] {
  const db = getDb();
  return db.prepare(`SELECT * FROM lists ORDER BY created_at DESC`).all() as List[];
}

export function getList(id: string): List | null {
  const db = getDb();
  return (db.prepare(`SELECT * FROM lists WHERE id = ?`).get(id) as List) ?? null;
}

export function createList(input: { name: string; description?: string; color?: string }): List {
  const db = getDb();
  const id = makeId();
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    `INSERT INTO lists (id, name, description, color, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(id, input.name, input.description ?? null, input.color ?? "sky", now);
  return getList(id)!;
}

export function deleteList(id: string): boolean {
  const db = getDb();
  const result = db.prepare(`DELETE FROM lists WHERE id = ?`).run(id);
  return result.changes > 0;
}

export function addToList(listId: string, businessId: string, notes?: string): void {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const maxPos = (db.prepare(`SELECT MAX(position) as m FROM list_items WHERE list_id = ?`).get(listId) as { m: number | null })?.m ?? 0;
  db.prepare(
    `INSERT INTO list_items (list_id, business_id, position, notes, added_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(list_id, business_id) DO UPDATE SET notes = excluded.notes`
  ).run(listId, businessId, maxPos + 1, notes ?? null, now);
}

export function removeFromList(listId: string, businessId: string): boolean {
  const db = getDb();
  const result = db.prepare(`DELETE FROM list_items WHERE list_id = ? AND business_id = ?`).run(listId, businessId);
  return result.changes > 0;
}

export function getListItems(listId: string): Array<ListItem & { business_name: string; address: string | null; city: string | null; total_score: number | null; tier: string | null }> {
  const db = getDb();
  return db.prepare(
    `SELECT li.*, b.name as business_name, b.address, b.city,
            s.total_score, s.tier
     FROM list_items li
     JOIN businesses b ON b.id = li.business_id
     LEFT JOIN business_scores s ON s.business_id = li.business_id
     WHERE li.list_id = ?
     ORDER BY li.position ASC, li.added_at DESC`
  ).all(listId) as any[];
}
