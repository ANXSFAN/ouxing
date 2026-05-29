"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Search, Package, ChevronLeft, ChevronRight, Image as ImageIcon, X, SlidersHorizontal, ClipboardList, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { addToCart } from "@/lib/inquiry-cart";
import { toast } from "sonner";

type ContentJson = Record<string, { name?: string }>;
interface AttrDef { key: string; name: Record<string, string>; unit: string | null; isHighlight: boolean }
interface Facet {
  key: string; name: Record<string, string>; unit: string | null; type: string;
  values: { value: string; color: string | null }[];
}
interface Product {
  id: string; slug: string; modelNumber: string;
  content: ContentJson; specs: Record<string, string | string[]> | null;
  category: { id: string; content: ContentJson } | null;
  images: { url: string }[];
}
interface Category { id: string; slug: string; content: ContentJson; _count: { products: number } }

function getName(c: unknown) { const v = c as ContentJson | null; return v?.zh?.name || v?.en?.name || ""; }

export default function ProductsPage() {
  return <Suspense><Content /></Suspense>;
}

function Content() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attrs, setAttrs] = useState<AttrDef[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [facets, setFacets] = useState<Facet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const currentCategory = searchParams.get("category") || "";
  const currentSearch = searchParams.get("search") || "";

  const activeSpecFilters: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (key.startsWith("spec.")) activeSpecFilters[key] = value;
  });

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page), pageSize: "12",
      ...(currentSearch && { search: currentSearch }),
      ...(currentCategory && { category: currentCategory }),
    });
    Object.entries(activeSpecFilters).forEach(([k, v]) => params.set(k, v));

    fetch(`/api/products?${params}`)
      .then((r) => r.json())
      .then((d) => { setProducts(d.products || []); setTotal(d.total || 0); setTotalPages(d.totalPages || 1); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, currentSearch, currentCategory, searchParams.toString()]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setCategories(d); });
    fetch("/api/attributes").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setAttrs(d); }).catch(() => {});
  }, []);

  useEffect(() => {
    const fp = new URLSearchParams();
    if (currentCategory) fp.set("category", currentCategory);
    fetch(`/api/products/facets?${fp}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setFacets(d); })
      .catch(() => {});
  }, [currentCategory]);

  const highlightAttrs = attrs.filter((a) => a.isHighlight);

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("page"); setPage(1);
    router.push(`/products?${params.toString()}`);
  };

  const currentCatName = currentCategory
    ? getName(categories.find((c) => c.id === currentCategory)?.content)
    : "";

  const FilterContent = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#86868b] mb-4">分类</h3>
        <div className="space-y-1">
          <FilterRow
            label="全部产品"
            active={!currentCategory}
            count={total}
            onClick={() => updateParams("category", "")}
          />
          {categories.map((cat) => (
            <FilterRow
              key={cat.id}
              label={getName(cat.content)}
              active={currentCategory === cat.id}
              count={cat._count.products}
              onClick={() => updateParams("category", cat.id)}
            />
          ))}
        </div>
      </div>

      {facets.map((facet) => {
        const activeVal = activeSpecFilters[`spec.${facet.key}`] || "";
        const label = facet.name.zh || facet.name.en || facet.key;
        return (
          <div key={facet.key}>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#86868b] mb-4">
              {label}{facet.unit ? ` (${facet.unit})` : ""}
            </h3>
            <div className="space-y-1">
              {facet.values.map((opt) => {
                const isActive = activeVal === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => updateParams(`spec.${facet.key}`, isActive ? "" : opt.value)}
                    className="group w-full flex items-center gap-3 py-1.5 text-left text-[14px] text-[#1d1d1f]"
                  >
                    <span className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all",
                      isActive ? "bg-[#1d1d1f] border-[#1d1d1f]" : "border-[#d2d2d7] group-hover:border-[#86868b]",
                    )}>
                      {isActive && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                    </span>
                    {opt.color && (
                      <span className="w-3 h-3 rounded-full border border-[#d2d2d7]" style={{ backgroundColor: opt.color }} />
                    )}
                    <span className="flex-1">{opt.value}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-white min-h-screen text-[#1d1d1f]">
      {/* Hero / page header — Apple Store style */}
      <section className="text-center pt-16 md:pt-20 pb-10 md:pb-14">
        <div className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-base text-[#86868b] mb-3">
            {currentCatName ? "产品分类" : "全部产品"}
          </p>
          <h1 className="headline-xl text-5xl md:text-7xl mb-4">
            {currentCatName || "全部产品"}
          </h1>
          <p className="text-xl md:text-2xl text-[#86868b] tracking-tight">
            {total} 款产品 · 工厂直供
          </p>
        </div>
      </section>

      {/* Search — minimal Apple search bar */}
      <div className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" strokeWidth={2} />
          <Input
            placeholder="搜索产品型号、名称…"
            defaultValue={currentSearch}
            onKeyDown={(e) => { if (e.key === "Enter") updateParams("search", (e.target as HTMLInputElement).value); }}
            className="pl-11 h-11 bg-[#f5f5f7] border-0 rounded-full focus-visible:ring-2 focus-visible:ring-[#1d1d1f]/15"
          />
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-20">
              <FilterContent />
            </div>
          </aside>

          {/* Mobile filter drawer */}
          {filterOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setFilterOpen(false)}>
              <div
                className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-xl overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-white border-b border-[#d2d2d7] px-5 py-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold">筛选</h2>
                  <button onClick={() => setFilterOpen(false)} className="p-1.5 text-[#86868b]">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5">
                  <FilterContent />
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
              <button
                onClick={() => setFilterOpen(true)}
                className="lg:hidden inline-flex items-center gap-1.5 px-4 h-9 bg-[#f5f5f7] rounded-full text-sm text-[#1d1d1f]"
              >
                <SlidersHorizontal className="w-4 h-4" /> 筛选
                {Object.keys(activeSpecFilters).length > 0 && (
                  <span className="ml-1 min-w-[18px] h-[18px] bg-[#1d1d1f] text-white text-[10px] rounded-full flex items-center justify-center px-1">
                    {Object.keys(activeSpecFilters).length}
                  </span>
                )}
              </button>

              <div className="flex flex-wrap gap-2">
                {currentSearch && (
                  <Chip onRemove={() => updateParams("search", "")}>“{currentSearch}”</Chip>
                )}
                {Object.entries(activeSpecFilters).map(([key, val]) => {
                  const attrKey = key.slice(5);
                  const facet = facets.find((f) => f.key === attrKey);
                  const label = facet ? (facet.name.zh || facet.name.en || attrKey) : attrKey;
                  return (
                    <Chip key={key} onRemove={() => updateParams(key, "")}>{label}: {val}</Chip>
                  );
                })}
                {(currentSearch || Object.keys(activeSpecFilters).length > 0) && (
                  <button
                    onClick={() => { router.push(currentCategory ? `/products?category=${currentCategory}` : "/products"); setPage(1); }}
                    className="text-xs text-[#1d1d1f] hover:underline underline-offset-4 px-2 py-1"
                  >
                    清除全部
                  </button>
                )}
              </div>

              <div className="text-sm text-[#86868b] ml-auto">
                第 <span className="text-[#1d1d1f] font-medium">{page}</span> / {totalPages} 页
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <div className="aspect-square bg-[#f5f5f7] rounded-3xl animate-pulse" />
                    <div className="h-3 bg-[#f5f5f7] rounded mt-5 w-1/3 animate-pulse mx-auto" />
                    <div className="h-4 bg-[#f5f5f7] rounded mt-2 w-3/4 animate-pulse mx-auto" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState icon={Package} title="暂无产品" description="没有找到符合条件的产品" />
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12 md:gap-y-16">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      highlightAttrs={highlightAttrs}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterRow({ label, active, count, onClick }: { label: string; active: boolean; count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left py-1.5 text-[14px] flex items-center justify-between transition-colors",
        active ? "text-[#1d1d1f] font-semibold" : "text-[#1d1d1f] opacity-70 hover:opacity-100",
      )}
    >
      <span>{label}</span>
      <span className={cn("text-xs tabular-nums", active ? "text-[#86868b]" : "text-[#86868b]")}>
        {count}
      </span>
    </button>
  );
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      className="inline-flex items-center gap-1 px-3 py-1 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] text-xs rounded-full transition-colors"
    >
      {children} <X className="w-3 h-3" />
    </button>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  const pages: (number | "…")[] = [];
  const add = (n: number) => { if (!pages.includes(n) && n >= 1 && n <= totalPages) pages.push(n); };
  add(1);
  if (page - 1 > 2) pages.push("…");
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) add(i);
  if (page + 1 < totalPages - 1) pages.push("…");
  add(totalPages);

  return (
    <div className="flex items-center justify-center gap-1 mt-20 pt-10 border-t border-[#d2d2d7]/60">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 px-4 h-9 rounded-full text-sm text-[#1d1d1f] hover:bg-[#f5f5f7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> 上一页
      </button>
      <div className="flex items-center gap-1 mx-3">
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e-${i}`} className="px-2 text-[#86868b] text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={cn(
                "w-9 h-9 rounded-full text-sm font-medium tabular-nums transition-colors",
                p === page ? "bg-[#1d1d1f] text-white" : "text-[#1d1d1f] hover:bg-[#f5f5f7]",
              )}
            >
              {p}
            </button>
          ),
        )}
      </div>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-1 px-4 h-9 rounded-full text-sm text-[#1d1d1f] hover:bg-[#f5f5f7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        下一页 <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function ProductCard({
  product,
  highlightAttrs,
}: {
  product: Product;
  highlightAttrs: AttrDef[];
}) {
  const name = getName(product.content);
  const catName = getName(product.category?.content);
  const imageUrl = product.images[0]?.url;
  const specs = product.specs || {};

  const highlightSpecs = highlightAttrs
    .map((attr) => {
      const raw = specs[attr.key];
      if (!raw) return null;
      const val = Array.isArray(raw) ? raw.join(" / ") : raw;
      const label = attr.name.zh || attr.name.en || attr.key;
      const display = attr.unit ? `${val} ${attr.unit}` : val;
      return { key: attr.key, label, value: display };
    })
    .filter(Boolean) as { key: string; label: string; value: string }[];

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block text-center"
    >
      <div className="relative aspect-square bg-[#f5f5f7] rounded-3xl overflow-hidden mb-5">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-contain p-8 transition-transform duration-700 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#86868b]">
            <ImageIcon className="w-10 h-10" />
            <span className="text-[10px] uppercase mt-1">无图</span>
          </div>
        )}

        {/* Hover quick-add button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addToCart({ productId: product.id, variantId: null, name, modelNumber: product.modelNumber, imageUrl });
            toast.success("已加入询价单");
          }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 h-9 bg-[#1d1d1f] text-white text-xs font-medium rounded-full shadow-md opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
        >
          <ClipboardList className="w-3.5 h-3.5" /> 加入询价
        </button>
      </div>

      <p className="text-xs text-[#86868b] mb-1.5">{catName || product.modelNumber}</p>
      <h3 className="headline-lg text-lg md:text-xl text-[#1d1d1f] group-hover:opacity-70 transition-opacity line-clamp-2 px-2">
        {name}
      </h3>
      {highlightSpecs.length > 0 && (
        <p className="text-sm text-[#86868b] mt-1.5 px-2 line-clamp-1">
          {highlightSpecs.slice(0, 3).map((s) => s.value).join(" · ")}
        </p>
      )}
      <div className="mt-3">
        <span className="applink text-sm">了解更多</span>
      </div>
    </Link>
  );
}
