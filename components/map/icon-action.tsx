"use client";

/**
 * IconAction — small icon button with a hover tooltip bubble.
 *
 * Used inside the radar results table to show contact info (phone, address,
 * web) as compact icons instead of long text. The user can hover to see the
 * full value in a tooltip and click to either:
 *   - copy the value to the clipboard (default, with brief "Copied" feedback)
 *   - open the value in a new tab (when `href` is provided)
 *
 * The click handler stops propagation so the parent table row's
 * onClick doesn't fire.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export type IconActionKind = "phone" | "address" | "web" | "generic";

const ICON_FOR_KIND: Record<IconActionKind, string> = {
  phone: "📞",
  address: "📍",
  web: "🔗",
  generic: "ℹ️",
};

const LABEL_FOR_KIND: Record<IconActionKind, string> = {
  phone: "Teléfono",
  address: "Dirección",
  web: "Web",
  generic: "Info",
};

interface IconActionProps {
  /** The full value to show in the tooltip and copy to clipboard */
  value: string;
  /** What kind of value this is — drives the icon and label */
  kind?: IconActionKind;
  /** Override the icon */
  icon?: string;
  /** Override the label shown in the tooltip */
  label?: string;
  /** If provided, the button becomes an external link instead of copy */
  href?: string;
  /**
   * Google search query to use when `value` is missing. When provided
   * and value is empty, the button renders a dashed "?" icon that
   * opens a Google search for this query on click — turning empty
   * cells into a useful "look it up on Google" action instead of a
   * dead "—" dash.
   */
  fallbackQuery?: string;
  /** Tooltip placement relative to the icon */
  placement?: "top" | "bottom";
  /** Force disabled state (renders as muted "—" instead of an icon) */
  disabled?: boolean;
  /** Optional className passthrough for the outer wrapper */
  className?: string;
}

