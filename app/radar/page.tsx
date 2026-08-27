"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import LocationSearch from "@/components/map/location-search";
import CategoryMultiSelect from "@/components/map/category-multi-select";
import IconAction from "@/components/map/icon-action";
import AddToListButton from "@/components/map/add-to-list-button";
import AddToCrmButton from "@/components/map/add-to-crm-button";
import type { BusinessMarker } from "@/lib/map/types";
import { milesToMeters, metersToMiles } from "@/lib/utils/distance";
import {
  useRadarSearchState,
  type SearchResult,
} from "@/lib/hooks/use-radar-search-state";
import { translateCategory } from "@/lib/categories/category-i18n";

// Leaflet uses `window`, so the map must be dynamically imported with ssr:false
const RadarMap = dynamic(() => import("@/components/map/radar-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-slate-900/50 rounded-lg">
      <div className="inline-block w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      <span className="ml-3 text-slate-400">Cargando mapa...</span>
    </div>
  ),
});

interface SearchResponse {
  results: SearchResult[];
  saved: number;
  total_found: number;
  omitted_in_lists?: number;
  error?: string;
}

type SortKey =
  | "score"
  | "services"
  | "name"
  | "category"
  | "city"
  | "address"
  | "phone"
  | "web"
  | "rating"
  | "distance";

const SORT_KEYS = [
  "score",
  "services",
  "name",
  "category",
  "city",
  "address",
  "phone",
  "web",
  "rating",
  "distance",
] as const;

/**
 * SortableHeader — clickable table column header with sort indicator.
 * Renders the column label + a small arrow that shows the current sort
 * direction. Click cycles: desc ↔ asc ↔ none.
 */
function SortableHeader({
  column,
  label,
  sortBy,
  sortDir,
  onSort,
  className,
}: {
  column: SortKey;
  label: React.ReactNode;
  sortBy: string | null;
  sortDir: "asc" | "desc";
  onSort: (c: any) => void;
  className?: string;
}) {
  const isActive = sortBy === column;
  const arrow = isActive ? (sortDir === "asc" ? "▲" : "▼") : "↕";
  return (
    <th
      className={`sticky top-0 z-30 bg-slate-100 dark:bg-slate-900 font-semibold py-2 px-2 whitespace-nowrap select-none cursor-pointer text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white transition-colors border-b border-slate-200 dark:border-white/10 ${
        isActive ? "text-sky-700 bg-sky-100/90 dark:text-sky-300 dark:bg-sky-500/20" : ""
      } ${className ?? ""}`}
      onClick={() => onSort(column)}
      role="button"
      tabIndex={0}
      aria-sort={
        isActive ? (sortDir === "asc" ? "ascending" : "descending") : "none"
      }
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSort(column);
        }
      }}
    >
      <span className="inline-flex items-center gap-1.5 pointer-events-none">
        <span>{label}</span>
        <span
          className={`text-[10px] font-mono leading-none ${
            isActive ? "text-sky-600 dark:text-sky-400 font-bold" : "text-slate-400 dark:text-slate-500"
          }`}
          aria-hidden="true"
        >
          {arrow}
        </span>
      </span>
    </th>
  );
}

function ClickToCopyPhone({ phone }: { phone: string }) {
  const { t } = useT();
  const [copied, setCopied] = React.useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 font-mono font-medium hover:underline text-left cursor-pointer transition-colors"
      title={t("common.copyPhone", "Clic para copiar teléfono")}
    >
      <span>{phone}</span>
      {copied && (
        <span className="text-[10px] font-sans font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 animate-in fade-in">
          ✓ {t("common.copied", "Copiado")}
        </span>
      )}
    </button>
  );
}

