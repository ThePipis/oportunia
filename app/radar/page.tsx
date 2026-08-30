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
  if (/\d/.test(c)) return null;
  if (/\b(office|suite|ste|unit|bldg|building|dept|floor|fl|rm|room|space|spc|apt|lot|box|po\s*box|#)\b/i.test(c)) return null;
  if (/\b(ave|avenue|st|street|blvd|boulevard|rd|road|dr|drive|hwy|highway|pkwy|parkway|lane|ln|way|ct|court|circle|cir|terrace|ter|pl|place)\b/i.test(c)) return null;
  if (/^[A-Z]{2}$/i.test(c)) return null;
  c = c.replace(/,\s*(CA|California).*$/i, "").trim();
  return c.length >= 2 ? c : null;
}

function getBusinessCity(r: SearchResult): string {
  if (r.address) {
    for (const known of KNOWN_CITIES) {
      const regex = new RegExp(`\\b${known}\\b`, "i");
      if (regex.test(r.address)) {
        return known;
      }
    }
  }

  const validStored = sanitizeCityCandidate(r.city);
  if (validStored) {
    const match = KNOWN_CITIES.find((k) => k.toLowerCase() === validStored.toLowerCase());
    return match ?? validStored;
  }

  if (r.address) {
    const parts = r.address.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      for (let i = 1; i < parts.length; i++) {
        const candidate = sanitizeCityCandidate(parts[i]);
        if (candidate) {
          const match = KNOWN_CITIES.find((k) => k.toLowerCase() === candidate.toLowerCase());
          return match ?? candidate;
        }
      }
    }
  }

  return "—";
}

function getBusinessCategory(r: SearchResult, selectedCategoryIds: string[], locale: "es" | "en" = "es"): string {
  if (selectedCategoryIds.length === 1) {
    const singleCat = selectedCategoryIds[0];
    const singleCatName = singleCat.charAt(0).toUpperCase() + singleCat.slice(1);
    const translatedSingle = translateCategory(singleCatName, locale);
    if (translatedSingle && !translatedSingle.toLowerCase().includes("business") && !translatedSingle.toLowerCase().includes("point of interest")) {
      return translatedSingle;
    }
  }

  if (r.primary_type) {
    const raw = r.primary_type.trim();
    if (raw.length > 0) {
      const parts = raw.split(",").map((p: string) => p.trim()).filter(Boolean);
      const isGeneric = (str: string) => {
        const s = str.toLowerCase();
        return s === "negocio" || s === "business" || s === "point of interest" || s === "establishment" || s === "local business" || s === "point_of_interest";
      };

      const specificPart = parts.find((p: string) => !isGeneric(p));
      const chosen = specificPart || parts[0] || raw;
      const translated = translateCategory(chosen, locale);
      if (translated && !isGeneric(translated)) {
        return translated;
      }
      if (translated) return translated;
    }
  }

  if (selectedCategoryIds.length > 0) {
    const firstCat = selectedCategoryIds[0];
    const catName = firstCat.charAt(0).toUpperCase() + firstCat.slice(1);
    return translateCategory(catName, locale) || catName;
  }

  return translateCategory("Negocio Local", locale);
}

// ───────── Isolated Memoized Table Row for Maximum React Performance ─────────
interface RadarTableRowProps {
  r: SearchResult;
  isSelected: boolean;
  isExpanded: boolean;
  isChecked: boolean;
  cityDisplay: string;
  categoryDisplay: string;
  locale: string;
  t: (key: string, defaultText?: string) => string;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string, e?: React.MouseEvent) => void;
  onToggleCheck: (id: string, shiftKey: boolean) => void;
}

