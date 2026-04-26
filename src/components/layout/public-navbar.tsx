"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X, Phone, Mail, ClipboardList, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCartCount } from "@/lib/inquiry-cart";

const navLinks = [
  { href: "/", label: "首页" },
  { href: "/products", label: "产品中心" },
  { href: "/about", label: "关于我们" },
  { href: "/inquiry", label: "在线询价" },
];

export function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const update = () => setCartCount(getCartCount());
    update();
    window.addEventListener("inquiry-cart-change", update);
    return () => window.removeEventListener("inquiry-cart-change", update);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      {/* Top info bar */}
      <div className="bg-neutral-900 text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between text-xs">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3 h-3" />
              +86 755-1234-5678
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <Mail className="w-3 h-3" />
              info@ouxing.com
            </span>
          </div>
          <Link
            href="/admin"
            className="flex items-center gap-1 text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            <Settings className="w-3 h-3" />
            <span className="hidden sm:inline">管理后台</span>
          </Link>
        </div>
      </div>

      {/* Main navigation */}
      <div
        className={cn(
          "border-b transition-all duration-200",
          scrolled
            ? "bg-white/95 backdrop-blur-md border-neutral-200 shadow-sm"
            : "bg-white border-neutral-100"
        )}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="shrink-0 text-lg sm:text-xl font-semibold tracking-tight text-neutral-900"
          >
            欧星照明
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "text-neutral-900 bg-neutral-100"
                      : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/inquiry"
              className="relative p-2 text-neutral-400 hover:text-neutral-700 transition-colors"
              title="询价单"
            >
              <ClipboardList className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-neutral-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {cartCount}
                </span>
              )}
            </Link>
            <Button
              asChild
              className="hidden sm:inline-flex bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-lg text-sm px-5 h-9"
            >
              <Link href="/inquiry">获取报价</Link>
            </Button>
            <button
              className="lg:hidden text-neutral-500 hover:text-neutral-800 p-2 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-neutral-100 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block px-3 py-2.5 text-sm rounded-lg",
                    isActive
                      ? "text-neutral-900 bg-neutral-100 font-medium"
                      : "text-neutral-500 hover:bg-neutral-50"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-2">
              <Button
                asChild
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-lg"
              >
                <Link href="/inquiry" onClick={() => setMobileOpen(false)}>
                  获取报价
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