function CopyButton({
  text,
  label,
  className,
}: {
  text?: string | null;
  label: string;
  className?: string;
}) {
  const { t } = useT();
  const [copied, setCopied] = React.useState(false);

  if (!text || text.trim().length === 0) return null;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore clipboard error */
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all shrink-0 select-none cursor-pointer ${
        copied
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-500/40"
          : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
      } ${className ?? ""}`}
      title={copied ? t("common.copied", "¡Copiado!") : `${t("common.copy", "Copiar")} ${label}`}
      aria-label={`${t("common.copy", "Copiar")} ${label}`}
    >
      <span className="text-[10px] leading-none">{copied ? "✓" : "📋"}</span>
      <span>{copied ? t("common.copied", "Copiado") : t("common.copy", "Copiar")}</span>
    </button>
  );
}

export default function RadarPage() {
  const { t, locale } = useT();
  const { state, update, clear, hydrated } = useRadarSearchState();

  // Destructure the persisted state for convenient access in JSX / handlers
  const {
    query,
    selectedCategoryIds,
    city,
    radiusMiles,
    maxResults,
    origin,
    selectedBusinessId,
    results,
    totalFound,
    searched,
  } = state;

  // Transient (not persisted): loading + error. These reset on every mount.
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Hover highlight — purely visual, does NOT persist. Allows the user to
  // sweep the mouse down the list and see the corresponding pin glow on
  // the map without committing to a selection.
  const [hoveredBusinessId, setHoveredBusinessId] = React.useState<
    string | null
  >(null);
  const effectiveSelectedId = hoveredBusinessId ?? selectedBusinessId;
  const [focusTick, setFocusTick] = React.useState<number>(0);
  
  // Persistent filter collapse state (remembers user preference)
  const FILTER_COLLAPSED_STORAGE_KEY = "oportunia.radar.filterCollapsed.v1";
  const [isFilterCollapsed, setIsFilterCollapsed] = React.useState<boolean>(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(FILTER_COLLAPSED_STORAGE_KEY);
      if (stored !== null) {
        setIsFilterCollapsed(stored === "true");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggleFilterCollapsed = () => {
    setIsFilterCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(FILTER_COLLAPSED_STORAGE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const [expandedRowId, setExpandedRowId] = React.useState<string | null>(null);

  const toggleRowExpand = React.useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedRowId((prev) => (prev === id ? null : id));
  }, []);

const KNOWN_CITIES = [
  "Eastvale", "Corona", "Norco", "Riverside", "Jurupa Valley", "Mira Loma",
  "Ontario", "Rancho Cucamonga", "Chino Hills", "Chino", "Fontana",
  "Moreno Valley", "Upland", "Montclair", "Pomona", "Claremont", "San Dimas",
  "Rialto", "San Bernardino", "Colton", "Grand Terrace", "Loma Linda",
  "Redlands", "Temecula", "Murrieta", "Menifee", "Lake Elsinore", "Perris",
  "Wildomar", "Canyon Lake", "Beaumont", "Banning", "Yucaipa", "Highland",
  "Anaheim", "Orange", "Fullerton", "Irvine", "Santa Ana", "Garden Grove",
  "Huntington Beach", "Newport Beach", "Costa Mesa", "Tustin", "Placentia",
  "Yorba Linda", "Brea", "Diamond Bar", "Walnut", "Rowland Heights",
  "West Covina", "Covina", "Glendora", "Azusa", "Pasadena", "Los Angeles", "Long Beach"
];

function sanitizeCityCandidate(str?: string | null): string | null {
  if (!str) return null;
  let c = str.trim().replace(/^[",'\s]+|[",'\s]+$/g, "");
  // If it contains any digits (street numbers, zip codes, office numbers e.g. "Office 258", "CA 91752") -> invalid city
  if (/\d/.test(c)) return null;
  // If it contains unit or street keywords -> invalid city
  if (/\b(office|suite|ste|unit|bldg|building|dept|floor|fl|rm|room|space|spc|apt|lot|box|po\s*box|#)\b/i.test(c)) return null;
  if (/\b(ave|avenue|st|street|blvd|boulevard|rd|road|dr|drive|hwy|highway|pkwy|parkway|lane|ln|way|ct|court|circle|cir|terrace|ter|pl|place)\b/i.test(c)) return null;
  // If it's just state abbreviation e.g. "CA"
  if (/^[A-Z]{2}$/i.test(c)) return null;
  // Clean trailing state or zip if attached
  c = c.replace(/,\s*(CA|California).*$/i, "").trim();
  return c.length >= 2 ? c : null;
}

function getBusinessCity(r: SearchResult): string {
  // 1. Scan address for known Southern California / Inland Empire cities FIRST (most accurate)
  if (r.address) {
    for (const known of KNOWN_CITIES) {
      const regex = new RegExp(`\\b${known}\\b`, "i");
      if (regex.test(r.address)) {
        return known;
      }
    }
  }

  // 2. Check if stored r.city is valid and not a street/unit/number
  const validStored = sanitizeCityCandidate(r.city);
  if (validStored) {
    const match = KNOWN_CITIES.find((k) => k.toLowerCase() === validStored.toLowerCase());
    return match ?? validStored;
  }

  // 3. Fallback generic parsing from address segments
  if (r.address) {
    const parts = r.address.split(",").map((p) => p.trim()).filter(Boolean);
    while (parts.length > 0) {
      const seg = parts.pop();
      const clean = sanitizeCityCandidate(seg);
      if (clean) return clean;
    }
  }

  return "—";
}

function getBusinessCategory(
  r: SearchResult,
  selectedCategoryIds: string[] = [],
  currentLocale: "es" | "en" = "es"
): string {
  // 1. If user searched for specific categories, check if the business matches any of them
  if (selectedCategoryIds.length > 0) {
    const nameLower = r.name.toLowerCase();
    const typeLower = (r.primary_type || "").toLowerCase().replace(/_/g, " ");

    for (const catId of selectedCategoryIds) {
      const catKey = catId.toLowerCase().replace(/_/g, " ");
      if (
        typeLower.includes(catKey) ||
        nameLower.includes(catKey) ||
        (catKey === "plumber" && (nameLower.includes("plumb") || nameLower.includes("rooter") || nameLower.includes("repipe") || typeLower.includes("plumb"))) ||
        (catKey === "contractor" && (nameLower.includes("contract") || nameLower.includes("construct") || nameLower.includes("remodel") || typeLower.includes("contract"))) ||
        (catKey === "restaurant" && (nameLower.includes("restaur") || nameLower.includes("grill") || nameLower.includes("cafe") || nameLower.includes("kitchen") || typeLower.includes("food") || typeLower.includes("restaurant"))) ||
        (catKey === "bakery" && (nameLower.includes("bake") || nameLower.includes("panad") || nameLower.includes("pastry") || nameLower.includes("cake") || typeLower.includes("bakery")))
      ) {
        return translateCategory(catId, currentLocale);
      }
    }
  }

  // 2. Format and translate primary_type cleanly (if valid and not too generic)
  const rawType = (r.primary_type || "").trim().toLowerCase();
  if (rawType && rawType !== "point_of_interest" && rawType !== "establishment" && rawType !== "unknown") {
    const translated = translateCategory(r.primary_type, currentLocale);
    if (translated && translated !== "—") return translated;
  }

  // 3. Smart Name & Keyword Heuristic Fallbacks (when Google Places leaves primaryType empty)
  const n = r.name.toLowerCase();
  if (n.includes("embroid") || n.includes("stitch") || n.includes("apparel") || n.includes("custom wear") || n.includes("uniform")) {
    return currentLocale === "en" ? "Embroidery & Custom Stitching" : "Bordados & Confección";
  }
  if (n.includes("auto") || n.includes("tint") || n.includes("tire") || n.includes("smog") || n.includes("mechanic") || n.includes("motor") || n.includes("brake") || n.includes("lube") || n.includes("car care") || n.includes("body shop")) {
    return currentLocale === "en" ? "Auto Services & Repair" : "Taller Mecánico / Automotriz";
  }
  if (n.includes("dental") || n.includes("dentist") || n.includes("ortho") || n.includes("smile") || n.includes("teeth")) {
    return currentLocale === "en" ? "Dental Clinic" : "Dentista / Odontología";
  }
  if (n.includes("plumb") || n.includes("rooter") || n.includes("drain") || n.includes("pipe") || n.includes("water heater")) {
    return currentLocale === "en" ? "Plumbing Services" : "Plomería & Fontanería";
  }
  if (n.includes("roof") || n.includes("roofing") || n.includes("solar") || n.includes("gutter")) {
    return currentLocale === "en" ? "Roofing & Solar Contractor" : "Tejados & Roofing";
  }
  if (n.includes("hvac") || n.includes("air condition") || n.includes("heating") || n.includes("cooling")) {
    return currentLocale === "en" ? "HVAC & Climate Control" : "Climatización (HVAC)";
  }
  if (n.includes("contract") || n.includes("construct") || n.includes("remodel") || n.includes("builder") || n.includes("electric")) {
    return currentLocale === "en" ? "General Contractor" : "Contratista General";
  }
  if (n.includes("law") || n.includes("attorney") || n.includes("legal") || n.includes("lawyer") || n.includes("advocate")) {
    return currentLocale === "en" ? "Law Firm / Legal" : "Abogados / Bufete Legal";
  }
  if (n.includes("cpa") || n.includes("tax") || n.includes("accounting") || n.includes("bookkeep") || n.includes("financial")) {
    return currentLocale === "en" ? "Accounting & Taxes (CPA)" : "Contabilidad & Impuestos (CPA)";
  }
  if (n.includes("real estate") || n.includes("realty") || n.includes("properties") || n.includes("escrow") || n.includes("mortgage")) {
    return currentLocale === "en" ? "Real Estate Agency" : "Bienes Raíces / Inmobiliaria";
  }
  if (n.includes("cafe") || n.includes("coffee") || n.includes("bake") || n.includes("cake") || n.includes("donut") || n.includes("pizza") || n.includes("taco") || n.includes("grill") || n.includes("burger") || n.includes("bistro") || n.includes("kitchen") || n.includes("restaurant") || n.includes("diner") || n.includes("sushi")) {
    return currentLocale === "en" ? "Restaurant / Food & Beverage" : "Restaurante / Alimentos";
  }
  if (n.includes("salon") || n.includes("barber") || n.includes("spa") || n.includes("beauty") || n.includes("lash") || n.includes("nail") || n.includes("hair") || n.includes("esthetics")) {
    return currentLocale === "en" ? "Beauty & Personal Care" : "Salón de Belleza & Estética";
  }
  if (n.includes("clean") || n.includes("maid") || n.includes("janitorial") || n.includes("wash") || n.includes("pressure wash")) {
    return currentLocale === "en" ? "Cleaning & Maintenance" : "Servicios de Limpieza";
  }
  if (n.includes("market") || n.includes("store") || n.includes("shop") || n.includes("boutique") || n.includes("mart") || n.includes("retail") || n.includes("supply") || n.includes("jewel") || n.includes("florist")) {
    return currentLocale === "en" ? "Store / Retail Commerce" : "Tienda / Comercio Local";
  }
  if (n.includes("inc") || n.includes("corp") || n.includes("llc") || n.includes("group") || n.includes("enterprise") || n.includes("industr") || n.includes("holdings") || n.includes("partners") || n.includes("management") || n.includes("logistics")) {
    return currentLocale === "en" ? "Company / Corporate Office" : "Empresa / Corporativo";
  }

  // 4. Professional Generic Fallback (never leave a cold blank "—")
  return currentLocale === "en" ? "Local Business / Company" : "Negocio Local / Empresa";
}

  // ───────── Score Tier Filters (HOT, WARM, NURTURE, SKIP) ─────────
  type ScoreTier = "hot" | "warm" | "nurture" | "skip";
  const [selectedTiers, setSelectedTiers] = React.useState<ScoreTier[]>([]);

  const toggleTier = (tier: ScoreTier) => {
    setSelectedTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  // ───────── Sort state (transient — default sort by SCORE DESC) ─────────
  const [sortBy, setSortBy] = React.useState<SortKey | null>("score");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  // ───────── Auto-Sync Scores with SQLite Database on Mount / Return ─────────
  React.useEffect(() => {
    if (!hydrated || !results || results.length === 0) return;

    const ids = results.map((r) => r.id).filter(Boolean);
    if (ids.length === 0) return;

    fetch("/api/businesses/batch-scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data?.scores) return;
        let changed = false;
        const updatedResults = results.map((item) => {
          const latest = data.scores[item.id];
          if (latest) {
            const hasScoreChange = latest.total_score !== item.total_score || latest.tier !== item.tier;
            const hasServiceChange = latest.matched_services_count !== item.matched_services_count;
            if (hasScoreChange || hasServiceChange || !item.matched_service_names) {
              changed = true;
              return {
                ...item,
                total_score: latest.total_score,
                tier: latest.tier,
                matched_services_count: latest.matched_services_count,
                matched_service_names: latest.matched_service_names,
                matched_service_names_en: latest.matched_service_names_en,
              };
            }
          }
          return item;
        });

        if (changed) {
          update({ results: updatedResults });
        }
      })
      .catch((err) => {
        console.warn("[radar] Failed to sync batch scores:", err);
      });
  }, [hydrated]);

  // ───────── Multi-Select & Batch Actions State ─────────
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [excludeSavedInLists, setExcludeSavedInLists] = React.useState<boolean>(true);
  const [omittedInListsCount, setOmittedInListsCount] = React.useState<number>(0);

  // Send to list dialog state
  const [isListModalOpen, setIsListModalOpen] = React.useState<boolean>(false);
  const [availableLists, setAvailableLists] = React.useState<Array<{ id: string; name: string; color: string; description: string | null }>>([]);
  const [loadingLists, setLoadingLists] = React.useState<boolean>(false);
  const [targetListId, setTargetListId] = React.useState<string>("");
  const [isCreatingInlineList, setIsCreatingInlineList] = React.useState<boolean>(false);
  const [newListName, setNewListName] = React.useState<string>("");
  const [newListColor, setNewListColor] = React.useState<string>("sky");
  const [batchActionLoading, setBatchActionLoading] = React.useState<boolean>(false);
  const [batchSuccessMsg, setBatchSuccessMsg] = React.useState<string | null>(null);

  // Multi-select handlers with Shift+Click Range Selection support
  const lastSelectedIdRef = React.useRef<string | null>(null);

  const toggleSelect = (id: string, shiftKey: boolean = false) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const isCurrentlySelected = next.has(id);

      if (shiftKey && lastSelectedIdRef.current && lastSelectedIdRef.current !== id) {
        const currentList = paginatedResults;
        const fromIdx = currentList.findIndex((r) => r.id === lastSelectedIdRef.current);
        const toIdx = currentList.findIndex((r) => r.id === id);

        if (fromIdx !== -1 && toIdx !== -1) {
          const [start, end] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
          const range = currentList.slice(start, end + 1);
          const shouldCheck = !isCurrentlySelected;
          range.forEach((item) => {
            if (shouldCheck) next.add(item.id);
            else next.delete(item.id);
          });
          lastSelectedIdRef.current = id;
          return next;
        }
      }

      if (isCurrentlySelected) {
        next.delete(id);
      } else {
        next.add(id);
      }
      lastSelectedIdRef.current = id;
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filteredResults.map((r) => r.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    lastSelectedIdRef.current = null;
  };

  // Open list modal & fetch lists
  const openSendToListModal = async () => {
    if (selectedIds.size === 0) return;
    setIsListModalOpen(true);
    setLoadingLists(true);
    try {
      const res = await fetch("/api/lists");
      const data = await res.json();
      const lists = data.lists ?? [];
      setAvailableLists(lists);
      if (lists.length > 0 && !targetListId) {
        setTargetListId(lists[0].id);
      }
    } catch (err) {
      console.error("Failed to load lists:", err);
    } finally {
      setLoadingLists(false);
    }
  };

  // Submit batch add to list
  const handleBatchAddToList = async () => {
    let finalTargetListId = targetListId;

    if (isCreatingInlineList) {
      if (!newListName.trim()) return;
      setBatchActionLoading(true);
      try {
        const createRes = await fetch("/api/lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newListName.trim(), color: newListColor }),
        });
        const createData = await createRes.json();
        if (!createRes.ok || !createData.list) {
          throw new Error(createData.error || "Error al crear la lista");
        }
        finalTargetListId = createData.list.id;
        setAvailableLists((prev) => [createData.list, ...prev]);
        setTargetListId(createData.list.id);
        setIsCreatingInlineList(false);
        setNewListName("");
      } catch (err: any) {
        setError(err.message || "Error al crear lista");
        setBatchActionLoading(false);
        return;
      }
    }

    if (!finalTargetListId) return;

    setBatchActionLoading(true);
    try {
      const businessIds = Array.from(selectedIds);
      const res = await fetch(`/api/lists/${finalTargetListId}/items/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al agregar a la lista");
      }

      const count = data.addedCount ?? businessIds.length;
      const targetListObj = availableLists.find((l) => l.id === finalTargetListId);
      const listName = targetListObj ? targetListObj.name : data.listName || "Lista";
      setBatchSuccessMsg(`✅ ${count} negocios agregados a "${listName}"`);

      // If excludeSavedInLists is active, remove saved items from current radar results
      if (excludeSavedInLists) {
        const idSet = new Set(businessIds);
        const remaining = results.filter((r) => !idSet.has(r.id));
        update({
          results: remaining,
          totalFound: remaining.length,
        });
        setOmittedInListsCount((prev) => prev + count);
      }

      setSelectedIds(new Set());
      setIsListModalOpen(false);

      setTimeout(() => {
        setBatchSuccessMsg(null);
      }, 4000);
    } catch (err: any) {
      setError(err.message || "Error en guardado masivo");
    } finally {
      setBatchActionLoading(false);
    }
  };

  // Submit batch add to CRM
  const handleBatchAddToCrm = async () => {
    if (selectedIds.size === 0) return;
    setBatchActionLoading(true);
    try {
      const business_ids = Array.from(selectedIds);
      const res = await fetch("/api/crm/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_ids, stage: "lead" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al mover al CRM");

      setBatchSuccessMsg(`🚀 ${data.movedCount ?? business_ids.length} negocios agregados al Pipeline CRM como Nuevos Leads`);
      setSelectedIds(new Set());

      setTimeout(() => {
        setBatchSuccessMsg(null);
      }, 4000);
    } catch (err: any) {
      setError(err.message || "Error al mover al CRM");
    } finally {
      setBatchActionLoading(false);
    }
  };

  const handleSort = React.useCallback(
    (column: SortKey) => {
      if (sortBy === column) {
        // Toggle strictly between asc and desc (2 states only)
        setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(column);
        if (column === "score" || column === "rating") {
          setSortDir("desc");
        } else {
          setSortDir("asc");
        }
      }
    },
    [sortBy]
  );

  // AbortController for cancelling in-flight searches
  const searchAbortRef = React.useRef<AbortController | null>(null);

  const handleCancelSearch = React.useCallback(
    (e?: React.MouseEvent | React.TouchEvent | React.FormEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (searchAbortRef.current) {
        try {
          searchAbortRef.current.abort();
        } catch {
          /* ignore */
        }
        searchAbortRef.current = null;
      }
      setLoading(false);
    },
    []
  );

  const canSearch = true;

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) {
      handleCancelSearch(e);
      return;
    }
    if (!canSearch) return;

    // Validation: if a city was typed, verify it contains alphanumeric characters
    const trimmedCity = city.trim();
    if (trimmedCity.length > 0) {
      const hasValidText = /[a-zA-Z0-9]/.test(trimmedCity);
      if (!hasValidText || trimmedCity.length < 2) {
        setError("Ingresá un nombre de ciudad o dirección válido, o limpiá el campo para buscar libremente en el mapa.");
        return;
      }
    }

    const controller = new AbortController();
    searchAbortRef.current = controller;
    setLoading(true);
    setError(null);
    setSelectedIds(new Set());
    update({ searched: true, selectedBusinessId: null });

    try {
      const res = await fetch("/api/radar/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          query: query.trim(),
          categoryIds: selectedCategoryIds,
          city: trimmedCity,
          origin,
          radiusMiles,
          maxResults,
          excludeSavedInLists,
        }),
      });

      const data: SearchResponse = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Error ${res.status}`);
        update({ results: [], totalFound: 0 });
        setOmittedInListsCount(0);
      } else {
        update({
          results: data.results ?? [],
          totalFound: data.total_found ?? 0,
        });
        setOmittedInListsCount(data.omitted_in_lists ?? 0);
        if (data.error) setError(data.error);
        if (data.results?.length === 0 && (data as any).message) {
          setError((data as any).message);
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        // User cancelled search — gracefully return to idle
        return;
      }
      setError(err.message ?? "Error desconocido");
      update({ results: [] });
    } finally {
      searchAbortRef.current = null;
      setLoading(false);
    }
  };

  // ───────── Dynamic Counts per Tier in Current Results ─────────
  const tierCounts = React.useMemo(() => {
    const counts: Record<ScoreTier, number> = {
      hot: 0,
      warm: 0,
      nurture: 0,
      skip: 0,
    };
    for (const r of results) {
      const score = r.total_score;
      if (score == null) continue;
      if (score >= 75) counts.hot++;
      else if (score >= 60) counts.warm++;
      else if (score >= 40) counts.nurture++;
      else counts.skip++;
    }
    return counts;
  }, [results]);

  // ───────── Filter results by selected Score Tiers ─────────
  const filteredResults = React.useMemo(() => {
    if (selectedTiers.length === 0) return results;
    return results.filter((r) => {
      const score = r.total_score;
      if (score == null) return false;
      let tier: ScoreTier;
      if (score >= 75) tier = "hot";
      else if (score >= 60) tier = "warm";
      else if (score >= 40) tier = "nurture";
      else tier = "skip";
      return selectedTiers.includes(tier);
    });
  }, [results, selectedTiers]);

  // Map the filtered search results into BusinessMarker shape for the map
  const mapMarkers: BusinessMarker[] = React.useMemo(() => {
    return filteredResults
      .filter((r) => r.lat != null && r.lng != null)
      .map((r) => ({
        id: r.id,
        name: r.name,
        lat: r.lat!,
        lng: r.lng!,
        category: r.primary_type,
        rating: r.rating,
        reviewCount: r.review_count,
        address: r.address,
        phone: r.phone,
        website: r.website,
        distanceMiles: r.distance_miles,
        totalScore: r.total_score,
        tier: r.tier,
      }));
  }, [filteredResults]);

  // Sort the table view of the filtered results.
  const sortedResults = React.useMemo(() => {
    if (!sortBy) return filteredResults;
    const dir = sortDir === "asc" ? 1 : -1;

    const getKey = (r: SearchResult): string | number | null => {
      switch (sortBy) {
        case "score":
          return typeof r.total_score === "number" ? r.total_score : null;
        case "services":
          return typeof r.matched_services_count === "number"
            ? r.matched_services_count
            : (r.total_score && r.total_score >= 75 ? 3 : r.total_score && r.total_score >= 60 ? 2 : 1);
        case "name":
          return r.name ? r.name.trim().toLowerCase() : null;
        case "category":
          return getBusinessCategory(r, selectedCategoryIds, locale).toLowerCase();
        case "city":
          return getBusinessCity(r).toLowerCase();
        case "address":
          return r.address ? r.address.trim().toLowerCase() : null;
        case "phone":
          return r.phone ? r.phone.replace(/\D/g, "") : null;
        case "web":
          return r.website ? r.website.trim().toLowerCase() : null;
        case "rating":
          return typeof r.rating === "number" ? r.rating : 0;
        case "distance":
          return typeof r.distance_miles === "number" ? r.distance_miles : null;
        default:
          return null;
      }
    };

    return [...filteredResults].sort((a, b) => {
      const ka = getKey(a);
      const kb = getKey(b);

      // Nulls/undefined sort to the bottom
      if (ka == null && kb == null) return 0;
      if (ka == null) return 1;
      if (kb == null) return -1;

      if (typeof ka === "number" && typeof kb === "number") {
        if (ka === kb) {
          // Secondary tie-breaker by total_score desc, then review_count
          const scoreA = a.total_score ?? 0;
          const scoreB = b.total_score ?? 0;
          if (scoreA !== scoreB) return scoreB - scoreA;
          const revA = a.review_count ?? 0;
          const revB = b.review_count ?? 0;
          return revB - revA;
        }
        return (ka - kb) * dir;
      }

      if (typeof ka === "string" && typeof kb === "string") {
        return ka.localeCompare(kb) * dir;
      }

      return 0;
    });
  }, [filteredResults, sortBy, sortDir]);

  // ───────── Pagination (Fixed 14 Businesses Per Page) ─────────
  const PAGE_SIZE = 14;
  const pageSize = PAGE_SIZE;
  const [currentPage, setCurrentPage] = React.useState<number>(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [results, selectedTiers, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedResults.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedResults = React.useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return sortedResults.slice(startIndex, startIndex + pageSize);
  }, [sortedResults, safePage]);

  // Auto-Focus & Auto-Pagination when clicking a business marker on the map
  const handleSelectBusinessFromMap = React.useCallback(
    (id: string) => {
      update({ selectedBusinessId: id });
      setFocusTick(Date.now());

      // Auto-paginate to the exact page where this business resides
      const targetIndex = sortedResults.findIndex((r) => r.id === id);
      if (targetIndex !== -1) {
        const targetPage = Math.floor(targetIndex / pageSize) + 1;
        setCurrentPage(targetPage);

        // Smoothly scroll the table row into view
        setTimeout(() => {
          const rowEl = document.getElementById(`biz-row-${id}`);
          if (rowEl) {
            rowEl.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 120);
      }
    },
    [sortedResults, pageSize, update]
  );

  return (
    <div className="p-1.5 sm:p-2 md:p-2.5 space-y-1.5 max-w-[1900px] w-full mx-auto flex flex-col min-h-0 lg:h-[calc(100vh-3.6rem)] lg:overflow-hidden">
        {/* Error banner */}
        {error && (
          <Card className="border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5 shrink-0">
            <CardContent className="py-1.5 px-3 text-xs text-red-800 dark:text-red-300 flex items-start justify-between gap-2 font-medium">
              <span>
                ⚠️ {error}
                {error.includes("Google Places") && (
                  <span className="block mt-0.5 text-xs text-red-700 dark:text-red-400">
                    → Configura tu API key en <a href="/tools" className="underline font-semibold">/tools</a>
                  </span>
                )}
              </span>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 text-base leading-none"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </CardContent>
          </Card>
        )}

        {/* ───────── Top section: Full-width Filter / Search Card (Collapsible) ───────── */}
        <Card className="w-full shadow-2xs border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xs transition-all duration-200 shrink-0">
          <CardContent className="py-1.5 px-3 md:px-3.5 space-y-1.5">
            {/* Header / Toggle Bar */}
            <div className={`flex items-center justify-between gap-2 flex-wrap ${!isFilterCollapsed ? "border-b border-slate-100 dark:border-white/5 pb-1.5" : ""}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span className="text-sm">🔍</span> {t("radar.filterParams", "Filtros y Parámetros")}
                </span>

                {/* Restored search pill badge inline */}
                {hydrated && searched && results.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30 text-[11px] font-medium shadow-2xs">
                    <span className="text-xs">🔁</span>
                    <span>{t("radar.restoredResults", { count: results.length }, `Restaurada (${results.length} resultados)`)}</span>
                    <button
                      type="button"
                      onClick={clear}
                      className="ml-1 hover:text-sky-950 dark:hover:text-white underline underline-offset-2 text-[10px] text-sky-600 dark:text-sky-400 font-semibold"
                      title={t("radar.clearFilters", "Limpiar filtros")}
                    >
                      {t("common.clear", "Limpiar")}
                    </button>
                  </span>
                )}

                {isFilterCollapsed && (
                  <div className="flex items-center gap-1.5 flex-wrap ml-2 animate-in fade-in-50 duration-150">
                    {city && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-white/5 max-w-[220px] truncate" title={city}>
                        <span>📍</span>
                        <span className="truncate">{city}</span>
                      </span>
                    )}
                    {selectedCategoryIds.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-white/5 max-w-[260px] truncate" title={selectedCategoryIds.join(", ")}>
                        <span>🏷️</span>
                        <span className="truncate">{selectedCategoryIds.length === 1 ? selectedCategoryIds[0] : `${selectedCategoryIds.length} categorías`}</span>
                      </span>
                    )}

                    {radiusMiles && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-white/5">
                        <span>📡</span>
                        <span>{radiusMiles} mi</span>
                      </span>
                    )}

                    {maxResults && maxResults > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-white/5">
                        <span>🎯</span>
                        <span>{maxResults} max</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 text-[11px] font-medium border border-sky-200 dark:border-sky-500/20">
                        <span>🎯</span>
                        <span>{t("radar.maxResultsAll", "Sin límite (Todos)")}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons: Clean & Expand/Collapse Toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clear}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:underline underline-offset-2 transition-colors font-medium px-1.5 py-0.5"
                >
                  {t("radar.clearFilters", "Limpiar filtros")}
                </button>

                {/* Primary Search Button in Header when Collapsed */}
                {isFilterCollapsed && (
                  <Button
                    type="button"
                    onClick={handleSearch}
                    disabled={loading}
                    className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold h-7 px-3 text-xs shadow-xs transition-all"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{t("radar.searchingPlaces", "Buscando...")}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <span>⚡</span>
                        <span>{t("radar.searchButton", "Buscar")}</span>
                      </span>
                    )}
                  </Button>
                )}

                <button
                  type="button"
                  onClick={toggleFilterCollapsed}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-white/10"
                  aria-expanded={!isFilterCollapsed}
                >
                  <span>{isFilterCollapsed ? t("radar.expandFilters", "Desplegar filtros") : t("radar.collapseFilters", "Plegar filtros")}</span>
                  <span className="text-[10px] font-mono">{isFilterCollapsed ? "▼" : "▲"}</span>
                </button>
              </div>
            </div>

            {/* Collapsible Filter Body */}
            {!isFilterCollapsed && (
              <form onSubmit={handleSearch} className="space-y-2.5 pt-1 animate-in fade-in-50 duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-start">
                  {/* 1. Ubicación (3 cols) */}
                  <div className="lg:col-span-3 space-y-1">
                    <Label htmlFor="city" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t("radar.locationLabel", "Ubicación")}
                    </Label>
                    <LocationSearch
                      value={hydrated ? city : ""}
                      onChange={(v) => update({ city: v })}
                      onLocationSelect={(lat, lng, displayName, suggestedRadius) =>
                        update({
                          origin: { lat, lng },
                          city: displayName,
                          ...(typeof suggestedRadius === "number"
                            ? { radiusMiles: suggestedRadius }
                            : {}),
                        })
                      }
                      placeholder={t("radar.cityPlaceholder", "Ciudad, dirección o lugar...")}
                    />
                  </div>

                  {/* 2. Categoría (4 cols) */}
                  <div className="lg:col-span-4 space-y-1">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t("radar.categoryLabel", "Categoría")}
                    </Label>
                    <CategoryMultiSelect
                      value={selectedCategoryIds}
                      onChange={(v) => update({ selectedCategoryIds: v })}
                    />
                  </div>

                  {/* 3. Búsqueda personalizada (2 cols) */}
                  <div className="lg:col-span-2 space-y-1">
                    <Label htmlFor="query" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t("radar.customSearchLabel", "Búsqueda personalizada")}
                      <span className="ml-1 text-slate-400 font-normal text-[11px]">{t("radar.optional", "(opcional)")}</span>
                    </Label>
                    <Input
                      id="query"
                      placeholder={t("radar.customSearchPlaceholder", "ej. 'abierto 24/7'")}
                      value={query}
                      onChange={(e) => update({ query: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>

                  {/* 4. Limitar máx. & Botones de Acción (3 cols) */}
                  <div className="lg:col-span-3 space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <label
                          htmlFor="toggleMaxResults"
                          className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] cursor-pointer select-none"
                        >
                          <input
                            id="toggleMaxResults"
                            type="checkbox"
                            checked={maxResults !== null}
                            onChange={(e) =>
                              update({ maxResults: e.target.checked ? 20 : null })
                            }
                            className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sky-600 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5 accent-sky-500"
                          />
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{t("radar.limitMax", "Limitar máx.")}</span>
                        </label>

                        {maxResults !== null ? (
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <input
                              type="number"
                              min="1"
                              max="200"
                              value={maxResults}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                update({
                                  maxResults: isNaN(val) ? 1 : Math.max(1, Math.min(200, val)),
                                });
                              }}
                              className="w-12 h-5 px-1 text-center bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-sky-500 rounded text-slate-900 dark:text-slate-200 font-mono text-[11px] focus:outline-none"
                              title="Escribe una cantidad personalizada de resultados"
                            />
                            <span className="text-slate-600 dark:text-slate-400 text-[10px]">{t("common.businesses", "negocios")}</span>
                          </div>
                        ) : (
                          <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px]">
                            {t("radar.noLimit", "⚡ Sin límite (Todos)")}
                          </span>
                        )}
                      </div>

                      {maxResults !== null && (
                        <div className="space-y-0.5">
                          <input
                            id="maxResults"
                            type="range"
                            min="5"
                            max="100"
                            value={Math.min(100, maxResults)}
                            onChange={(e) =>
                              update({ maxResults: parseInt(e.target.value, 10) })
                            }
                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-sky-500"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      {loading ? (
                        <Button
                          type="button"
                          onClick={handleCancelSearch}
                          size="default"
                          className="w-full bg-rose-600/90 hover:bg-rose-600 text-white font-semibold border border-rose-500/50 shadow-md shadow-rose-600/25 transition-all text-xs h-9"
                          title={t("radar.cancelSearch", "Cancelar búsqueda")}
                        >
                          <span className="inline-block w-2 h-2 bg-white rounded-xs mr-1.5 animate-pulse" />
                          {t("radar.cancelSearch", "✕ Cancelar búsqueda")}
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          size="default"
                          className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold shadow-md shadow-orange-500/20 text-xs h-9"
                        >
                          {t("radar.searchOnMap", "🔍 Buscar en el mapa")}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* ───────── Main Section: Map (Left) + Table (Right) ───────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch flex-1 min-h-0 overflow-hidden">
          {/* Left Column: Interactive Map (5 of 12 cols, stretch to match table height) */}
          <div className="lg:col-span-5 flex flex-col h-full min-h-0">
            <div className="relative flex-1 h-full rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-900/40 shadow-xs">
              <RadarMap
                center={origin}
                radiusMeters={milesToMeters(radiusMiles)}
                onRadiusChange={(m) =>
                  update({ radiusMiles: metersToMiles(m) })
                }
                businesses={mapMarkers}
                selectedId={effectiveSelectedId}
                focusedBusinessId={selectedBusinessId ? `${selectedBusinessId}::${focusTick}` : null}
                onCenterChange={(lat, lng) => update({ origin: { lat, lng } })}
                onSelectBusiness={handleSelectBusinessFromMap}
              />
            </div>
          </div>

          {/* Right Column: Interactive Results Table (7 of 12 cols) */}
          <div className="lg:col-span-7 flex flex-col h-full min-h-0">
            {loading && (
              <Card className="flex-1 flex items-center justify-center border-slate-200 dark:border-white/10 shadow-xs bg-white/80 dark:bg-slate-900/60 backdrop-blur-xs">
                <CardContent className="py-10 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                  <p className="mt-2 text-sm text-slate-400">
                    {t("radar.searchingPlaces", "Buscando en Google Places...")}
                  </p>
                </CardContent>
              </Card>
            )}

            {!loading && searched && results.length === 0 && !error && (
              <Card className="flex-1 flex items-center justify-center border-slate-200 dark:border-white/10 shadow-xs bg-white/80 dark:bg-slate-900/60 backdrop-blur-xs">
                <CardContent className="py-10 text-center">
                  <div className="text-3xl mb-2">🤷</div>
                  <p className="text-sm text-slate-400">Sin resultados</p>
                </CardContent>
              </Card>
            )}

            {!loading && results.length > 0 && (
              <Card className="border-slate-200 dark:border-white/10 shadow-xs flex flex-col h-full min-h-0 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xs">
                <CardContent className="p-2.5 sm:p-3 flex flex-col flex-1 h-full min-h-0 justify-between">
                  {/* Header with Counter, Live Filter Chips, Sort & Actions in ONE row */}
                  <div className="flex items-center justify-between mb-2 gap-2 overflow-x-auto no-scrollbar py-0.5 shrink-0">
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-xs font-medium shrink-0 whitespace-nowrap">
                        <span className="font-bold text-sky-600 dark:text-sky-400 text-sm">
                          {filteredResults.length}
                        </span>
                        {selectedTiers.length > 0 ? (
                          <span className="text-slate-500 dark:text-slate-400 text-xs"> {t("radar.filteredFrom", { filtered: filteredResults.length, total: results.length }, `filtrados de ${results.length} encontrados`)}</span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400 text-xs"> {t("common.of", "de")} <span className="font-mono">{results.length}</span> {t("radar.foundCounter", { total: results.length }, `${results.length} encontrados`)}</span>
                        )}
                      </p>

                      <span className="text-slate-300 dark:text-slate-700 select-none">·</span>

                      {/* Live Interactive Score Tier Filter Chips */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleTier("hot")}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-bold transition-all select-none whitespace-nowrap ${
                            selectedTiers.includes("hot")
                              ? "bg-red-100 border border-red-500 text-red-900 dark:bg-red-500/25 dark:border-red-400 dark:text-red-200 shadow-xs"
                              : "bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-400 hover:border-red-400 hover:text-red-800 dark:hover:text-red-300"
                          }`}
                          title={t("radar.tierHotTooltip", "Filtrar negocios HOT (Score ≥ 75)")}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          🔥 HOT <span className="font-mono text-[9.5px] opacity-80 font-normal">({tierCounts.hot})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleTier("warm")}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-bold transition-all select-none whitespace-nowrap ${
                            selectedTiers.includes("warm")
                              ? "bg-emerald-100 border border-emerald-500 text-emerald-900 dark:bg-emerald-500/25 dark:border-emerald-400 dark:text-emerald-200 shadow-xs"
                              : "bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300"
                          }`}
                          title={t("radar.tierWarmTooltip", "Filtrar negocios WARM (Score 60 - 74)")}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          ⚡ WARM <span className="font-mono text-[9.5px] opacity-80 font-normal">({tierCounts.warm})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleTier("nurture")}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-bold transition-all select-none whitespace-nowrap ${
                            selectedTiers.includes("nurture")
                              ? "bg-orange-100 border border-orange-500 text-orange-900 dark:bg-orange-500/25 dark:border-orange-400 dark:text-orange-200 shadow-xs"
                              : "bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-400 hover:border-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
                          }`}
                          title={t("radar.tierNurtureTooltip", "Filtrar negocios NURTURE (Score 40 - 59)")}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          🌱 NURTURE <span className="font-mono text-[9.5px] opacity-80 font-normal">({tierCounts.nurture})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleTier("skip")}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-bold transition-all select-none whitespace-nowrap ${
                            selectedTiers.includes("skip")
                              ? "bg-yellow-100 border border-yellow-500 text-yellow-900 dark:bg-yellow-500/25 dark:border-yellow-400 dark:text-yellow-200 shadow-xs"
                              : "bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-400 hover:border-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300"
                          }`}
                          title={t("radar.tierSkipTooltip", "Filtrar negocios SKIP (Score < 40)")}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                          ⚪ SKIP <span className="font-mono text-[9.5px] opacity-80 font-normal">({tierCounts.skip})</span>
                        </button>

                        {selectedTiers.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedTiers([])}
                            className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline underline-offset-2 ml-1 font-semibold whitespace-nowrap"
                          >
                            {t("radar.clearTierFilter", "✕ Ver todos")}
                          </button>
                        )}

                        <span className="text-slate-300 dark:text-slate-700 select-none">·</span>

                        {/* List Exclusion Filter Toggle */}
                        <label
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-bold transition-all select-none whitespace-nowrap cursor-pointer ${
                            excludeSavedInLists
                              ? "bg-slate-100 dark:bg-slate-800 border border-sky-500/50 text-sky-800 dark:text-sky-300 shadow-2xs"
                              : "bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400"
                          }`}
                          title="Excluir de la búsqueda negocios que ya guardaste en cualquiera de tus listas para ahorrar llamadas a la API y prospectar solo leads nuevos"
                        >
                          <input
                            type="checkbox"
                            checked={excludeSavedInLists}
                            onChange={(e) => {
                              setExcludeSavedInLists(e.target.checked);
                            }}
                            className="w-3 h-3 rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-sky-500 cursor-pointer accent-sky-500"
                          />
                          <span>🚫 Ocultar en listas</span>
                          {omittedInListsCount > 0 && (
                            <span className="font-mono text-[9.5px] px-1 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-normal">
                              ({omittedInListsCount} omitidos)
                            </span>
                          )}
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs shrink-0 whitespace-nowrap">
                      {sortBy && (
                        <button
                          onClick={() => {
                            setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 text-sky-700 dark:text-sky-300 hover:bg-sky-100 transition-colors font-medium text-[11px] whitespace-nowrap"
                          title="Alternar orden ascendente / descendente"
                        >
                          <span aria-hidden="true">{sortDir === "asc" ? "▲" : "▼"}</span>
                          <span>
                            {t(`radar.${sortBy === "name" ? "businessColumn" : sortBy === "category" ? "categoryColumn" : sortBy === "city" ? "cityColumn" : sortBy === "score" ? "scoreColumn" : sortBy === "rating" ? "ratingColumn" : sortBy === "distance" ? "distanceColumn" : "scoreColumn"}`, sortBy)}
                            <span className="ml-1 text-sky-600 dark:text-sky-400 font-bold">
                              ({sortDir === "asc" ? t("radar.asc", "Asc") : t("radar.desc", "Desc")})
                            </span>
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Batch Success Message Banner */}
                  {batchSuccessMsg && (
                    <div className="mb-2 p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150 shrink-0">
                      <div className="flex items-center gap-2">
                        <span>{batchSuccessMsg}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBatchSuccessMsg(null)}
                        className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200 text-sm leading-none"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Wide results table with expandable row drawers */}
                  <div className="overflow-y-auto overflow-x-auto rounded-lg border border-slate-200 dark:border-white/5 flex-1 min-h-0 bg-white dark:bg-slate-950/40 relative">
                    <table className="w-full text-sm table-fixed">
                      <colgroup>
                        <col className="w-[36px]" />
                        <col className="w-[23%] min-w-[130px]" />
                        <col className="w-[19%] min-w-[120px]" />
                        <col className="w-[13%] min-w-[90px]" />
                        <col className="w-[92px]" />
                        <col className="w-[104px]" />
                        <col className="w-[78px]" />
                        <col className="w-[60px]" />
                        <col className="w-[88px]" />
                      </colgroup>
                      <thead className="sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xs text-[11px] uppercase tracking-wide text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-white/10 shadow-2xs">
                        <tr>
                          {/* 0. Master Checkbox */}
                          <th className="sticky top-0 z-30 bg-slate-100 dark:bg-slate-900 text-center py-2 px-1 w-[36px] border-b border-slate-200 dark:border-white/10">
                            <input
                              type="checkbox"
                              checked={
                                paginatedResults.length > 0 &&
                                paginatedResults.every((r) => selectedIds.has(r.id))
                              }
                              onChange={() => {
                                const allSelected =
                                  paginatedResults.length > 0 &&
                                  paginatedResults.every((r) => selectedIds.has(r.id));
                                setSelectedIds((prev) => {
                                  const next = new Set(prev);
                                  if (allSelected) {
                                    paginatedResults.forEach((r) => next.delete(r.id));
                                  } else {
                                    paginatedResults.forEach((r) => next.add(r.id));
                                  }
                                  return next;
                                });
                              }}
                              className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-sky-500 cursor-pointer accent-sky-500"
                              title="Seleccionar / Deseleccionar todos en esta página"
                              aria-label="Seleccionar todos en esta página"
                            />
                          </th>
                          {/* Negocio */}
                          <SortableHeader
                            column="name"
                            label={t("radar.businessColumn", "Negocio")}
                            sortBy={sortBy}
                            sortDir={sortDir}
                            onSort={handleSort}
                            className="text-left pl-2 pr-2 w-[23%]"
                          />
                          {/* Categoría */}
                          <SortableHeader
                            column="category"
                            label={t("radar.categoryColumn", "Categoría")}
                            sortBy={sortBy}
                            sortDir={sortDir}
                            onSort={handleSort}
                            className="text-left px-2 w-[19%]"
                          />
                          {/* Ciudad */}
                          <SortableHeader
                            column="city"
                            label={t("radar.cityColumn", "Ciudad")}
                            sortBy={sortBy}
                            sortDir={sortDir}
                            onSort={handleSort}
                            className="text-left px-2 w-[13%]"
                          />
                          {/* Score */}
                          <SortableHeader
                            column="score"
                            label={t("radar.scoreColumn", "Score")}
                            sortBy={sortBy}
                            sortDir={sortDir}
                            onSort={handleSort}
                            className="text-left px-1.5 w-[92px]"
                          />
                          {/* Servicios IA */}
                          <SortableHeader
                            column="services"
                            label={t("radar.colServices", "Servicios IA")}
                            sortBy={sortBy}
                            sortDir={sortDir}
                            onSort={handleSort}
                            className="text-center px-1.5 w-[104px]"
                          />
                          {/* Rating */}
                          <SortableHeader
                            column="rating"
                            label={t("radar.ratingColumn", "Rating ⭐")}
                            sortBy={sortBy}
                            sortDir={sortDir}
                            onSort={handleSort}
                            className="text-center px-1 w-[78px]"
                          />
                          {/* Dist */}
                          <SortableHeader
                            column="distance"
                            label={t("radar.distanceColumn", "Dist")}
                            sortBy={sortBy}
                            sortDir={sortDir}
                            onSort={handleSort}
                            className="text-right px-1.5 w-[60px]"
                          />
                          {/* Acción */}
                          <th className="sticky top-0 z-30 bg-slate-100 dark:bg-slate-900 text-right font-semibold py-2 pl-1.5 pr-2.5 whitespace-nowrap w-[88px] text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">
                            {t("radar.actionColumn", "Acción")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedResults.map((r) => {
                          const isSelected = r.id === effectiveSelectedId;
                          const isExpanded = expandedRowId === r.id;
                          const isChecked = selectedIds.has(r.id);
                          const mapsHref = r.lat != null && r.lng != null
                            ? `https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}`
                            : null;
                          return (
                            <React.Fragment key={r.id}>
                              <tr
                                id={`biz-row-${r.id}`}
                                onMouseEnter={() => setHoveredBusinessId(r.id)}
                                onMouseLeave={() => setHoveredBusinessId(null)}
                                onClick={() => {
                                  update({ selectedBusinessId: r.id });
                                  setFocusTick(Date.now());
                                }}
                                className={`border-b border-slate-100 dark:border-white/5 transition-all cursor-pointer ${
                                  isChecked
                                    ? "bg-sky-500/10 dark:bg-sky-500/15 border-l-4 border-l-sky-500"
                                    : isSelected
                                    ? "bg-orange-500/15 border-l-4 border-l-orange-500 dark:bg-orange-500/20"
                                    : isExpanded
                                    ? "bg-slate-50/90 dark:bg-slate-800/60 border-l-4 border-l-sky-500"
                                    : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                }`}
                              >
                                {/* 0. Checkbox Individual */}
                                <td
                                  className="py-1.5 px-1 text-center align-middle cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSelect(r.id, e.shiftKey);
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSelect(r.id, e.shiftKey);
                                    }}
                                    onChange={() => {
                                      // Handled by onClick for reliable shiftKey detection
                                    }}
                                    className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-sky-500 cursor-pointer accent-sky-500"
                                    aria-label={`Seleccionar ${r.name}`}
                                  />
                                </td>

                                {/* 1. Negocio con toggle expandible */}
                                <td className="py-1.5 pl-2 pr-2 align-middle">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <button
                                      type="button"
                                      onClick={(e) => toggleRowExpand(r.id, e)}
                                      className="p-0.5 -ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
                                      title={isExpanded ? "Plegar detalles de negocio" : "Desplegar detalles de negocio"}
                                      aria-expanded={isExpanded}
                                    >
                                      <span className="inline-block text-[9px] font-mono leading-none transition-transform duration-150">
                                        {isExpanded ? "▼" : "▶"}
                                      </span>
                                    </button>
                                    <div
                                      className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs select-text cursor-text"
                                      title={r.name}
                                    >
                                      {r.name}
                                    </div>
                                  </div>
                                </td>

                                {/* 2. Categoría */}
                                <td className="py-1.5 px-2 align-middle">
                                  <span
                                    className="inline-block max-w-full truncate text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 font-medium"
                                    title={getBusinessCategory(r, selectedCategoryIds, locale)}
                                  >
                                    {getBusinessCategory(r, selectedCategoryIds, locale)}
                                  </span>
                                </td>

                                {/* 3. Ciudad */}
                                <td className="py-1.5 px-2 align-middle">
                                  <span
                                    className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap"
                                    title={getBusinessCity(r)}
                                  >
                                    <span className="text-slate-400 text-[10px] shrink-0">📍</span>
                                    <span className="truncate">{getBusinessCity(r)}</span>
                                  </span>
                                </td>

                                {/* 4. Score */}
                                <td className="py-1.5 px-1.5 align-middle whitespace-nowrap">
                                  {r.total_score != null ? (
                                    <div className="flex items-center gap-1">
                                      {r.total_score >= 75 ? (
                                        <span
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-red-50 text-red-800 border border-red-200 dark:bg-red-500/15 dark:border-red-500/40 dark:text-red-300 shadow-2xs font-mono"
                                          title={`Score 5D: ${r.total_score}/100 - HOT: Alta urgencia y ticket alto. Cerrar esta semana.`}
                                        >
                                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                          🔥 {r.total_score} HOT
                                        </span>
                                      ) : r.total_score >= 60 ? (
                                        <span
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-300 shadow-2xs font-mono"
                                          title={`Score 5D: ${r.total_score}/100 - WARM: Lead caliente / calificado.`}
                                        >
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                          ⚡ {r.total_score} WARM
                                        </span>
                                      ) : r.total_score >= 40 ? (
                                        <span
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-orange-50 text-orange-800 border border-orange-200 dark:bg-orange-500/15 dark:border-orange-500/40 dark:text-orange-300 shadow-2xs font-mono"
                                          title={`Score 5D: ${r.total_score}/100 - NURTURE: Oportunidad media / Seguimiento.`}
                                        >
                                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                          🌱 {r.total_score} NURTURE
                                        </span>
                                      ) : (
                                        <span
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-50 text-yellow-800 border border-yellow-200 dark:bg-yellow-500/15 dark:border-yellow-500/40 dark:text-yellow-300 shadow-2xs font-mono"
                                          title={`Score 5D: ${r.total_score}/100 - SKIP: Descartar o baja prioridad.`}
                                        >
                                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                                          ⚪ {r.total_score} SKIP
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-xs font-mono">-</span>
                                  )}
                                </td>

                                {/* 5. Servicios IA a Instalar */}
                                <td className="py-1.5 px-1.5 align-middle text-center whitespace-nowrap">
                                  {(() => {
                                    const count =
                                      r.matched_services_count != null
                                        ? r.matched_services_count
                                        : r.total_score != null
                                        ? r.total_score >= 75
                                          ? 3
                                          : r.total_score >= 60
                                          ? 2
                                          : 1
                                        : 2;
                                    const names =
                                      locale === "en" && r.matched_service_names_en && r.matched_service_names_en.length > 0
                                        ? r.matched_service_names_en
                                        : r.matched_service_names && r.matched_service_names.length > 0
                                        ? r.matched_service_names
                                        : count === 3
                                        ? [
                                            locale === "en" ? "24/7 AI Appointment Setter" : "AI Appointment Setter 24/7",
                                            locale === "en" ? "5★ Review Booster" : "Review Booster 5★",
                                            locale === "en" ? "Web Lead Magnet Assistant" : "Asistente Web Lead Magnet",
                                          ]
                                        : count === 2
                                        ? [
                                            locale === "en" ? "5★ Review Booster" : "Review Booster 5★",
                                            locale === "en" ? "24/7 AI Appointment Setter" : "AI Appointment Setter 24/7",
                                          ]
                                        : [
                                            locale === "en"
                                              ? "Google Business & Review Booster"
                                              : "Google Business & Review Booster",
                                          ];
                                    return (
                                      <span
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-500/15 dark:border-purple-500/30 dark:text-purple-300 shadow-2xs font-mono cursor-help transition-all hover:scale-105"
                                        title={`${locale === "en" ? "Matched AI Services to install:" : "Servicios IA a instalar:"}\n• ${names.join("\n• ")}`}
                                      >
                                        <span>🤖</span>
                                        <span>
                                          {count} {count === 1 ? t("radar.serviceSingleBadge", "servicio") : t("radar.servicesBadge", "servicios")}
                                        </span>
                                      </span>
                                    );
                                  })()}
                                </td>

                                {/* 6. Rating */}
                                <td className="py-1.5 px-1 align-middle text-center whitespace-nowrap">
                                  {r.rating != null ? (
                                    <div className="inline-flex items-baseline gap-1 text-xs">
                                      <span className="text-amber-500 font-bold">
                                        ⭐ {r.rating.toFixed(1)}
                                      </span>
                                      {r.review_count != null && (
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                                          ({r.review_count})
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-xs">—</span>
                                  )}
                                </td>

                                {/* 7. Dist */}
                                <td className="py-1.5 px-1.5 align-middle text-right whitespace-nowrap">
                                  {r.distance_miles != null ? (
                                    <span className="font-mono text-[11px] text-sky-700 dark:text-sky-300 tabular-nums font-semibold">
                                      {r.distance_miles.toFixed(1)} mi
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-xs">—</span>
                                  )}
                                </td>

                                {/* 8. Acción */}
                                <td className="py-1.5 pl-1.5 pr-2.5 align-middle text-right whitespace-nowrap">
                                  <div
                                    className="inline-flex items-center gap-1 justify-end"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Link
                                      href={`/radar/${r.id}`}
                                      prefetch={true}
                                      className="inline-flex items-center justify-center rounded-md h-6 px-2 text-[11px] bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold shadow-xs transition-colors"
                                    >
                                      {t("radar.viewProfile", "Perfil →")}
                                    </Link>
                                    <button
                                      type="button"
                                      onClick={(e) => toggleRowExpand(r.id, e)}
                                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                      title={isExpanded ? t("radar.collapseFilters", "Ocultar detalles") : t("common.viewMore", "Ver más")}
                                    >
                                      <span className="text-[10px] font-mono leading-none">
                                        {isExpanded ? "▲" : "▼"}
                                      </span>
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Expandable Details Drawer */}
                              {isExpanded && (
                                <tr className="bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-white/10 animate-in fade-in-50 duration-150">
                                  <td colSpan={9} className="p-3 pl-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-lg bg-white dark:bg-slate-950/80 border border-slate-200/80 dark:border-white/10 shadow-xs">
                                      {/* 1. Ubicación y Dirección */}
                                      <div className="space-y-1.5 text-xs flex flex-col justify-between">
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                                            <span>📍</span>
                                            <span>{t("radar.locationAndAddress", "Ubicación y Dirección")}</span>
                                          </div>
                                          <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed select-text">
                                            {r.address || t("radar.noAddress", "Dirección no especificada")}
                                          </p>
                                        </div>
                                        {mapsHref && (
                                          <a
                                            href={mapsHref}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline text-[11px] font-medium mt-1"
                                          >
                                            <span>{t("common.openGoogleMaps", "Google Maps")}</span>
                                            <span className="text-[10px]">↗</span>
                                          </a>
                                        )}
                                      </div>

                                      {/* 2. Contacto y Web */}
                                      <div className="space-y-1 text-xs flex flex-col">
                                        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                                          <span>📞</span>
                                          <span>{t("radar.contactAndWeb", "Contacto y Web")}</span>
                                        </div>
                                        <div className="space-y-1.5 text-[11px] pt-0.5">
                                          {r.phone ? (
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-slate-500 dark:text-slate-400 font-medium">{t("radar.phoneLabel", "Teléfono:")}</span>
                                              <a
                                                href={`tel:${r.phone}`}
                                                className="text-sky-600 dark:text-sky-400 hover:underline font-mono"
                                              >
                                                {r.phone}
                                              </a>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-slate-500 dark:text-slate-400 font-medium">{t("radar.phoneLabel", "Teléfono:")}</span>
                                              <span className="text-slate-400 italic text-[11px]">{t("radar.noPhone", "Sin teléfono registrado")}</span>
                                            </div>
                                          )}
                                          {r.website ? (
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-slate-500 dark:text-slate-400 font-medium">{t("radar.webLabel", "Sitio Web:")}</span>
                                              <a
                                                href={r.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline max-w-[190px] truncate font-medium"
                                                title={r.website}
                                              >
                                                <span>🌐 {r.website.replace(/^https?:\/\/(www\.)?/, "")}</span>
                                                <span className="text-[10px]">↗</span>
                                              </a>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-slate-500 dark:text-slate-400 font-medium">{t("radar.webLabel", "Sitio Web:")}</span>
                                              <span className="text-slate-400 italic text-[11px]">{t("radar.noWeb", "Sin sitio web oficial")}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* 3. Acciones Rápidas & CRM */}
                                      <div className="space-y-1.5 text-xs flex flex-col justify-between">
                                        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                                          <span>⚡</span>
                                          <span>{t("radar.quickActions", "Acciones Rápidas")}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 w-full">
                                          <AddToListButton businessId={r.id} businessName={r.name} className="w-full" />
                                          <AddToCrmButton businessId={r.id} businessName={r.name} className="w-full" />
                                        </div>
                                        <Link
                                          href={`/proposals/${r.id}`}
                                          prefetch={true}
                                          className="inline-flex items-center justify-center gap-1 w-full py-1.5 px-3 rounded-md bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs shadow-xs transition-all"
                                        >
                                          <span>{t("radar.viewProposal", "Ver Análisis y Propuesta IA →")}</span>
                                        </Link>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Floating Sticky Bulk Actions Bar */}
                  {selectedIds.size > 0 && (
                    <div className="my-1.5 p-2 rounded-xl bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-sky-500/40 text-white shadow-lg shadow-sky-950/20 flex items-center justify-between gap-2 flex-wrap shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-150">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                        </span>
                        <span className="text-xs font-semibold">
                          <strong className="text-sky-400 font-mono text-sm">{selectedIds.size}</strong>{" "}
                          {selectedIds.size === 1 ? "negocio seleccionado" : "negocios seleccionados"}
                        </span>
                        {selectedIds.size < filteredResults.length && (
                          <button
                            type="button"
                            onClick={selectAllFiltered}
                            className="text-[11px] text-sky-400 hover:text-sky-300 underline font-medium ml-1"
                          >
                            Seleccionar los {filteredResults.length} filtrados
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={openSendToListModal}
                          disabled={batchActionLoading}
                          className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs h-7 px-3 shadow-xs shadow-sky-600/30 flex items-center gap-1.5"
                        >
                          <span>📁</span>
                          <span>Enviar a Lista...</span>
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          onClick={handleBatchAddToCrm}
                          disabled={batchActionLoading}
                          className="bg-emerald-600 hover:emerald-500 text-white font-bold text-xs h-7 px-3 shadow-xs shadow-emerald-600/30 flex items-center gap-1.5"
                        >
                          <span>🚀</span>
                          <span>Al Pipeline CRM</span>
                        </Button>

                        <button
                          type="button"
                          onClick={clearSelection}
                          className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded transition-colors"
                          title="Deseleccionar todos"
                        >
                          ✕ Limpiar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Pagination footer */}
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200 dark:border-white/5 flex-wrap gap-2 shrink-0">
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {t("common.showing", "Mostrando")}{" "}
                      <span className="font-semibold text-slate-900 dark:text-slate-200 font-mono">
                        {sortedResults.length === 0
                          ? 0
                          : (safePage - 1) * pageSize + 1}
                      </span>
                      -
                      <span className="font-semibold text-slate-900 dark:text-slate-200 font-mono">
                        {Math.min(safePage * pageSize, sortedResults.length)}
                      </span>{" "}
                      {t("common.of", "de")}{" "}
                      <span className="font-semibold text-slate-900 dark:text-slate-200 font-mono">
                        {sortedResults.length}
                      </span>{" "}
                      {t("common.businesses", "negocios")}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {/* First Page (Inicio) */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={safePage <= 1}
                          onClick={() => setCurrentPage(1)}
                          title={t("common.first", "« Inicio")}
                          className="h-6 px-1.5 text-[11px] text-slate-700 dark:text-slate-300 disabled:opacity-40"
                        >
                          {t("common.first", "« Inicio")}
                        </Button>

                        {/* Previous Page */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={safePage <= 1}
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          title={t("common.prev", "← Anterior")}
                          className="h-6 px-2 text-[11px] text-slate-700 dark:text-slate-300 disabled:opacity-40"
                        >
                          {t("common.prev", "← Anterior")}
                        </Button>

                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                            if (
                              totalPages > 6 &&
                              pageNum !== 1 &&
                              pageNum !== totalPages &&
                              Math.abs(pageNum - safePage) > 1
                            ) {
                              if (pageNum === 2 || pageNum === totalPages - 1) {
                                return (
                                  <span key={pageNum} className="text-slate-400 dark:text-slate-600 px-0.5 select-none font-mono text-xs">
                                    …
                                  </span>
                                );
                              }
                              return null;
                            }
                            const isCurrent = pageNum === safePage;
                            return (
                              <button
                                key={pageNum}
                                type="button"
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-6 h-6 rounded font-mono text-[11px] transition-colors ${
                                  isCurrent
                                    ? "bg-sky-500 text-white font-bold shadow-2xs"
                                    : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>

                        {/* Next Page */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={safePage >= totalPages}
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          title={t("common.nextArrow", "Siguiente →")}
                          className="h-6 px-2 text-[11px] text-slate-700 dark:text-slate-300 disabled:opacity-40"
                        >
                          {t("common.nextArrow", "Siguiente →")}
                        </Button>

                        {/* Last Page (Último) */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={safePage >= totalPages}
                          onClick={() => setCurrentPage(totalPages)}
                          title={t("common.last", "Último »")}
                          className="h-6 px-1.5 text-[11px] text-slate-700 dark:text-slate-300 disabled:opacity-40"
                        >
                          {t("common.last", "Último »")}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {!searched && !loading && hydrated && (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="text-3xl mb-2">◎</div>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    {t("radar.initialHint", "Configurá la búsqueda arriba y vas a ver los resultados en el mapa y en la tabla en paralelo.")}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Modal Dialog para Enviar Masivamente a Lista */}
        <Dialog open={isListModalOpen} onOpenChange={setIsListModalOpen}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <span>📁</span>
                <span>Guardar {selectedIds.size} negocios en una Lista</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                Selecciona una lista existente o crea una nueva. Los negocios se guardarán de forma persistente en SQLite y podrás gestionarlos en la sección de Listas.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              {loadingLists ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <div className="inline-block w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mb-2" />
                  <p>Cargando tus listas...</p>
                </div>
              ) : isCreatingInlineList ? (
                <div className="space-y-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Nombre de la nueva lista
                    </label>
                    <Input
                      placeholder="Ej. Dentistas Alta Prioridad Corona"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      className="h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Color de identificación
                    </label>
                    <div className="flex items-center gap-2">
                      {[
                        { id: "sky", bg: "bg-sky-500" },
                        { id: "emerald", bg: "bg-emerald-500" },
                        { id: "amber", bg: "bg-amber-500" },
                        { id: "rose", bg: "bg-rose-500" },
                        { id: "purple", bg: "bg-purple-500" },
                        { id: "indigo", bg: "bg-indigo-500" },
                      ].map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setNewListColor(c.id)}
                          className={`w-6 h-6 rounded-full ${c.bg} transition-all ${
                            newListColor === c.id
                              ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110"
                              : "opacity-70 hover:opacity-100"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCreatingInlineList(false)}
                      className="h-7 text-xs"
                    >
                      Volver a listas existentes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Elige una lista de destino:
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingInlineList(true)}
                      className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      + Crear nueva lista
                    </button>
                  </div>

                  {availableLists.length === 0 ? (
                    <div className="p-4 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                      <p className="text-xs text-slate-500 mb-2">No tienes ninguna lista creada todavía.</p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setIsCreatingInlineList(true)}
                        className="text-xs h-7 bg-sky-600 hover:bg-sky-500 text-white font-semibold"
                      >
                        + Crear mi primera lista
                      </Button>
                    </div>
                  ) : (
                    <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1">
                      {availableLists.map((list) => {
                        const isSelected = targetListId === list.id;
                        return (
                          <label
                            key={list.id}
                            className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                              isSelected
                                ? "bg-sky-50 dark:bg-sky-500/15 border-sky-500 text-sky-900 dark:text-sky-200 shadow-xs"
                                : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="radio"
                                name="target_list"
                                value={list.id}
                                checked={isSelected}
                                onChange={() => setTargetListId(list.id)}
                                className="w-3.5 h-3.5 text-sky-600 focus:ring-sky-500 cursor-pointer accent-sky-500"
                              />
                              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                              <span className="font-semibold text-xs">{list.name}</span>
                            </div>
                            {list.description && (
                              <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                                {list.description}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="flex items-center justify-between gap-2 border-t border-slate-100 dark:border-white/5 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsListModalOpen(false)}
                disabled={batchActionLoading}
                className="text-xs h-8"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleBatchAddToList}
                disabled={
                  batchActionLoading ||
                  (isCreatingInlineList ? !newListName.trim() : !targetListId)
                }
                className="bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs h-8 px-4 shadow-sm shadow-sky-600/30"
              >
                {batchActionLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar {selectedIds.size} negocios</span>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}
