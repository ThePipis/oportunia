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
  placement = "top",
  disabled = false,
  className,
}: IconActionProps) {
  const [hovered, setHovered] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleClick = React.useCallback(
    async (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (disabled || !value) return;
      if (href) {
        window.open(href, "_blank", "noopener,noreferrer");
        return;
      }
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
    [value, href, disabled]
  );

  if (disabled || !value) {
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

  const button = (
    <button
      type="button"
      onClick={handleClick}
      onAuxClick={(e) => {
        // Middle-click: open href in new tab if href is provided
        if (href && e.button === 1) {
          e.stopPropagation();
          window.open(href, "_blank", "noopener,noreferrer");
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        // Don't clear `copied` here — let the timeout handle it
      }}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className={cn(
        "relative inline-flex items-center justify-center w-7 h-7 rounded-md",
        "bg-slate-800/60 hover:bg-slate-700/80",
        "text-slate-300 hover:text-white",
        "border border-white/5 hover:border-white/15",
        "transition-colors",
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
            "absolute z-50 px-2 py-1 rounded text-[11px] whitespace-nowrap pointer-events-none",
            "shadow-lg border tooltip-enter",
            copied
              ? "bg-emerald-500 text-white border-emerald-300"
              : "bg-slate-900 text-slate-100 border-white/15",
            tooltipPos
          )}
        >
          {tooltipText}
        </span>
      )}
    </button>
  );

  return button;
}
