"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tags,
  MessageSquare,
  FileText,
  PackageCheck,
  ChevronLeft,
  PanelsTopLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "仪表盘", icon: LayoutDashboard },
  { href: "/admin/products", label: "产品管理", icon: Package },
  { href: "/admin/categories", label: "分类管理", icon: FolderTree },
  { href: "/admin/attributes", label: "属性管理", icon: Tags },
  { href: "/admin/inquiries", label: "询价管理", icon: MessageSquare },
  { href: "/admin/quotes", label: "报价管理", icon: FileText },
  { href: "/admin/packing-lists", label: "箱单管理", icon: PackageCheck },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function AdminSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
    {mobileOpen && (
      <button
        type="button"
        aria-label="关闭导航"
        className="fixed inset-0 z-40 bg-black/40 md:hidden"
        onClick={onMobileClose}
      />
    )}
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 flex h-screen w-60 flex-col border-r border-slate-200 bg-white transition-transform duration-200 md:z-40 md:translate-x-0 md:transition-[width] md:duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        collapsed ? "md:w-16" : "md:w-60"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-200">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#eaf0f3] rounded-md flex items-center justify-center flex-shrink-0">
            <PanelsTopLeft className="w-5 h-5 text-[#294457]" />
          </div>
          {!collapsed && (
            <span className="font-bold text-base text-slate-900">FactorLED 后台</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#eaf0f3] text-[#294457]"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse button */}
      <div className="hidden p-3 border-t border-slate-200 md:block">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full text-slate-500 hover:text-slate-950 hover:bg-slate-100"
        >
          <ChevronLeft
            className={cn(
              "w-4 h-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>
    </aside>
    </>
  );
}
