/**
 * Shared types for the radar map components.
 */

export interface BusinessMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** e.g. "HVAC contractor", "Plumber", etc. */
  category?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  distanceMiles?: number | null;
  totalScore?: number | null;
  tier?: "hot" | "warm" | "nurture" | "skip" | null;
}

export interface RadarMapOrigin {
  lat: number;
  lng: number;
  /** Optional human label for the center pin */
  label?: string;
}
