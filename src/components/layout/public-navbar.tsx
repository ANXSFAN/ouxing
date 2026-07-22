"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ClipboardList, Menu, Search, X } from "lucide-react";
import { getCartCount } from "@/lib/inquiry-cart";
import { cn } from "@/lib/utils";

const navLinks = [{ href: "/products", label: "产品中心" }, { href: "/about", label: "关于欧星" }];

export function PublicNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [cartBouncing, setCartBouncing] = useState(false);

  useEffect(() => {
    // localStorage 只在客户端可用，挂载后同步询价单数量。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCartCount(getCartCount());
    const onChange = () => {
      const count = getCartCount();
      setCartCount((previous) => {
        if (count > previous) { setCartBouncing(true); window.setTimeout(() => setCartBouncing(false), 500); }
        return count;
      });
    };
    window.addEventListener("inquiry-cart-change", onChange);
    return () => window.removeEventListener("inquiry-cart-change", onChange);
  }, []);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const query = searchValue.trim();
    if (query) router.push(`/products?search=${encodeURIComponent(query)}`);
    setSearchOpen(false);
    setSearchValue("");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
      <nav className="site-wrap flex h-[72px] items-center justify-between">
        <Link href="/" aria-label="FactorLED 首页" className="shrink-0"><Image src="/logo.jpg" alt="FactorLED" width={194} height={35} priority className="h-[30px] w-auto object-contain" /></Link>
        <div className="hidden items-center gap-9 lg:flex">{navLinks.map((link) => <Link key={link.href} href={link.href} className={cn("text-sm font-medium transition-colors hover:text-[#294457]", pathname.startsWith(link.href) ? "text-[#294457]" : "text-neutral-700")}>{link.label}</Link>)}</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSearchOpen((value) => !value)} className="flex h-10 w-10 items-center justify-center rounded-md text-neutral-700 hover:bg-neutral-100" aria-label="搜索产品"><Search className="h-[18px] w-[18px]" /></button>
          <Link href="/inquiry" className="relative hidden h-10 items-center gap-2 rounded-md bg-[#17212b] px-4 text-sm font-semibold text-white hover:bg-[#294457] sm:flex"><ClipboardList className="h-4 w-4" />询价单{cartCount > 0 && <span className={cn("flex min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] text-[#17212b]", cartBouncing && "animate-cart-bounce")}>{cartCount}</span>}</Link>
          <button className="flex h-10 w-10 items-center justify-center rounded-md text-neutral-800 hover:bg-neutral-100 lg:hidden" onClick={() => setMobileOpen((value) => !value)} aria-label="打开导航菜单">{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </nav>
      {searchOpen && <div className="border-t border-neutral-200 bg-white"><form onSubmit={submitSearch} className="site-wrap flex items-center gap-3 py-5"><Search className="h-5 w-5 shrink-0 text-neutral-400" /><input autoFocus value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="搜索产品名称或型号" className="h-10 flex-1 border-0 bg-transparent text-base outline-none placeholder:text-neutral-400" /><button type="button" onClick={() => setSearchOpen(false)} className="text-sm text-neutral-500 hover:text-neutral-900">取消</button></form></div>}
      {mobileOpen && <div className="border-t border-neutral-200 bg-white lg:hidden"><div className="site-wrap py-4">{[...navLinks, { href: "/inquiry", label: `询价单${cartCount ? `（${cartCount}）` : ""}` }].map((link) => <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-3 text-base font-medium text-neutral-800 hover:bg-neutral-100">{link.label}</Link>)}</div></div>}
    </header>
  );
}
