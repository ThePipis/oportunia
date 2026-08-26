"use client";

import * as React from "react";
import { AppSidebar } from "./app-sidebar";
import { DashboardHeader } from "./dashboard-header";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground antialiased selection:bg-emerald-500/20 selection:text-foreground">
      {/* 1. Left Navigation Sidebar */}
      <AppSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <DashboardHeader onMobileMenuToggle={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto min-h-0 bg-slate-50/50 dark:bg-slate-950/40">
          {children}
        </main>
      </div>
    </div>
  );
}