const RadarTableRow = React.memo(
  function RadarTableRow({
    r,
    isSelected,
    isExpanded,
    isChecked,
    cityDisplay,
    categoryDisplay,
    locale,
    t,
    onSelect,
    onToggleExpand,
    onToggleCheck,
  }: RadarTableRowProps) {
    const mapsHref =
      r.lat != null && r.lng != null
        ? `https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}`
        : null;

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

    const serviceNames =
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
      <React.Fragment>
        <tr
          id={`biz-row-${r.id}`}
          onClick={() => onSelect(r.id)}
          className={`border-b border-slate-100 dark:border-white/5 transition-colors cursor-pointer ${
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
              onToggleCheck(r.id, e.shiftKey);
            }}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onClick={(e) => {
                e.stopPropagation();
                onToggleCheck(r.id, e.shiftKey);
              }}
              onChange={() => {}}
              className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-sky-500 cursor-pointer accent-sky-500"
              aria-label={`Seleccionar ${r.name}`}
            />
          </td>

          {/* 1. Negocio con toggle expandible */}
          <td className="py-1.5 pl-2 pr-2 align-middle">
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                type="button"
                onClick={(e) => onToggleExpand(r.id, e)}
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
              title={categoryDisplay}
            >
              {categoryDisplay}
            </span>
          </td>

          {/* 3. Ciudad */}
          <td className="py-1.5 px-2 align-middle">
            <span
              className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap"
              title={cityDisplay}
            >
              <span className="text-slate-400 text-[10px] shrink-0">📍</span>
              <span className="truncate">{cityDisplay}</span>
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
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-500/15 dark:border-purple-500/30 dark:text-purple-300 shadow-2xs font-mono cursor-help transition-all hover:scale-105"
              title={`${locale === "en" ? "Matched AI Services to install:" : "Servicios IA a instalar:"}\n• ${serviceNames.join("\n• ")}`}
            >
              <span>🤖</span>
              <span>
                {count} {count === 1 ? t("radar.serviceSingleBadge", "servicio") : t("radar.servicesBadge", "servicios")}
              </span>
            </span>
          </td>

          {/* 6. Rating */}
          <td className="py-1.5 px-1.5 align-middle text-center whitespace-nowrap">
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
                onClick={(e) => onToggleExpand(r.id, e)}
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
  },
  (prev, next) => {
    return (
      prev.r.id === next.r.id &&
      prev.r.total_score === next.r.total_score &&
      prev.r.rating === next.r.rating &&
      prev.r.review_count === next.r.review_count &&
      prev.r.distance_miles === next.r.distance_miles &&
      prev.isSelected === next.isSelected &&
      prev.isExpanded === next.isExpanded &&
      prev.isChecked === next.isChecked &&
      prev.cityDisplay === next.cityDisplay &&
      prev.categoryDisplay === next.categoryDisplay &&
      prev.locale === next.locale
    );
  }
);

export default function RadarPage() {
  const { t, locale } = useT();
  const { state, update, clear, hydrated } = useRadarSearchState();

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

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [focusTick, setFocusTick] = React.useState<number>(0);
  
  // Filter collapse state (always collapsed/folded by default to give maximum visibility to map & table)
  const [isFilterCollapsed, setIsFilterCollapsed] = React.useState<boolean>(true);

  const toggleFilterCollapsed = () => {
    setIsFilterCollapsed((prev) => !prev);
  };

  const handleClearFilters = () => {
    clear();
  };

  const [expandedRowId, setExpandedRowId] = React.useState<string | null>(null);

  const toggleRowExpand = React.useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedRowId((prev) => (prev === id ? null : id));
  }, []);

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
        if (!data || !data.scores) return;
        const scoreMap: Record<
          string,
          { total_score?: number | null; matched_services_count?: number | null; matched_service_names?: string[]; matched_service_names_en?: string[] }
        > = data.scores;
        let hasChanges = false;
        const nextResults = results.map((r) => {
          const synced = scoreMap[r.id];
          if (!synced) return r;
          if (
            synced.total_score !== r.total_score ||
            synced.matched_services_count !== r.matched_services_count ||
            (synced.matched_service_names && JSON.stringify(synced.matched_service_names) !== JSON.stringify(r.matched_service_names))
          ) {
            hasChanges = true;
            return {
              ...r,
              total_score: synced.total_score ?? r.total_score,
              matched_services_count: synced.matched_services_count ?? r.matched_services_count,
              matched_service_names: synced.matched_service_names ?? r.matched_service_names,
              matched_service_names_en: synced.matched_service_names_en ?? r.matched_service_names_en,
            };
          }
          return r;
        });

        if (hasChanges) {
          update({ results: nextResults });
        }
      })
      .catch((e) => console.warn("Failed to sync scores from SQLite:", e));
  }, [hydrated]);

  // ───────── Multi-Selection for Bulk Actions (Export & Add to List) ─────────
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = React.useState<string | null>(null);

  // Bulk Add to List Modal State
  const [isBulkListModalOpen, setIsBulkListModalOpen] = React.useState(false);
  const [userLists, setUserLists] = React.useState<Array<{ id: string; name: string }>>([]);
  const [selectedTargetListId, setSelectedTargetListId] = React.useState<string>("");
  const [newListName, setNewListName] = React.useState("");
  const [isSavingBulk, setIsSavingBulk] = React.useState(false);
  const [bulkSaveSuccess, setBulkSaveSuccess] = React.useState(false);

  // Exclude saved in lists toggle state
  const [excludeSavedInLists, setExcludeSavedInLists] = React.useState<boolean>(false);
  const [omittedInListsCount, setOmittedInListsCount] = React.useState<number>(0);

  // Fetch user lists when opening the bulk modal
  const openBulkListModal = async () => {
    setIsBulkListModalOpen(true);
    setBulkSaveSuccess(false);
    try {
      const res = await fetch("/api/lists");
      if (res.ok) {
        const data = await res.json();
        setUserLists(data.lists || []);
        if (data.lists && data.lists.length > 0) {
          setSelectedTargetListId(data.lists[0].id);
        }
      }
    } catch {
      /* ignore */
    }
  };

  const handleBulkAddToList = async () => {
    if (selectedIds.size === 0) return;
    setIsSavingBulk(true);
    try {
      let targetListId = selectedTargetListId;

      if (targetListId === "NEW") {
        if (!newListName.trim()) {
          setIsSavingBulk(false);
          return;
        }
        const createRes = await fetch("/api/lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newListName.trim() }),
        });
        if (!createRes.ok) throw new Error("Error al crear la nueva lista");
        const createData = await createRes.json();
        targetListId = createData.list?.id || createData.id;
      }

      const selectedBusinesses = results.filter((r) => selectedIds.has(r.id));
      const payloadItems = selectedBusinesses.map((b) => ({
        businessId: b.id,
        name: b.name,
        address: b.address || "",
        city: b.city || "",
        phone: b.phone || "",
        website: b.website || "",
        rating: b.rating ?? null,
        reviewCount: b.review_count ?? null,
        totalScore: b.total_score ?? null,
        matchedServicesCount: b.matched_services_count ?? 1,
        lat: b.lat ?? null,
        lng: b.lng ?? null,
        categories: b.primary_type ? [b.primary_type] : [],
      }));

      const batchRes = await fetch(`/api/lists/${targetListId}/items/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payloadItems }),
      });

      if (!batchRes.ok) {
        throw new Error("Error en la inserción masiva en la lista");
      }

      setBulkSaveSuccess(true);
      setTimeout(() => {
        setIsBulkListModalOpen(false);
        setBulkSaveSuccess(false);
        setSelectedIds(new Set());
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Error al guardar negocios");
    } finally {
      setIsSavingBulk(false);
    }
  };

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
    // Automatically collapse filter panel when search begins
    setIsFilterCollapsed(true);
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
      if (score == null) return selectedTiers.includes("skip");
      if (score >= 75) return selectedTiers.includes("hot");
      if (score >= 60) return selectedTiers.includes("warm");
      if (score >= 40) return selectedTiers.includes("nurture");
      return selectedTiers.includes("skip");
    });
  }, [results, selectedTiers]);

  // ───────── Pre-calculate City & Category display once per result set (O(1) lookups) ─────────
  const businessDisplayCache = React.useMemo(() => {
    const cityMap = new Map<string, string>();
    const catMap = new Map<string, string>();
    for (const r of results) {
      cityMap.set(r.id, getBusinessCity(r));
      catMap.set(r.id, getBusinessCategory(r, selectedCategoryIds, locale === "en" ? "en" : "es"));
    }
    return { cityMap, catMap };
  }, [results, selectedCategoryIds, locale]);

  // ───────── Sorting Logic (O(N) Pre-Keyed Array Sort) ─────────
  const handleSort = (column: SortKey) => {
    if (sortBy === column) {
      if (sortDir === "desc") {
        setSortDir("asc");
      } else {
        setSortBy(null);
        setSortDir("desc");
      }
    } else {
      setSortBy(column);
      setSortDir(column === "score" || column === "services" || column === "rating" ? "desc" : "asc");
    }
  };

  const sortedResults = React.useMemo(() => {
    if (!sortBy) return filteredResults;

    const dir = sortDir === "asc" ? 1 : -1;
    const keyMap = new Map<string, any>();

    for (const r of filteredResults) {
      switch (sortBy) {
        case "score":
          keyMap.set(r.id, r.total_score ?? -1);
          break;
        case "services": {
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
          keyMap.set(r.id, count);
          break;
        }
        case "name":
          keyMap.set(r.id, (r.name || "").toLowerCase());
          break;
        case "category":
          keyMap.set(r.id, (businessDisplayCache.catMap.get(r.id) || "").toLowerCase());
          break;
        case "city":
          keyMap.set(r.id, (businessDisplayCache.cityMap.get(r.id) || "").toLowerCase());
          break;
        case "rating":
          keyMap.set(r.id, r.rating ?? -1);
          break;
        case "distance":
          keyMap.set(r.id, r.distance_miles ?? 999999);
          break;
        default:
          keyMap.set(r.id, null);
      }
    }

    return [...filteredResults].sort((a, b) => {
      const ka = keyMap.get(a.id);
      const kb = keyMap.get(b.id);

      if (ka == null && kb == null) return 0;
      if (ka == null) return 1;
      if (kb == null) return -1;

      if (typeof ka === "number" && typeof kb === "number") {
        if (ka === kb) {
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
  }, [filteredResults, sortBy, sortDir, businessDisplayCache]);

  const handleSelectRow = React.useCallback((id: string) => {
    update({ selectedBusinessId: id });
    setFocusTick(Date.now());
    setExpandedRowId((prev) => (prev === id ? null : id));
  }, [update]);

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

  // Auto-Focus, Auto-Pagination & Auto-Expand when clicking a business marker on the map
  const handleSelectBusinessFromMap = React.useCallback(
    (id: string) => {
      update({ selectedBusinessId: id });
      setFocusTick(Date.now());
      setExpandedRowId(id);

      const targetIndex = sortedResults.findIndex((r) => r.id === id);
      if (targetIndex !== -1) {
        const targetPage = Math.floor(targetIndex / pageSize) + 1;
        setCurrentPage(targetPage);

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

  // Checkbox multi-selection handlers
  const toggleSelect = React.useCallback(
    (id: string, shiftKey: boolean = false) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (shiftKey && lastSelectedId && lastSelectedId !== id) {
          const list = sortedResults;
          const idxA = list.findIndex((r) => r.id === lastSelectedId);
          const idxB = list.findIndex((r) => r.id === id);
          if (idxA !== -1 && idxB !== -1) {
            const start = Math.min(idxA, idxB);
            const end = Math.max(idxA, idxB);
            for (let i = start; i <= end; i++) {
              next.add(list[i].id);
            }
            return next;
          }
        }

        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
      setLastSelectedId(id);
    },
    [sortedResults, lastSelectedId]
  );

  const toggleSelectAll = React.useCallback(() => {
    const pageIds = paginatedResults.map((r) => r.id);
    const allPageSelected = pageIds.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [paginatedResults, selectedIds]);

  const selectEntireSearchResult = React.useCallback(() => {
    const allIds = sortedResults.map((r) => r.id);
    setSelectedIds(new Set(allIds));
  }, [sortedResults]);

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
    setLastSelectedId(null);
  }, []);

  const mapMarkers: BusinessMarker[] = React.useMemo(() => {
    return results
      .filter((r) => r.lat != null && r.lng != null)
      .map((r) => ({
        id: r.id,
        name: r.name,
        lat: r.lat!,
        lng: r.lng!,
        rating: r.rating ?? undefined,
        reviewCount: r.review_count ?? undefined,
        address: r.address || undefined,
        phone: r.phone || undefined,
        website: r.website || undefined,
        totalScore: r.total_score ?? undefined,
        matchedServicesCount: r.matched_services_count ?? undefined,
      }));
  }, [results]);

  return (
    <div className="p-1.5 sm:p-2 md:p-2.5 space-y-1.5 max-w-[1900px] w-full mx-auto flex flex-col min-h-0 lg:h-[calc(100vh-3.6rem)] lg:overflow-hidden">
        {/* Error banner */}
        {error && (
          <Card className="border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5 shrink-0">
            <CardContent className="py-2.5 px-3 text-red-700 dark:text-red-300 text-sm flex items-center justify-between">
              <span>
                <strong>{t("common.error", "Error:")}</strong> {error}
                {(error.includes("GOOGLE_PLACES_API_KEY") || error.includes("GEOAPIFY_API_KEY") || error.includes("API key")) && (
                  <span className="block mt-0.5 text-xs text-red-700 dark:text-red-400">
                    → Configura tu API key en <a href="/tools" className="underline font-semibold">/tools</a>
                  </span>
                )}
              </span>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 text-base leading-none cursor-pointer"
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
                      onClick={handleClearFilters}
                      className="ml-1 hover:text-sky-950 dark:hover:text-white underline underline-offset-2 text-[10px] text-sky-600 dark:text-sky-400 font-semibold cursor-pointer"
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
                  onClick={handleClearFilters}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:underline underline-offset-2 transition-colors font-medium px-1.5 py-0.5 cursor-pointer"
                >
                  {t("radar.clearFilters", "Limpiar filtros")}
                </button>

                {/* Primary Search Button in Header when Collapsed */}
                {isFilterCollapsed && (
                  <Button
                    type="button"
                    onClick={handleSearch}
                    disabled={loading}
                    className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold h-7 px-3 text-xs shadow-xs transition-all cursor-pointer"
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
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-white/10 cursor-pointer"
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
                          radiusMiles: suggestedRadius || radiusMiles,
                        })
                      }
                      placeholder={t("radar.locationPlaceholder", "Ciudad, CP o dirección...")}
                    />
                  </div>

                  {/* 2. Categorías (4 cols) */}
                  <div className="lg:col-span-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {t("radar.categoriesLabel", "Categorías")}
                      </Label>
                      {selectedCategoryIds.length > 0 && (
                        <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                          {selectedCategoryIds.length} {t("common.selectedCount", "seleccionadas")}
                        </span>
                      )}
                    </div>
                    <CategoryMultiSelect
                      value={hydrated ? selectedCategoryIds : []}
                      onChange={(ids) => update({ selectedCategoryIds: ids })}
                    />
                  </div>

                  {/* 3. Término de búsqueda libre (3 cols) */}
                  <div className="lg:col-span-3 space-y-1">
                    <Label htmlFor="query" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t("radar.freeQueryLabel", "Término libre")}
                    </Label>
                    <Input
                      id="query"
                      value={hydrated ? query : ""}
                      onChange={(e) => update({ query: e.target.value })}
                      placeholder={t("radar.freeQueryPlaceholder", "ej: dental, roof, pizza...")}
                      className="h-8 text-xs border-slate-200 dark:border-white/10"
                    />
                  </div>

                  {/* 4. Radio (1 col) */}
                  <div className="lg:col-span-1 space-y-1">
                    <Label htmlFor="radius" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t("radar.radiusLabel", "Radio (mi)")}
                    </Label>
                    <Input
                      id="radius"
                      type="number"
                      min={0.5}
                      max={100}
                      step={0.5}
                      value={hydrated ? radiusMiles : 5}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        update({ radiusMiles: isNaN(val) ? 5 : val });
                      }}
                      className="h-8 text-xs font-mono border-slate-200 dark:border-white/10"
                    />
                  </div>

                  {/* 5. Cantidad Máxima (1 col) */}
                  <div className="lg:col-span-1 space-y-1">
                    <Label htmlFor="maxResults" className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate" title="Límite de negocios">
                      {t("radar.maxResultsLabel", "Límite")}
                    </Label>
                    <select
                      id="maxResults"
                      value={hydrated ? (maxResults ?? 0) : 0}
                      onChange={(e) => update({ maxResults: Number(e.target.value) })}
                      className="w-full h-8 text-xs font-mono rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-2 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    >
                      <option value={0}>{t("radar.maxResultsOptionAll", "Todos")}</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                {/* Submit row */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setExcludeSavedInLists((prev) => !prev)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                        excludeSavedInLists
                          ? "bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-500/20 dark:border-amber-500/40 dark:text-amber-200 shadow-2xs font-bold"
                          : "bg-slate-100/70 border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:border-white/10 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                      title="Omite automáticamente los negocios que ya guardaste en cualquiera de tus listas para ahorrar llamadas a la API"
                    >
                      <span>{excludeSavedInLists ? "🚫" : "📋"}</span>
                      <span>{excludeSavedInLists ? t("radar.excludeInListsActive", "Ocultando negocios ya en listas") : t("radar.excludeInListsInactive", "Ocultar en listas")}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold h-8 px-4 text-xs shadow-xs transition-all cursor-pointer"
                    >
                      {loading ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>{t("radar.searchingPlaces", "Buscando...")}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <span>⚡</span>
                          <span>{t("radar.searchButton", "Buscar")}</span>
                        </span>
                      )}
                    </Button>
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
                selectedId={selectedBusinessId}
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
                  <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-200">{t("radar.searchingPlaces", "Buscando negocios en el área...")}</p>
                </CardContent>
              </Card>
            )}

            {!loading && hydrated && searched && results.length === 0 && (
              <Card className="flex-1 flex items-center justify-center border-slate-200 dark:border-white/10 shadow-xs bg-white/80 dark:bg-slate-900/60 backdrop-blur-xs">
                <CardContent className="py-10 text-center">
                  <span className="text-3xl">🔭</span>
                  <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{t("radar.noResultsTitle", "No encontramos negocios con estos filtros")}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    {t("radar.noResultsSubtitle", "Probá ampliando el radio de búsqueda o quitando filtros específicos.")}
                  </p>
                </CardContent>
              </Card>
            )}

            {!loading && (!searched || results.length === 0) && !hydrated && (
              <Card className="flex-1 flex items-center justify-center border-slate-200 dark:border-white/10 shadow-xs bg-white/80 dark:bg-slate-900/60 backdrop-blur-xs">
                <CardContent className="py-10 text-center">
                  <span className="text-3xl">📡</span>
                  <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{t("radar.startSearchTitle", "Iniciá una búsqueda en el radar")}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    {t("radar.startSearchSubtitle", "Elegí una categoría o ubicación para escanear oportunidades con IA.")}
                  </p>
                </CardContent>
              </Card>
            )}

            {!loading && results.length > 0 && (
              <Card className="flex-1 flex flex-col min-h-0 border-slate-200 dark:border-white/10 shadow-xs bg-white/90 dark:bg-slate-900/80 backdrop-blur-xs overflow-hidden">
                <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                  {/* Results Count & Bulk Action Bar */}
                  <div className="px-3 py-1.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-2 flex-wrap bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {totalFound} {t("radar.businessesFound", "negocios encontrados")}
                      </span>
                      {selectedIds.size > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 text-xs font-bold font-mono">
                          <span>✓ {selectedIds.size}</span>
                          <span className="text-[10px] font-normal">{t("common.selectedCount", "seleccionados")}</span>
                        </span>
                      )}
                      {omittedInListsCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[11px] font-medium border border-amber-200 dark:border-amber-500/30" title="Negocios omitidos por ya estar guardados en tus listas">
                          <span>🚫 {omittedInListsCount} {t("radar.omittedCountBadge", "ya en listas")}</span>
                        </span>
                      )}
                    </div>

                    {/* Score Tier Filter Pills */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => toggleTier("hot")}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border cursor-pointer ${
                          selectedTiers.includes("hot")
                            ? "bg-red-500 text-white border-red-600 shadow-2xs"
                            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30 hover:bg-red-100"
                        }`}
                        title="Score 75+: Alta urgencia / High ticket"
                      >
                        <span>🔥 HOT</span>
                        <span className="opacity-80 font-mono">({tierCounts.hot})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleTier("warm")}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border cursor-pointer ${
                          selectedTiers.includes("warm")
                            ? "bg-emerald-500 text-white border-emerald-600 shadow-2xs"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30 hover:bg-emerald-100"
                        }`}
                        title="Score 60-74: Lead Caliente / Calificado"
                      >
                        <span>⚡ WARM</span>
                        <span className="opacity-80 font-mono">({tierCounts.warm})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleTier("nurture")}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border cursor-pointer ${
                          selectedTiers.includes("nurture")
                            ? "bg-orange-500 text-white border-orange-600 shadow-2xs"
                            : "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/30 hover:bg-orange-100"
                        }`}
                        title="Score 40-59: Lead en nutrición / Oportunidad media"
                      >
                        <span>🌱 NURTURE</span>
                        <span className="opacity-80 font-mono">({tierCounts.nurture})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleTier("skip")}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border cursor-pointer ${
                          selectedTiers.includes("skip")
                            ? "bg-yellow-500 text-white border-yellow-600 shadow-2xs"
                            : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-300 dark:border-yellow-500/30 hover:bg-yellow-100"
                        }`}
                        title="Score <40: Oportunidad baja / Descartar"
                      >
                        <span>⚪ SKIP</span>
                        <span className="opacity-80 font-mono">({tierCounts.skip})</span>
                      </button>
                    </div>

                    {/* Bulk Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      {selectedIds.size > 0 ? (
                        <>
                          <Button
                            size="sm"
                            onClick={openBulkListModal}
                            className="h-7 px-2.5 text-xs bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-xs cursor-pointer"
                          >
                            <span>📥 {t("radar.saveToListBulk", "Guardar en Lista")} ({selectedIds.size})</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={clearSelection}
                            className="h-7 px-2 text-xs border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 cursor-pointer"
                          >
                            {t("common.clear", "Limpiar")}
                          </Button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={selectEntireSearchResult}
                          className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                        >
                          {t("radar.selectAllCount", { count: sortedResults.length }, `Seleccionar todos (${sortedResults.length})`)}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Scrollable Table Viewport */}
                  <div className="flex-1 overflow-auto min-h-0">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-white/10">
                          {/* 0. Bulk Checkbox Column Header */}
                          <th className="sticky top-0 z-30 bg-slate-100 dark:bg-slate-900 py-2 px-1 text-center w-8 border-b border-slate-200 dark:border-white/10">
                            <input
                              type="checkbox"
                              checked={
                                paginatedResults.length > 0 &&
                                paginatedResults.every((r) => selectedIds.has(r.id))
                              }
                              onChange={toggleSelectAll}
                              className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-sky-500 cursor-pointer accent-sky-500"
                              aria-label={t("radar.selectAllOnPage", "Seleccionar todos en esta página")}
                            />
                          </th>
                          <SortableHeader
                            column="name"
                            label={t("radar.colBusiness", "Negocio")}
                            sortBy={sortBy}
                            sortDir={sortDir}
                            onSort={handleSort}
                            className="pl-2 pr-2 min-w-[140px] max-w-[180px]"
                          />
                          <SortableHeader
                            column="category"
                            label={t("radar.colCategory", "Categoría")}
                            sortBy={sortBy}
                            sortDir={sortDir}
                            onSort={handleSort}
                            className="px-2 min-w-[100px] max-w-[140px]"
                          />
                          <SortableHeader
                            column="city"
                            label={t("radar.colCity", "Ciudad")}
                            sortBy={sortBy}
                            sortDir={sortDir}
                            onSort={handleSort}
                            className="px-2 min-w-[90px]"
                          />
                          <SortableHeader
                            column="score"
                            label={t("radar.colScore", "Score 5D")}
                            sortBy={sortBy}
                            sortDir={sortDir}
                            onSort={handleSort}
                            className="px-1.5 min-w-[90px]"
                          />
                          <SortableHeader
                            column="services"
                            label={t("radar.colAiServices", "Servicios IA")}
                            sortBy={sortBy}
                            sortDir={sortDir}
                            onSort={handleSort}
                            className="px-1.5 text-center min-w-[105px]"
                          />
                          <SortableHeader
                            column="rating"
                            label={t("radar.colRating", "Rating")}
                            sortBy={sortBy}
                            sortDir={sortDir}
                            onSort={handleSort}
                            className="px-1.5 text-center min-w-[70px]"
                          />
                          <SortableHeader
                            column="distance"
                            label={t("radar.colDistance", "Dist.")}
                            sortBy={sortBy}
                            sortDir={sortDir}
                            onSort={handleSort}
                            className="px-1.5 text-right min-w-[60px]"
                          />
                          <th className="sticky top-0 z-30 bg-slate-100 dark:bg-slate-900 font-semibold py-2 pl-1.5 pr-2.5 text-right whitespace-nowrap text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10 w-20">
                            {t("radar.colActions", "Acción")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedResults.map((r) => (
                          <RadarTableRow
                            key={r.id}
                            r={r}
                            isSelected={r.id === selectedBusinessId}
                            isExpanded={expandedRowId === r.id}
                            isChecked={selectedIds.has(r.id)}
                            cityDisplay={businessDisplayCache.cityMap.get(r.id) || "—"}
                            categoryDisplay={businessDisplayCache.catMap.get(r.id) || "—"}
                            locale={locale}
                            t={t}
                            onSelect={handleSelectRow}
                            onToggleExpand={toggleRowExpand}
                            onToggleCheck={toggleSelect}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  {totalPages > 1 && (
                    <div className="px-3 py-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-2 bg-slate-50/90 dark:bg-slate-900/90 shrink-0">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {t("radar.pageCount", { current: safePage, total: totalPages }, `Página ${safePage} de ${totalPages}`)} ({sortedResults.length} {t("radar.resultsCount", "resultados")})
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrentPage(1)}
                          disabled={safePage === 1}
                          className="h-7 px-2 text-xs border-slate-200 dark:border-white/10 disabled:opacity-40 cursor-pointer"
                          title={t("radar.firstPage", "Primera página")}
                        >
                          ««
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={safePage === 1}
                          className="h-7 px-2.5 text-xs border-slate-200 dark:border-white/10 disabled:opacity-40 cursor-pointer"
                        >
                          {t("radar.prevPage", "← Anterior")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={safePage === totalPages}
                          className="h-7 px-2.5 text-xs border-slate-200 dark:border-white/10 disabled:opacity-40 cursor-pointer"
                        >
                          {t("radar.nextPage", "Siguiente →")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={safePage === totalPages}
                          className="h-7 px-2 text-xs border-slate-200 dark:border-white/10 disabled:opacity-40 cursor-pointer"
                          title={t("radar.lastPage", "Última página")}
                        >
                          »»
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* ───────── Bulk Add to List Modal Dialog ───────── */}
        <Dialog open={isBulkListModalOpen} onOpenChange={setIsBulkListModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>📥</span>
                <span>{t("radar.bulkModalTitle", { count: selectedIds.size }, `Guardar ${selectedIds.size} Negocios en Lista`)}</span>
              </DialogTitle>
              <DialogDescription>
                {t("radar.bulkModalSubtitle", "Selecciona una lista existente o crea una nueva para organizar y dar seguimiento a estos leads.")}
              </DialogDescription>
            </DialogHeader>

            {bulkSaveSuccess ? (
              <div className="py-6 text-center text-emerald-600 dark:text-emerald-400 font-semibold space-y-1">
                <span className="text-3xl">✓</span>
                <p>{t("radar.bulkSavedSuccess", "¡Negocios guardados exitosamente en la lista!")}</p>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("radar.bulkDestinationList", "Lista de destino")}
                  </Label>
                  <select
                    value={selectedTargetListId}
                    onChange={(e) => setSelectedTargetListId(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  >
                    {userLists.map((l) => (
                      <option key={l.id} value={l.id}>
                        📋 {l.name}
                      </option>
                    ))}
                    <option value="NEW">➕ {t("radar.createNewListOption", "Crear una nueva lista...")}</option>
                  </select>
                </div>

                {selectedTargetListId === "NEW" && (
                  <div className="space-y-1.5 animate-in fade-in-50 duration-150">
                    <Label htmlFor="newListName" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t("radar.newListNameLabel", "Nombre de la nueva lista")}
                    </Label>
                    <Input
                      id="newListName"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder={t("radar.newListNamePlaceholder", "ej: Clínicas Dentales - Corona...")}
                      className="h-9 text-xs"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBulkListModalOpen(false)}
                disabled={isSavingBulk}
                className="text-xs cursor-pointer"
              >
                {t("common.cancel", "Cancelar")}
              </Button>
              {!bulkSaveSuccess && (
                <Button
                  type="button"
                  onClick={handleBulkAddToList}
                  disabled={isSavingBulk || (selectedTargetListId === "NEW" && !newListName.trim())}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs cursor-pointer"
                >
                  {isSavingBulk ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t("common.saving", "Guardando...")}</span>
                    </span>
                  ) : (
                    <span>{t("radar.confirmSaveBulk", { count: selectedIds.size }, `Guardar ${selectedIds.size} negocios`)}</span>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
