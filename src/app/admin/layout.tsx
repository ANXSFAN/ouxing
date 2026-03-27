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

  return (
    <SessionProvider>
      <div className="min-h-screen bg-slate-50">
        <AdminSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
        <div
          className={cn(
            "transition-all duration-300",
            collapsed ? "ml-16" : "ml-60"
          )}
        >
          <AdminTopbar />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
