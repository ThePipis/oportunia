"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ChevronRight, Compass } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  onMobileMenuToggle?: () => void;
}

interface BreadcrumbItem {
  id: string;
  label: string;
  href?: string;
  icon?: string;
  isActive?: boolean;
}

export function DashboardHeader({ onMobileMenuToggle }: DashboardHeaderProps) {
  const { t } = useT();
  const pathname = usePathname() || "/";

  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    // 1. Lead Profile / Ficha del Negocio
    if (pathname.startsWith("/radar/")) {
      const businessId = pathname.replace("/radar/", "").split("/")[0];
      return [
        {
          id: "radar",
          label: "← Radar",
          href: "/radar",
          icon: "🎯",
        },
        {
          id: "profile",
          label: t("header.breadcrumbProfile", "Ficha del Negocio"),
          icon: "📄",
          isActive: true,
        },
        {
          id: "proposal",
          label: `${t("header.breadcrumbProposal", "Propuesta Comercial")} →`,
          href: `/proposals/${businessId}`,
          icon: "🧮",
        },
      ];
    }

    // 2. Proposal / Propuesta Comercial
    if (pathname.startsWith("/proposals")) {
      const businessId = pathname.replace("/proposals/", "").split("/")[0];
      return [
        {
          id: "radar",
          label: "← Radar",
          href: "/radar",
          icon: "🎯",
        },
        {
          id: "profile",
          label: `← ${t("header.breadcrumbProfile", "Ficha del Negocio")}`,
          href: businessId ? `/radar/${businessId}` : "/radar",
          icon: "📄",
        },
        {
          id: "proposal",
          label: t("header.breadcrumbProposal", "Propuesta Comercial"),
          icon: "🧮",
          isActive: true,
        },
      ];
    }

    // 3. Radar de Clientes
    if (pathname.startsWith("/radar")) {
      return [
        {
          id: "dashboard",
          label: t("header.breadcrumbDashboard", "Dashboard"),
          href: "/",
          icon: "🏠",
        },
        {
          id: "radar",
          label: t("header.breadcrumbRadar", "Radar de Clientes"),
          icon: "🎯",
          isActive: true,
        },
      ];
    }

    // 4. CRM Pipeline
    if (pathname.startsWith("/crm")) {
      return [
        {
          id: "dashboard",
          label: t("header.breadcrumbDashboard", "Dashboard"),
          href: "/",
          icon: "🏠",
        },
        {
          id: "crm",
          label: t("header.breadcrumbCRM", "Pipeline CRM"),
          icon: "📊",
          isActive: true,
        },
      ];
    }

    // 5. Listas de Clientes
    if (pathname.startsWith("/lists")) {
      return [
        {
          id: "dashboard",
          label: t("header.breadcrumbDashboard", "Dashboard"),
          href: "/",
          icon: "🏠",
        },
        {
          id: "lists",
          label: t("header.breadcrumbLists", "Listas de Clientes"),
          icon: "📋",
          isActive: true,
        },
      ];
    }

    // 6. Catálogo de Servicios
    if (pathname.startsWith("/services")) {
      return [
        {
          id: "dashboard",
          label: t("header.breadcrumbDashboard", "Dashboard"),
          href: "/",
          icon: "🏠",
        },
        {
          id: "services",
          label: t("header.breadcrumbServices", "Catálogo de Servicios"),
          icon: "💼",
          isActive: true,
        },
      ];
    }

    // 7. Tools & APIs
    if (pathname.startsWith("/tools")) {
      return [
        {
          id: "dashboard",
          label: t("header.breadcrumbDashboard", "Dashboard"),
          href: "/",
          icon: "🏠",
        },
        {
          id: "tools",
          label: t("header.breadcrumbTools", "Tools & APIs"),
          icon: "🔧",
          isActive: true,
        },
      ];
    }

    // 8. Social Radar / Social Listening
    if (pathname.startsWith("/social-radar")) {
      return [
        {
          id: "dashboard",
          label: t("header.breadcrumbDashboard", "Dashboard"),
          href: "/",
          icon: "🏠",
        },
        {
          id: "social-radar",
          label: t("header.breadcrumbSocialRadar", "Social Radar"),
          icon: "📡",
          isActive: true,
        },
      ];
    }

    // 9. Configuración
    if (pathname.startsWith("/settings")) {
      return [
        {
          id: "dashboard",
          label: t("header.breadcrumbDashboard", "Dashboard"),
          href: "/",
          icon: "🏠",
        },
        {
          id: "settings",
          label: t("header.breadcrumbSettings", "Configuración"),
          icon: "⚙️",
          isActive: true,
        },
      ];
    }

    // 10. Dashboard Root
    return [
      {
        id: "dashboard",
        label: t("header.breadcrumbDashboard", "Dashboard"),
        icon: "🏠",
        isActive: true,
      },
    ];
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <header className="sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-white/10 px-4 md:px-6 py-2 flex items-center justify-between gap-4">
      {/* Left: Mobile trigger & Breadcrumb Pill Bar */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10"
          aria-label={t("common.openSidebar", "Abrir menú")}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* New Main Breadcrumb Navigation Pill Bar */}
        <nav
          aria-label="Breadcrumb"
          className="inline-flex items-center gap-1 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-2xs backdrop-blur-xs max-w-full overflow-x-auto scrollbar-none"
        >
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={item.id}>
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0 mx-0.5" />
              )}
              {item.isActive ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-slate-950 border border-emerald-400/90 dark:border-emerald-500/40 shadow-xs whitespace-nowrap">
                  {item.icon && <span className="text-xs">{item.icon}</span>}
                  <span>{item.label}</span>
                  <span className="text-slate-400 dark:text-slate-600 text-[10px]">›</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{t("header.actualBadge", "ACTUAL")}</span>
                  </span>
                </div>
              ) : (
                <Link
                  href={item.href || "#"}
                  prefetch={true}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-white/80 dark:hover:bg-white/5 transition-all whitespace-nowrap"
                >
                  {item.icon && <span className="text-xs">{item.icon}</span>}
                  <span>{item.label}</span>
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Quick actions (Preserved) */}
      <div className="flex items-center gap-2.5 shrink-0">
        {pathname !== "/" && (
          <Link
            href="/"
            prefetch={true}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-slate-100 border border-slate-200 dark:border-white/10 transition-colors shadow-2xs"
          >
            <span>{t("common.backToDashboard", "Volver al Dashboard")}</span>
          </Link>
        )}

        {pathname !== "/radar" && (
          <Link
            href="/radar"
            prefetch={true}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/25 transition-all"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("common.newRadar", "Nuevo Radar")}</span>
          </Link>
        )}
      </div>
    </header>
  );
}
