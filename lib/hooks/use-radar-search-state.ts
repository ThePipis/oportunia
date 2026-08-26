"use client";

/**
 * useRadarSearchState — persists the Radar page's search state to
 * localStorage so the user doesn't lose their last search when they
 * navigate to a business profile and back.
 *
 * Persisted fields (form + map + results):
 *   - query, selectedCategoryIds, city, radiusMiles, maxResults
 *   - origin, selectedBusinessId
 *   - results, totalFound, searched
 *
 * NOT persisted:
 *   - loading (always starts false on mount)
 *   - error (errors are fresh-state, not durable)
 *
 * The hook handles SSR safely (no window access during render) and
 * swallows storage errors (quota, private mode, etc.) so the page
 * keeps working even if persistence fails.
 */

import * as React from "react";

const STORAGE_KEY = "oportunia.radar.lastSearch.v1";

export interface RadarSearchState {
  // Form
  query: string;
  selectedCategoryIds: string[];
  city: string;
  radiusMiles: number;
  maxResults: number | null;
  // Map
  origin: { lat: number; lng: number };
  selectedBusinessId: string | null;
  // Results
  results: SearchResult[];
  totalFound: number;
  searched: boolean;
}

export interface SearchResult {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  rating: number | null;
  review_count: number | null;
  distance_miles: number | null;
  primary_type: string | null;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  website?: string | null;
  total_score?: number | null;
  tier?: "hot" | "warm" | "nurture" | "skip" | null;
  matched_services_count?: number | null;
  matched_service_names?: string[] | null;
  matched_service_names_en?: string[] | null;
}

const DEFAULT_STATE: RadarSearchState = {
  query: "",
  selectedCategoryIds: [],
  city: "",
  radiusMiles: 5,
  maxResults: null,
  origin: { lat: 33.9425, lng: -117.5632 },
  selectedBusinessId: null,
  results: [],
  totalFound: 0,
  searched: false,
};

function loadFromStorage(): RadarSearchState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<RadarSearchState>;
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_STATE;

    // Merge onto defaults so missing/old fields fall back gracefully
    // if the schema evolves over time.
    return {
      ...DEFAULT_STATE,
      ...parsed,
      // Defensive type coercion for fields that might be wrong type
      query: typeof parsed.query === "string" ? parsed.query : DEFAULT_STATE.query,
      selectedCategoryIds: Array.isArray(parsed.selectedCategoryIds)
        ? parsed.selectedCategoryIds.filter((x) => typeof x === "string")
        : DEFAULT_STATE.selectedCategoryIds,
      city: typeof parsed.city === "string" ? parsed.city : DEFAULT_STATE.city,
      radiusMiles:
        typeof parsed.radiusMiles === "number" && parsed.radiusMiles > 0
          ? parsed.radiusMiles
          : DEFAULT_STATE.radiusMiles,
      maxResults:
        typeof parsed.maxResults === "number" && parsed.maxResults > 0
          ? parsed.maxResults
          : null,
      origin:
        parsed.origin &&
        typeof parsed.origin.lat === "number" &&
        typeof parsed.origin.lng === "number"
          ? parsed.origin
          : DEFAULT_STATE.origin,
      selectedBusinessId:
        typeof parsed.selectedBusinessId === "string"
          ? parsed.selectedBusinessId
          : null,
      results: Array.isArray(parsed.results) ? parsed.results : [],
      totalFound:
        typeof parsed.totalFound === "number" ? parsed.totalFound : 0,
      searched: parsed.searched === true,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveToStorage(state: RadarSearchState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded / private mode / etc. — silently drop, the in-memory
    // state still works for the current session.
  }
}

export interface UseRadarSearchState {
  state: RadarSearchState;
  /** Merge a partial update into the persisted state */
  update: (partial: Partial<RadarSearchState>) => void;
  /** Reset to defaults and clear localStorage */
  clear: () => void;
  /** True once the state has been hydrated from localStorage on the client.
   *  Use this to avoid hydration mismatches when first rendering persisted
   *  values (e.g. the city field). */
  hydrated: boolean;
}

export function useRadarSearchState(): UseRadarSearchState {
  const [state, setState] = React.useState<RadarSearchState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = React.useState(false);

  // Hydrate from localStorage exactly once on mount
  React.useEffect(() => {
    setState(loadFromStorage());
    setHydrated(true);
  }, []);

  // Persist on every change after hydration. We exclude the effect
  // dependency check on `state` itself intentionally not — we want every
  // change to be saved. The `hydrated` guard prevents the initial default
  // state from clobbering the stored one.
  React.useEffect(() => {
    if (!hydrated) return;
    saveToStorage(state);
  }, [state, hydrated]);

  const update = React.useCallback((partial: Partial<RadarSearchState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const clear = React.useCallback(() => {
    setState(DEFAULT_STATE);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
  }, []);

  return { state, update, clear, hydrated };
}
