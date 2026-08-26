"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radar,
  Radio,
  Users,
  Package,
  Kanban,
  Wrench,
  Settings,
  PanelLeft,
  PanelLeftClose,
} from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  labelKey: string;
  defaultLabel: string;
  icon: React.ElementType;
  badge?: string;
}

const MAIN_NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "nav.dashboard", defaultLabel: "Dashboard", icon: LayoutDashboard },
  { href: "/radar", labelKey: "nav.prospector", defaultLabel: "Prospector", icon: Radar },
  { href: "/social-radar", labelKey: "nav.socialRadar", defaultLabel: "Social Radar", icon: Radio, badge: "AI" },
  { href: "/lists", labelKey: "nav.clients", defaultLabel: "Clientes", icon: Users },
  { href: "/services", labelKey: "nav.services", defaultLabel: "Servicios", icon: Package },
  { href: "/crm", labelKey: "nav.crm", defaultLabel: "Pipeline CRM", icon: Kanban },
];

const TOOLS_NAV_ITEMS: NavItem[] = [
  { href: "/tools", labelKey: "nav.tools", defaultLabel: "Tools & APIs", icon: Wrench },
  { href: "/settings", labelKey: "nav.settings", defaultLabel: "Configuración", icon: Settings },
];

interface AppSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AppSidebar({ mobileOpen = false, onMobileClose }: AppSidebarProps) {
  const { t } = useT();
  const pathname = usePathname() || "/";

