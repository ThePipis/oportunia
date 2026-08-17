/**
 * Businesses Repository - CRUD for businesses table.
 *
 * Stores prospect businesses found via Google Places, Yelp, etc.
 * De-duplicates by google_place_id.
 */

import { getDb } from "../client";
import { randomUUID } from "node:crypto";

export interface Business {
  id: string;
  google_place_id: string | null;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  google_rating: number | null;
  review_count: number | null;
  hours_json: string | null;
  business_types: string | null;
  primary_type: string | null;
  photos_json: string | null;
  source_url: string | null;
  source_engine: string | null;
  sector_id: string | null;
  sector_confidence: number | null;
  distance_miles: number | null;
  last_crawled: number | null;
  raw_data_json: string | null;
  created_at: number;
  updated_at: number;
}

export interface NewBusiness {
  google_place_id?: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  website?: string;
  email?: string;
  google_rating?: number;
  review_count?: number;
  hours_json?: string;
  business_types?: string;
  primary_type?: string;
  photos_json?: string;
  source_url?: string;
  source_engine?: string;
  sector_id?: string;
  sector_confidence?: number;
  distance_miles?: number;
  last_crawled?: number;
  raw_data_json?: string;
}

function makeId(): string {
  return "biz-" + randomUUID().slice(0, 12);
}

export function listBusinesses(options: {
  limit?: number;
  city?: string;
  minScore?: number;
  tier?: "hot" | "warm" | "nurture" | "skip";
} = {}): (Business & { total_score?: number; tier?: string })[] {
  const db = getDb();
  const limit = options.limit ?? 100;
  const params: unknown[] = [];
  let where = "1=1";

  if (options.city) {
    where += " AND LOWER(b.city) = LOWER(?)";
    params.push(options.city);
  }
  if (options.tier) {
    where += " AND s.tier = ?";
    params.push(options.tier);
  }
  if (options.minScore !== undefined) {
    where += " AND s.total_score >= ?";
    params.push(options.minScore);
  }

  return db
    .prepare(
      `SELECT b.*, s.total_score, s.tier
       FROM businesses b
       LEFT JOIN business_scores s ON s.business_id = b.id
       WHERE ${where}
       ORDER BY COALESCE(s.total_score, 0) DESC, b.created_at DESC
       LIMIT ?`
    )
    .all(...params, limit) as any;
}

export function getBusiness(id: string): Business | null {
  const db = getDb();
  return (
    (db.prepare(`SELECT * FROM businesses WHERE id = ?`).get(id) as Business) ??
    null
  );
}

export function getBusinessByPlaceId(placeId: string): Business | null {
  const db = getDb();
  return (
    (db
      .prepare(`SELECT * FROM businesses WHERE google_place_id = ?`)
      .get(placeId) as Business) ?? null
  );
}

export function upsertBusiness(input: NewBusiness): Business {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  // Try to find existing by google_place_id first
  if (input.google_place_id) {
    const existing = getBusinessByPlaceId(input.google_place_id);
    if (existing) {
      // Update
      const fields: string[] = [];
      const values: unknown[] = [];
      const updatable: (keyof NewBusiness)[] = [
        "name",
        "address",
        "city",
        "state",
        "zip",
        "lat",
        "lng",
        "phone",
        "website",
        "google_rating",
        "review_count",
        "hours_json",
        "business_types",
        "primary_type",
        "photos_json",
        "source_url",
        "source_engine",
        "sector_id",
        "sector_confidence",
        "distance_miles",
        "last_crawled",
        "raw_data_json",
      ];
      for (const key of updatable) {
        if (input[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(input[key] as any);
        }
      }
      fields.push("updated_at = ?");
      values.push(now);
      values.push(existing.id);

      if (fields.length > 1) {
        db.prepare(
          `UPDATE businesses SET ${fields.join(", ")} WHERE id = ?`
        ).run(...values);
      }
      return getBusiness(existing.id)!;
    }
  }

  // Insert new
  const id = makeId();
  db.prepare(
    `INSERT INTO businesses (
      id, google_place_id, name, address, city, state, zip, country,
      lat, lng, phone, website, email,
      google_rating, review_count, hours_json, business_types, primary_type,
      photos_json, source_url, source_engine,
      sector_id, sector_confidence, distance_miles,
      last_crawled, raw_data_json, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?
    )`
  ).run(
    id,
    input.google_place_id ?? null,
    input.name,
    input.address ?? null,
    input.city ?? null,
    input.state ?? null,
    input.zip ?? null,
    input.country ?? "US",
    input.lat ?? null,
    input.lng ?? null,
    input.phone ?? null,
    input.website ?? null,
    input.email ?? null,
    input.google_rating ?? null,
    input.review_count ?? null,
    input.hours_json ?? null,
    input.business_types ?? null,
    input.primary_type ?? null,
    input.photos_json ?? null,
    input.source_url ?? null,
    input.source_engine ?? null,
    input.sector_id ?? null,
    input.sector_confidence ?? null,
    input.distance_miles ?? null,
    input.last_crawled ?? null,
    input.raw_data_json ?? null,
    now,
    now
  );

  return getBusiness(id)!;
}

export function deleteBusiness(id: string): boolean {
  const db = getDb();
  const result = db.prepare(`DELETE FROM businesses WHERE id = ?`).run(id);
  return result.changes > 0;
}

export function countBusinesses(): number {
  const db = getDb();
  return (
    db.prepare(`SELECT COUNT(*) as c FROM businesses`).get() as { c: number }
  ).c;
}
