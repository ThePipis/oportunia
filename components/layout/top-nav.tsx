"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { LanguageToggle } from "./language-toggle";
import { ThemeToggle } from "./theme-toggle";
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
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-white/10">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo + home link */}
        <Link
          href="/"
          className="flex items-center gap-2 group"
          aria-label="Inicio"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-sky-500 flex items-center justify-center text-base shadow-sm">
            ◎
          </div>
          <span className="font-bold text-slate-900 dark:text-slate-100 hidden sm:inline group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors">
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
                prefetch={true}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                  active
                    ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-xs dark:bg-sky-500/20 dark:text-sky-200 dark:border-sky-500/40"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/5"
                )}
              >
                {item.icon} {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: theme + lang toggles */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </div>

      {/* Mobile nav (horizontal scroll) */}
      <div className="md:hidden border-t border-slate-200/60 dark:border-white/5 overflow-x-auto">
        <div className="flex items-center gap-1 px-3 py-2 min-w-max">
          {NAV_ITEMS.slice(1).map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap",
                  active
                    ? "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-500/20 dark:text-sky-200 dark:border-transparent"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100"
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
