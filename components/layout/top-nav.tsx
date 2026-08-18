"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { LanguageToggle } from "./language-toggle";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", icon: "◎" },
  { href: "/radar", label: "Radar", icon: "◎" },
  { href: "/tools", label: "Tools", icon: "🔧" },
  { href: "/services", label: "Servicios", icon: "🎯" },
  { href: "/lists", label: "Listas", icon: "📋" },
  { href: "/crm", label: "CRM", icon: "📊" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function TopNav() {
  const { t } = useT();
  const pathname = usePathname() || "/";

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo + home link */}
        <Link
          href="/"
          className="flex items-center gap-2 group"
          aria-label="Inicio"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-sky-500 flex items-center justify-center text-base">
            ◎
          </div>
          <span className="font-bold text-slate-100 hidden sm:inline group-hover:text-sky-300 transition-colors">
            OportunIA
          </span>
        </Link>

        {/* Nav links (desktop) */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {NAV_ITEMS.slice(1).map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                  active
                    ? "bg-sky-500/20 text-sky-200 border border-sky-500/40"
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                )}
              >
                {item.icon} {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: lang toggle */}
        <div className="flex items-center gap-2">
          <LanguageToggle />
        </div>
      </div>

      {/* Mobile nav (horizontal scroll) */}
      <div className="md:hidden border-t border-white/5 overflow-x-auto">
        <div className="flex items-center gap-1 px-3 py-2 min-w-max">
          {NAV_ITEMS.slice(1).map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap",
                  active
                    ? "bg-sky-500/20 text-sky-200"
                    : "text-slate-400 hover:text-slate-100"
                )}
              >
                {item.icon} {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
