"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X, ClipboardList, Search } from "lucide-react";
import { getCartCount } from "@/lib/inquiry-cart";

const navLinks = [
  { href: "/products", label: "全部产品" },
  { href: "/products?category=panel", label: "面板灯" },
  { href: "/products?category=downlight", label: "筒灯" },
  { href: "/products?category=spotlight", label: "射灯" },
  { href: "/products?category=tube", label: "灯管" },
  { href: "/products?category=highbay", label: "工矿灯" },
  { href: "/about", label: "关于" },
  { href: "/inquiry", label: "支持" },
];

export function PublicNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [cartBouncing, setCartBouncing] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCartCount(getCartCount());
    const onChange = () => {
      const c = getCartCount();
      setCartCount((prev) => {
        if (c > prev) {
          setCartBouncing(true);
          setTimeout(() => setCartBouncing(false), 500);
        }
        return c;
      });
    };
    window.addEventListener("inquiry-cart-change", onChange);
    return () => window.removeEventListener("inquiry-cart-change", onChange);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    if (q) router.push(`/products?search=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setSearchValue("");
  };

  return (
    <header className="sticky top-0 z-50 bg-[rgba(255,255,255,0.72)] backdrop-blur-xl backdrop-saturate-150 border-b border-black/10">
      <nav className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8 h-11 flex items-center justify-between text-[14px] text-[#1d1d1f]">
        {/* Logo */}
        <Link
          href="/"
          className="shrink-0 font-semibold tracking-tight text-[15px] opacity-90 hover:opacity-100 transition-opacity"
        >
          欧星
        </Link>

        {/* Desktop nav links */}
        <div className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href.split("?")[0]) && link.href.split("?")[0] !== "/";
            return (
              <Link
                key={link.href + link.label}
                href={link.href}
                className={cn(
                  "text-[12px] tracking-wide transition-opacity",
                  isActive ? "opacity-100" : "opacity-80 hover:opacity-100",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSearchOpen((s) => !s)}
            className="p-2 opacity-80 hover:opacity-100 transition-opacity"
            aria-label="搜索"
          >
            <Search className="w-4 h-4" strokeWidth={1.75} />
          </button>
          <Link
            href="/inquiry"
            className="relative p-2 opacity-80 hover:opacity-100 transition-opacity"
            title="询价单"
          >
            <ClipboardList className="w-4 h-4" strokeWidth={1.75} />
            {cartCount > 0 && (
              <span
                className={cn(
                  "absolute top-0.5 right-0.5 min-w-[16px] h-[16px] bg-[#1d1d1f] text-white text-[10px] font-medium rounded-full flex items-center justify-center px-1 leading-none",
                  cartBouncing && "animate-cart-bounce",
                )}
              >
                {cartCount}
              </span>
            )}
          </Link>
          <button
            className="lg:hidden p-2 opacity-80 hover:opacity-100 transition-opacity"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="菜单"
          >
            {mobileOpen ? <X className="w-4 h-4" strokeWidth={1.75} /> : <Menu className="w-4 h-4" strokeWidth={1.75} />}
          </button>
        </div>
      </nav>

      {/* Search panel */}
      {searchOpen && (
        <div className="border-t border-black/10 bg-[rgba(255,255,255,0.95)] backdrop-blur-xl">
          <form
            onSubmit={submitSearch}
            className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-3"
          >
            <Search className="w-5 h-5 text-[#86868b] shrink-0" strokeWidth={1.75} />
            <input
              autoFocus
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="搜索 欧星"
              className="flex-1 bg-transparent border-0 outline-none text-lg text-[#1d1d1f] placeholder:text-[#86868b]"
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="text-sm text-[#1d1d1f] hover:underline underline-offset-4"
            >
              取消
            </button>
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-black/10 bg-white">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-3 text-base text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