export default function IconAction({
  value,
  kind = "generic",
  icon,
  label,
  href,
  fallbackQuery,
  placement = "top",
  disabled = false,
  className,
}: IconActionProps) {
  const [hovered, setHovered] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const hasValue = Boolean(value && value.trim().length > 0);
  const canFallback = !hasValue && Boolean(fallbackQuery && fallbackQuery.trim().length > 0);

  const handleCopyClick = React.useCallback(
    async (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (disabled) return;
      if (!hasValue) return;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(value);
        } else {
          // Fallback for older browsers / non-secure contexts
          const ta = document.createElement("textarea");
          ta.value = value;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        /* clipboard blocked — no-op */
      }
    },
    [value, disabled, hasValue]
  );

  // Handler used by the fallback "?" button: stops the parent row's
  // onClick (which would otherwise navigate to the business profile)
  // and lets the native <a target="_blank"> behaviour open the Google
  // search in a new tab. Using a real <a> is important: window.open
  // can be blocked by aggressive pop-up blockers and would also break
  // middle-click / ctrl-click / right-click semantics.
  const handleAnchorClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
    },
    []
  );

  // ───────── Render branches ─────────
  if (disabled) {
    return (
      <span
        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-700 text-[14px]"
        title="No disponible"
        aria-label="No disponible"
      >
        —
      </span>
    );
  }

  // Empty value + fallback: dashed "?" icon that opens a Google search.
  // We don't make up data — we give the user a way to look it up themselves.
  // Render as <a target="_blank"> so middle-click / ctrl-click / right-click
  // → "open in new tab" all work natively and the pop-up blocker doesn't
  // interfere (which it would for a window.open() call).
  if (!hasValue && canFallback && fallbackQuery) {
    const fallbackHref = `https://www.google.com/search?q=${encodeURIComponent(fallbackQuery)}`;
    return (
      <a
        href={fallbackHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleAnchorClick}
        onAuxClick={handleAnchorClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        className={cn(
          "relative inline-flex items-center justify-center w-7 h-7 rounded-md",
          "bg-slate-50 dark:bg-transparent border border-dashed border-slate-300 dark:border-slate-600 hover:border-sky-500",
          "text-slate-500 hover:text-sky-600 dark:hover:text-sky-300",
          "transition-colors",
          "text-[12px] leading-none",
          className
        )}
        title="No disponible en Google Places — buscar en Google"
        aria-label="No disponible — buscar en Google"
      >
        <span aria-hidden="true">?</span>
        {hovered && (
          <span
            role="tooltip"
            className={cn(
              "absolute z-50 px-2 py-1 rounded text-[11px] whitespace-nowrap pointer-events-none",
              "shadow-lg border bg-slate-900 text-slate-100 border-slate-800 dark:border-white/15 tooltip-enter",
              placement === "top"
                ? "bottom-full left-1/2 -translate-x-1/2 mb-1.5"
                : "top-full left-1/2 -translate-x-1/2 mt-1.5"
            )}
          >
            🔍 Buscar en Google
          </span>
        )}
      </a>
    );
  }

  // Empty value + no fallback: graceful "—" placeholder (truly unknown)
  if (!hasValue) {
    return (
      <span
        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-400 dark:text-slate-700 text-[14px]"
        title="No disponible"
        aria-label="No disponible"
      >
        —
      </span>
    );
  }

  const theIcon = icon ?? ICON_FOR_KIND[kind];
  const theLabel = label ?? LABEL_FOR_KIND[kind];
  const showTooltip = (hovered && !copied) || copied;
  const tooltipText = copied
    ? "✓ Copiado"
    : value.length > 38
    ? `${theLabel}: ${value.slice(0, 38)}…`
    : `${theLabel}: ${value}`;

  const tooltipPos =
    placement === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-1.5"
      : "top-full left-1/2 -translate-x-1/2 mt-1.5";

  // When `href` is provided we render a real <a target="_blank"> instead of
  // a <button> + window.open. This way the browser's native "open in new
  // tab" behaviour works (including middle-click, ctrl-click, right-click
  // → "open in new tab") and aggressive pop-up blockers don't kill the
  // new tab the way they would a programmatic window.open() call.
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleAnchorClick}
        onAuxClick={handleAnchorClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        className={cn(
          "relative inline-flex items-center justify-center w-7 h-7 rounded-md",
          "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-700/80",
          "text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
          "border border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15",
          "transition-colors hover:z-50 focus:z-50",
          "text-[14px] leading-none",
          className
        )}
        aria-label={`${theLabel}: ${value} (abre en nueva pestaña)`}
        title={value.length > 38 ? `${theLabel}: ${value.slice(0, 38)}…` : `${theLabel}: ${value}`}
      >
        <span aria-hidden="true">{theIcon}</span>
        {hovered && (
          <span
            role="tooltip"
            className={cn(
              "absolute z-[100] px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap pointer-events-none",
              "shadow-xl border tooltip-enter",
              "bg-slate-900 text-slate-100 border-slate-800 dark:bg-slate-900/95 dark:border-white/20 backdrop-blur-sm",
              tooltipPos
            )}
          >
            {tooltipText}
          </span>
        )}
      </a>
    );
  }

  // No href: button that copies the value to the clipboard.
  return (
    <button
      type="button"
      onClick={handleCopyClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        // Don't clear `copied` here — let the timeout handle it
      }}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className={cn(
        "relative inline-flex items-center justify-center w-7 h-7 rounded-md",
        "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-700/80",
        "text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
        "border border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15",
        "transition-colors hover:z-50 focus:z-50",
        "text-[14px] leading-none",
        className
      )}
      aria-label={`${theLabel}: ${value}`}
    >
      <span aria-hidden="true">{theIcon}</span>
      {showTooltip && (
        <span
          role="tooltip"
          className={cn(
            "absolute z-[100] px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap pointer-events-none",
            "shadow-xl border tooltip-enter",
            copied
              ? "bg-emerald-600 text-white border-emerald-400 font-semibold"
              : "bg-slate-900 text-slate-100 border-slate-800 dark:bg-slate-900/95 dark:border-white/20 backdrop-blur-sm",
            tooltipPos
          )}
        >
          {tooltipText}
        </span>
      )}
    </button>
  );
}