  // Persistent Open State (defaults to true)
  const [isOpen, setIsOpen] = React.useState<boolean>(true);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("oportunia-sidebar-open");
      if (saved !== null) {
        setIsOpen(saved === "true");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("oportunia-sidebar-open", String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const renderNavLinks = (items: NavItem[], forceExpanded = false) => {
    const showExpanded = forceExpanded || isOpen;

    return items.map((item) => {
      const Icon = item.icon;
      const label = t(item.labelKey, item.defaultLabel);
      const isActive =
        item.href === "/"
          ? pathname === "/"
          : item.href === "/radar"
          ? pathname.startsWith("/radar") || pathname.startsWith("/proposals")
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

      if (showExpanded) {
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            onClick={onMobileClose}
            className={cn(
              "group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 select-none",
              isActive
                ? "bg-emerald-500/10 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300 font-bold border border-emerald-500/20 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/5 border border-transparent"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200"
                )}
              />
              <span className="truncate animate-in fade-in duration-150">{label}</span>
            </div>

            {item.badge ? (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                {item.badge}
              </span>
            ) : isActive ? (
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0" />
            ) : null}
          </Link>
        );
      }

      // Collapsed Rail item with floating tooltip
      return (
        <div key={item.href} className="relative group flex items-center justify-center">
          <Link
            href={item.href}
            prefetch={true}
            onClick={onMobileClose}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-xl text-xs font-semibold transition-all duration-150 select-none relative z-10",
              isActive
                ? "bg-emerald-500/10 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300 font-bold border border-emerald-500/20 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/5 border border-transparent"
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4 shrink-0 transition-colors",
                isActive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200"
              )}
            />
          </Link>

          {/* Floating Tooltip Bubble (Exact Gemini Style) */}
          <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-black text-white dark:bg-slate-900 dark:text-white border border-white/10 rounded-xl text-xs font-semibold whitespace-nowrap shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-150 ease-out z-50">
            {label}
          </div>
        </div>
      );
    });
  };

  const getSidebarBody = (forceExpanded = false) => {
    const showExpanded = forceExpanded || isOpen;

    return (
      <div className={cn("flex flex-col h-full select-none", showExpanded ? "overflow-hidden" : "overflow-visible")}>
        {/* 1. Header: Brand / Morphing Toggle Button */}
        <div
          className={cn(
            "p-3.5 border-b border-slate-200/70 dark:border-white/5 flex items-center transition-all overflow-visible",
            showExpanded ? "justify-between" : "justify-center"
          )}
        >
          {showExpanded ? (
            <>
              <Link
                href="/"
                prefetch={true}
                onClick={onMobileClose}
                className="flex items-center gap-2.5 group min-w-0"
                title={`${t("app.name", "OportunIA")} - ${t("app.tagline", "Radar & AI Services")}`}
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
                  ⚡
                </div>
                <div className="min-w-0 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-100 truncate">
                      {t("app.name", "OportunIA")}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 shrink-0">
                      {t("app.badge", "B2B")}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium truncate">
                    {t("app.tagline", "Radar & AI Services")}
                  </p>
                </div>
              </Link>

              {/* Desktop Collapse Button */}
              {!mobileOpen && (
                <div className="relative group flex items-center">
                  <button
                    type="button"
                    onClick={toggleOpen}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                    aria-label={t("common.closeSidebar", "Cerrar barra lateral")}
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 px-2.5 py-1 bg-black text-white dark:bg-slate-900 dark:text-white border border-white/10 rounded-lg text-[11px] font-semibold whitespace-nowrap shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-150 z-50">
                    {t("common.closeSidebar", "Cerrar barra lateral")}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Collapsed Logo Button with Hover Morphing to Sidebar Icon + Tooltip */
            <div className="relative group flex items-center justify-center">
              <button
                type="button"
                onClick={toggleOpen}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-slate-100 dark:hover:bg-white/10 relative z-10"
                aria-label={t("common.openSidebar", "Abrir barra lateral")}
              >
                {/* Default Logo Icon */}
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-emerald-500/20 group-hover:scale-90 group-hover:opacity-0 transition-all duration-150 absolute">
                  ⚡
                </div>
                {/* Morphed PanelLeft icon on hover */}
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-150 absolute">
                  <PanelLeft className="w-5 h-5" />
                </div>
              </button>

              {/* Tooltip on right */}
              <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-black text-white dark:bg-slate-900 dark:text-white border border-white/10 rounded-xl text-xs font-semibold whitespace-nowrap shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-150 ease-out z-50">
                {t("common.openSidebar", "Abrir barra lateral")}
              </div>
            </div>
          )}
        </div>

        {/* 2. Nav Groups */}
        <div className={cn("flex-1 px-2.5 py-4 space-y-5", showExpanded ? "overflow-y-auto" : "overflow-visible")}>
          {/* Main Section */}
          <div className="space-y-1 overflow-visible">
            {showExpanded ? (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 animate-in fade-in duration-150">
                {t("nav.prospectingGroup", "Prospección")}
              </p>
            ) : (
              <div className="my-1.5 border-t border-slate-200/60 dark:border-white/5 w-6 mx-auto" />
            )}
            {renderNavLinks(MAIN_NAV_ITEMS, forceExpanded)}
          </div>

          {/* Tools Section */}
          <div className="space-y-1 overflow-visible">
            {showExpanded ? (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 animate-in fade-in duration-150">
                {t("nav.toolsGroup", "Herramientas")}
              </p>
            ) : (
              <div className="my-1.5 border-t border-slate-200/60 dark:border-white/5 w-6 mx-auto" />
            )}
            {renderNavLinks(TOOLS_NAV_ITEMS, forceExpanded)}
          </div>
        </div>

        {/* 3. Footer: User Status & Toggles */}
        <div className="p-3 border-t border-slate-200/70 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30 overflow-visible">
          {/* User Badge */}
          {showExpanded ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-2xs animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    J
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      Jose Admin
                    </p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Plan Pro · SoCal
                    </p>
                  </div>
                </div>
              </div>

              {/* Global Toggles */}
              <div className="flex items-center justify-between pt-1 px-1 animate-in fade-in duration-150">
                <ThemeToggle />
                <LanguageToggle />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2.5 overflow-visible">
              {/* Compact User Avatar */}
              <div className="relative group flex items-center justify-center">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs relative z-10">
                  J
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950" />
                </div>
                <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-black text-white dark:bg-slate-900 dark:text-white border border-white/10 rounded-xl text-xs font-semibold whitespace-nowrap shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-150 ease-out z-50">
                  Jose Admin (Plan Pro)
                </div>
              </div>

              {/* Compact Theme & Language Circular Toggles */}
              <ThemeToggle compact={true} />
              <LanguageToggle compact={true} />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar: Pushes main content canvas smoothly */}
      <aside
        className={cn(
          "hidden lg:block shrink-0 transition-[width] duration-200 ease-in-out select-none h-screen sticky top-0 z-30 bg-white dark:bg-slate-950 border-r border-slate-200/80 dark:border-white/10",
          isOpen ? "w-64 overflow-hidden" : "w-[68px] overflow-visible"
        )}
      >
        {getSidebarBody(false)}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onMobileClose}
          />
          <div className="relative z-10 w-64 bg-white dark:bg-slate-950 h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {getSidebarBody(true)}
          </div>
        </div>
      )}
    </>
  );
}
