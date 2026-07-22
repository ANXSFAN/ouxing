"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <SessionProvider>
      <div className="min-h-screen bg-slate-50">
        <AdminSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "transition-all duration-300",
            collapsed ? "md:ml-16" : "md:ml-60"
          )}
        >
          <AdminTopbar onMenuClick={() => setMobileOpen(true)} />
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
