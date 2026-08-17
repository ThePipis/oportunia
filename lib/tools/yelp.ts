/**
 * Yelp Fusion API client.
 * Free tier: 5,000 calls/day.
 */

import { incrementQuota } from "@/lib/db/repositories/tools";

const API_BASE = "https://api.yelp.com/v3";

export interface YelpBusiness {
  id: string;
  alias: string;
  name: string;
  image_url: string;
  is_closed: boolean;
  url: string;
  review_count: number;
  categories: Array<{ alias: string; title: string }>;
  rating: number;
  coordinates: { latitude: number; longitude: number };
  transactions: string[];
  price?: string;
  location: {
    address1: string;
    address2?: string;
    address3?: string;
    city: string;
    zip_code: string;
    country: string;
    state: string;
    display_address: string[];
  };
  phone: string;
  display_phone: string;
  distance?: number;
}

export interface YelpReview {
  id: string;
  url: string;
  text: string;
  rating: number;
  time_created: string;
  user: { id: string; profile_url: string; image_url?: string; name: string };
}

export async function businessSearch(
  apiKey: string,
  params: {
    term?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    radius?: number; // meters
    categories?: string;
    limit?: number;
    price?: string; // "1,2,3,4"
    open_now?: boolean;
  }
): Promise<{ businesses: YelpBusiness[]; total: number }> {
  const qs = new URLSearchParams();
  if (params.term) qs.set("term", params.term);
  if (params.location) qs.set("location", params.location);
  if (params.latitude !== undefined) qs.set("latitude", String(params.latitude));
  if (params.longitude !== undefined) qs.set("longitude", String(params.longitude));
  if (params.radius) qs.set("radius", String(params.radius));
  if (params.categories) qs.set("categories", params.categories);
  if (params.limit) qs.set("limit", String(Math.min(params.limit, 50)));
  if (params.price) qs.set("price", params.price);
  if (params.open_now) qs.set("open_now", "true");

  const res = await fetch(`${API_BASE}/businesses/search?${qs}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  incrementQuota("yelp-fusion", 1);
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Yelp search HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }
  const data = await res.json();
  return {
    businesses: data.businesses ?? [],
    total: data.total ?? 0,
  };
}

export async function businessReviews(
  apiKey: string,
  businessId: string
): Promise<YelpReview[]> {
  const res = await fetch(`${API_BASE}/businesses/${businessId}/reviews`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  incrementQuota("yelp-fusion", 1);
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Yelp reviews HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.reviews ?? [];
}
