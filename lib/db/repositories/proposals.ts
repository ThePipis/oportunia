/**
 * Proposals Repository - CRUD for proposals table.
 *
 * Stores generated proposals for businesses.
 */

import { getDb } from "../client";
import { randomUUID } from "node:crypto";

export interface Proposal {
  id: string;
  business_id: string;
  title: string;
  content_json: string;
  pdf_path: string | null;
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected";
  total_setup_price: number;
  total_monthly_price: number;
  services_included: string;
  sent_at: number | null;
  viewed_at: number | null;
  responded_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface NewProposal {
  business_id: string;
  title: string;
  content: object;
  total_setup_price?: number;
  total_monthly_price?: number;
  services_included?: string[];
}

function makeId(): string {
  return "prop-" + randomUUID().slice(0, 12);
}

export function listProposals(businessId?: string): Proposal[] {
  const db = getDb();
  if (businessId) {
    return db
      .prepare(`SELECT * FROM proposals WHERE business_id = ? ORDER BY created_at DESC`)
      .all(businessId) as Proposal[];
  }
  return db
    .prepare(`SELECT * FROM proposals ORDER BY created_at DESC LIMIT 50`)
    .all() as Proposal[];
}

export function getProposal(id: string): Proposal | null {
  const db = getDb();
  return (
    (db.prepare(`SELECT * FROM proposals WHERE id = ?`).get(id) as Proposal) ??
    null
  );
}

export function getLatestProposalForBusiness(
  businessId: string
): Proposal | null {
  const db = getDb();
  return (
    (db
      .prepare(
        `SELECT * FROM proposals WHERE business_id = ? ORDER BY created_at DESC LIMIT 1`
      )
      .get(businessId) as Proposal) ?? null
  );
}

export function createProposal(input: NewProposal): Proposal {
  const db = getDb();
  const id = makeId();
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    `INSERT INTO proposals (
      id, business_id, title, content_json, status,
      total_setup_price, total_monthly_price, services_included,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.business_id,
    input.title,
    JSON.stringify(input.content),
    input.total_setup_price ?? 0,
    input.total_monthly_price ?? 0,
    JSON.stringify(input.services_included ?? []),
    now,
    now
  );
  return getProposal(id)!;
}

export function updateProposal(
  id: string,
  patch: Partial<{
    title: string;
    content: object;
    status: "draft" | "sent" | "viewed" | "accepted" | "rejected";
    pdf_path: string;
    total_setup_price: number;
    total_monthly_price: number;
  }>
): Proposal | null {
  const db = getDb();
  const existing = getProposal(id);
  if (!existing) return null;
  const now = Math.floor(Date.now() / 1000);
  const fields: string[] = [];
  const values: unknown[] = [];
  if (patch.title !== undefined) { fields.push("title = ?"); values.push(patch.title); }
  if (patch.content !== undefined) { fields.push("content_json = ?"); values.push(JSON.stringify(patch.content)); }
  if (patch.status !== undefined) {
    fields.push("status = ?");
    values.push(patch.status);
    if (patch.status === "sent") { fields.push("sent_at = ?"); values.push(now); }
    if (patch.status === "viewed") { fields.push("viewed_at = ?"); values.push(now); }
    if (patch.status === "accepted" || patch.status === "rejected") { fields.push("responded_at = ?"); values.push(now); }
  }
  if (patch.pdf_path !== undefined) { fields.push("pdf_path = ?"); values.push(patch.pdf_path); }
  if (patch.total_setup_price !== undefined) { fields.push("total_setup_price = ?"); values.push(patch.total_setup_price); }
  if (patch.total_monthly_price !== undefined) { fields.push("total_monthly_price = ?"); values.push(patch.total_monthly_price); }
  fields.push("updated_at = ?");
  values.push(now);
  values.push(id);
  db.prepare(`UPDATE proposals SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getProposal(id);
}

export function deleteProposal(id: string): boolean {
  const db = getDb();
  const result = db.prepare(`DELETE FROM proposals WHERE id = ?`).run(id);
  return result.changes > 0;
}
