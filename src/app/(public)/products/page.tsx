"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Search, Package, ChevronLeft, ChevronRight, Grid3X3, List, Eye,
  Image as ImageIcon, SlidersHorizontal, X, ClipboardList,
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const currentCategory = searchParams.get("category") || "";
  const currentSearch = searchParams.get("search") || "";

  // Collect active spec filters from URL
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
    // Add spec filters to API call
    Object.entries(activeSpecFilters).forEach(([k, v]) => params.set(k, v));

    fetch(`/api/products?${params}`)
      .then((r) => r.json())
      .then((d) => { setProducts(d.products || []); setTotal(d.total || 0); setTotalPages(d.totalPages || 1); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, currentSearch, currentCategory, searchParams.toString()]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Load categories, attributes, facets
  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setCategories(d); });
    fetch("/api/attributes").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setAttrs(d); }).catch(() => {});
  }, []);

  // Load facets (re-fetch when category changes)
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

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="text-sm text-gray-400 mb-2 flex items-center gap-1.5">
            <Link href="/" className="hover:text-blue-600">首页</Link>
            <span>/</span>
            <span className={currentCategory ? "text-gray-400" : "text-gray-700"}>产品中心</span>
            {currentCatName && <><span>/</span><span className="text-gray-700">{currentCatName}</span></>}
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{currentCatName || "产品中心"}</h1>
            <span className="text-sm text-gray-400">{total} 个产品</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Sidebar Filter ── */}
          <aside className="lg:w-60 shrink-0 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索产品..."
                defaultValue={currentSearch}
                onKeyDown={(e) => { if (e.key === "Enter") updateParams("search", (e.target as HTMLInputElement).value); }}
                className="pl-9 bg-gray-50 border-gray-200 focus:border-blue-300 h-10"
              />
            </div>

            {/* Active filters */}
            {(currentSearch || currentCategory || Object.keys(activeSpecFilters).length > 0) && (
              <div className="flex flex-wrap gap-2">
                {currentSearch && (
                  <button onClick={() => updateParams("search", "")} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg">
                    &ldquo;{currentSearch}&rdquo; <X className="w-3 h-3" />
                  </button>
                )}
                {currentCatName && (
                  <button onClick={() => updateParams("category", "")} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg">
                    {currentCatName} <X className="w-3 h-3" />
                  </button>
                )}
                {Object.entries(activeSpecFilters).map(([key, val]) => {
                  const attrKey = key.slice(5);
                  const facet = facets.find((f) => f.key === attrKey);
                  const label = facet ? (facet.name.zh || facet.name.en || attrKey) : attrKey;
                  return (
                    <button key={key} onClick={() => updateParams(key, "")} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg">
                      {label}: {val} <X className="w-3 h-3" />
                    </button>
                  );
                })}
                {(Object.keys(activeSpecFilters).length > 0 || currentSearch || currentCategory) && (
                  <button
                    onClick={() => {
                      router.push("/products");
                      setPage(1);
                    }}
                    className="text-xs text-gray-400 hover:text-red-500 underline underline-offset-2"
                  >
                    清除全部
                  </button>
                )}
              </div>
            )}

            {/* Categories filter */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" /> 产品分类
              </h3>
              <div className="space-y-0.5">
                <button
                  onClick={() => updateParams("category", "")}
                  className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    !currentCategory ? "text-blue-600 bg-blue-50 font-medium" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  全部产品
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateParams("category", cat.id)}
                    className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between",
                      currentCategory === cat.id ? "text-blue-600 bg-blue-50 font-medium" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    {getName(cat.content)}
                    <span className="text-gray-300 text-xs tabular-nums">{cat._count.products}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Attribute facet filters */}
            {facets.map((facet) => {
              const activeVal = activeSpecFilters[`spec.${facet.key}`] || "";
              const label = facet.name.zh || facet.name.en || facet.key;
              return (
                <div key={facet.key}>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                    {label}{facet.unit ? ` (${facet.unit})` : ""}
                  </h3>
                  <div className="space-y-0.5">
                    {facet.values.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateParams(`spec.${facet.key}`, activeVal === opt.value ? "" : opt.value)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2",
                          activeVal === opt.value
                            ? "text-blue-600 bg-blue-50 font-medium"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                        )}
                      >
                        {opt.color && (
                          <span className="w-3 h-3 rounded-full border border-gray-200 shrink-0" style={{ backgroundColor: opt.color }} />
                        )}
                        {opt.value}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </aside>

          {/* ── Product Grid ── */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-5">
              <div />
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                <button onClick={() => setViewMode("grid")} className={cn("p-1.5 rounded-md transition-colors", viewMode === "grid" ? "bg-white shadow-sm text-gray-900" : "text-gray-400")}>
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode("list")} className={cn("p-1.5 rounded-md transition-colors", viewMode === "list" ? "bg-white shadow-sm text-gray-900" : "text-gray-400")}>
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className={cn("grid gap-5", viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className={viewMode === "list" ? "flex" : ""}>
                      <div className={cn("bg-gray-100 animate-pulse", viewMode === "list" ? "w-1/3 h-48" : "h-56")} />
                      <div className="p-5 flex-1 space-y-3">
                        <div className="h-3 bg-gray-100 rounded w-20 animate-pulse" />
                        <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState icon={Package} title="暂无产品" description="没有找到符合条件的产品" />
            ) : (
              <>
                <div className={cn("grid gap-5",
                  viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
                )}>
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      viewMode={viewMode}
                      highlightAttrs={highlightAttrs}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-12 pt-6 border-t border-gray-100">
                    <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-400 tabular-nums">{page} / {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Product Card (照搬 my-led-erp 结构) ── */
function ProductCard({
  product,
  viewMode,
  highlightAttrs,
}: {
  product: Product;
  viewMode: "grid" | "list";
  highlightAttrs: AttrDef[];
}) {
  const name = getName(product.content);
  const catName = getName(product.category?.content);
  const imageUrl = product.images[0]?.url;
  const specs = product.specs || {};

  // Build highlight specs from attribute definitions
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
      className={cn(
        "group bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 flex",
        viewMode === "list" ? "flex-row min-h-[14rem]" : "flex-col"
      )}
    >
      {/* Image */}
      <div className={cn(
        "relative bg-gray-50 flex items-center justify-center overflow-hidden",
        viewMode === "list" ? "w-1/3" : "h-56"
      )}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
        ) : (
          <div className="flex flex-col items-center text-gray-300">
            <ImageIcon className="w-8 h-8" />
            <span className="text-[10px] uppercase font-mono mt-1">NO IMAGE</span>
          </div>
        )}

        {/* Quick actions (slide up on hover, like my-led-erp) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 translate-y-12 group-hover:translate-y-0 transition-transform duration-300 z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart({ productId: product.id, name, modelNumber: product.modelNumber, imageUrl: imageUrl });
              toast.success("已加入询价单");
            }}
            className="p-2.5 bg-white rounded-full shadow-lg text-gray-400 hover:text-blue-600 transition-colors"
            title="加入询价单"
          >
            <ClipboardList className="w-4 h-4" />
          </button>
          <span className="p-2.5 bg-white rounded-full shadow-lg text-gray-400 hover:text-blue-600 transition-colors">
            <Eye className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col min-w-0">
        <span
          className="text-[11px] font-medium text-gray-400 uppercase tracking-widest block truncate"
          title={catName || product.modelNumber}
        >
          {catName || product.modelNumber}
        </span>

        <h3 className="text-base font-medium text-gray-900 leading-tight mt-1 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
          {name}
        </h3>

        {/* Highlight specs grid (my-led-erp style) */}
        {highlightSpecs.length > 0 && (
          <div className="grid grid-cols-2 gap-px bg-gray-200 rounded-lg overflow-hidden mt-auto">
            {highlightSpecs.slice(0, 4).map((spec, i) => (
              <div
                key={spec.key}
                className={cn(
                  "bg-white px-3 py-2 flex flex-col",
                  highlightSpecs.length % 2 === 1 && i === highlightSpecs.length - 1 ? "col-span-2" : ""
                )}
              >
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider leading-none mb-1">
                  {spec.label}
                </span>
                <span className="text-sm font-bold text-gray-900 leading-tight truncate">
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
