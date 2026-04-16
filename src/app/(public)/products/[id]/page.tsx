"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DOC_TYPE_LABELS } from "@/lib/constants";
import { addToCart } from "@/lib/inquiry-cart";
import { toast } from "sonner";
import {
  Download, FileText, Shield, Package, Loader2,
  MessageSquare, ChevronLeft, ChevronRight, Image as ImageIcon, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ContentJson = Record<string, { name?: string; description?: string }>;
interface AttrDef { key: string; name: Record<string, string>; unit: string | null; isHighlight: boolean }
interface VariantRow { id: string; sku: string; price: string | null; specs: Record<string, string>; isActive: boolean }
interface ProductDetail {
  id: string; slug: string; modelNumber: string;
  content: ContentJson; specs: Record<string, string | string[]> | null;
  category: { id: string; content: ContentJson } | null;
  images: { id: string; url: string; alt: string | null }[];
  documents: { id: string; name: string; filePath: string; fileSize: number; docType: string }[];
  certificates: { id: string; name: string; certType: string; filePath: string; fileSize: number }[];
  variants: VariantRow[];
}

function getName(c: unknown) { const v = c as ContentJson | null; return v?.zh?.name || v?.en?.name || ""; }
function getDesc(c: unknown) { const v = c as ContentJson | null; return v?.zh?.description || v?.en?.description || ""; }
function fmtSize(b: number) { return b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`; }

/** Format a spec value: arrays joined with " / " */
function fmtSpecVal(val: string | string[], unit?: string): string {
  const str = Array.isArray(val) ? val.join(" / ") : val;
  return unit ? `${str} ${unit}` : str;
}

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [attrs, setAttrs] = useState<AttrDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(0);
  // Variant dimension selections: { cct: "3000K", wattage: "18W" }
  const [selections, setSelections] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${params.id}`).then((r) => r.json()),
      fetch("/api/attributes").then((r) => r.json()).catch(() => []),
    ]).then(([p, a]) => {
      setProduct(p);
      if (Array.isArray(a)) setAttrs(a);
      setLoading(false);
    });
  }, [params.id]);

  // ── Variant logic ──

  const activeVariants = useMemo(
    () => (product?.variants || []).filter((v) => v.isActive),
    [product?.variants],
  );

  // Extract variant dimensions: keys that differ across variants
  const variantDimensions = useMemo(() => {
    if (activeVariants.length === 0) return [];
    const allKeys = new Set<string>();
    activeVariants.forEach((v) => Object.keys(v.specs || {}).forEach((k) => allKeys.add(k)));

    return Array.from(allKeys)
      .map((key) => {
        const values = [...new Set(activeVariants.map((v) => v.specs?.[key]).filter(Boolean))] as string[];
        return { key, values };
      })
      .filter((d) => d.values.length > 0);
  }, [activeVariants]);

  // Default selections to first variant's specs
  useEffect(() => {
    if (activeVariants.length > 0 && Object.keys(selections).length === 0) {
      const first = activeVariants[0];
      setSelections(first.specs || {});
    }
  }, [activeVariants, selections]);

  // Find matching variant from selections
  const currentVariant = useMemo(() => {
    if (activeVariants.length === 0 || variantDimensions.length === 0) return null;
    return activeVariants.find((v) =>
      variantDimensions.every((dim) => v.specs?.[dim.key] === selections[dim.key])
    ) || null;
  }, [activeVariants, variantDimensions, selections]);

  // ── Rendering ──

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>;
  if (!product) return <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3"><Package className="w-12 h-12 text-gray-200" /><p className="text-gray-400">产品不存在</p></div>;

  const name = getName(product.content);
  const desc = getDesc(product.content);
  const catName = getName(product.category?.content);
  const productSpecs = product.specs || {};
  const displaySku = currentVariant?.sku || product.modelNumber;

  // Variant dimension keys (to filter from specs display)
  const dimKeys = new Set(variantDimensions.map((d) => d.key));

  // Build display specs: variant-specific specs override product-level, skip dimension keys
  const displaySpecs = (() => {
    const merged: Record<string, string | string[]> = { ...productSpecs };
    // If variant selected, override with variant's specific values
    if (currentVariant) {
      for (const [k, v] of Object.entries(currentVariant.specs)) {
        merged[k] = v;
      }
    }
    return Object.entries(merged)
      .filter(([k, v]) => v && (typeof v === "string" ? v.trim() !== "" : v.length > 0))
      .filter(([k]) => !dimKeys.has(k)) // hide variant dimension keys (already shown in selector)
      .map(([key, val]) => {
        const def = attrs.find((a) => a.key === key);
        const label = def ? (def.name.zh || def.name.en || key) : key;
        const unit = def?.unit || "";
        return { key, label, value: fmtSpecVal(val, unit), isHighlight: def?.isHighlight ?? false };
      });
  })();

  const highlightSpecs = displaySpecs.filter((s) => s.isHighlight);

  const getAttrLabel = (key: string) => {
    const def = attrs.find((a) => a.key === key);
    return def ? (def.name.zh || def.name.en || key) : key;
  };

  // Variant label for cart
  const variantLabel = currentVariant
    ? Object.entries(currentVariant.specs).map(([k, v]) => `${getAttrLabel(k)}: ${v}`).join(", ")
    : "";

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="text-sm text-gray-400 flex items-center gap-1.5">
            <Link href="/" className="hover:text-blue-600">首页</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-blue-600">产品中心</Link>
            {catName && <><span>/</span><span>{catName}</span></>}
            <span>/</span>
            <span className="text-gray-600">{name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* ── Left: Image Gallery ── */}
          <div>
            <div className="aspect-square bg-gray-50 border border-gray-100 rounded-xl relative overflow-hidden">
              {product.images[selectedImg] ? (
                <Image
                  src={product.images[selectedImg].url}
                  alt={name}
                  fill
                  className="object-contain p-6 transition-opacity duration-300"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                  <ImageIcon className="w-16 h-16" />
                  <span className="text-xs uppercase font-mono mt-2">NO IMAGE</span>
                </div>
              )}
              {product.images.length > 1 && (
                <>
                  <button onClick={() => setSelectedImg(Math.max(0, selectedImg - 1))} disabled={selectedImg === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 shadow flex items-center justify-center disabled:opacity-20 hover:bg-white transition-all">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setSelectedImg(Math.min(product.images.length - 1, selectedImg + 1))} disabled={selectedImg === product.images.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 shadow flex items-center justify-center disabled:opacity-20 hover:bg-white transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 mt-3">
                {product.images.map((img, i) => (
                  <button key={img.id} onClick={() => setSelectedImg(i)}
                    className={cn("w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                      i === selectedImg ? "border-blue-600" : "border-gray-100 hover:border-gray-300")}>
                    <Image src={img.url} alt="" width={64} height={64} className="w-full h-full object-cover" unoptimized />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Product Info ── */}
          <div>
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">{catName}</span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1 mb-1">{name}</h1>
            <p className="text-sm text-gray-400 font-mono mb-6">SKU {displaySku}</p>

            {desc && <p className="text-sm text-gray-500 leading-relaxed mb-6 whitespace-pre-line">{desc}</p>}

            {/* Variant selector — grouped by dimension */}
            {variantDimensions.length > 0 && (
              <div className="mb-6 space-y-4">
                {variantDimensions.map((dim) => (
                  <div key={dim.key}>
                    <p className="text-xs font-semibold text-gray-500 mb-2">
                      {getAttrLabel(dim.key)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {dim.values.map((val) => {
                        const active = selections[dim.key] === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setSelections((prev) => ({ ...prev, [dim.key]: val }))}
                            className={cn(
                              "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                              active
                                ? "border-blue-600 bg-blue-50 text-blue-700"
                                : "border-gray-200 hover:border-gray-300 text-gray-600 bg-white"
                            )}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick highlight specs */}
            {highlightSpecs.length > 0 && (
              <div className="grid grid-cols-2 gap-px bg-gray-200 rounded-xl overflow-hidden mb-6">
                {highlightSpecs.map((spec, i) => (
                  <div key={spec.key} className={cn("bg-white px-4 py-3 flex flex-col",
                    highlightSpecs.length % 2 === 1 && i === highlightSpecs.length - 1 ? "col-span-2" : ""
                  )}>
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider leading-none mb-1">
                      {spec.label}
                    </span>
                    <span className="text-sm font-bold text-gray-900">{spec.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Certificates */}
            {product.certificates.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mb-6">
                <Shield className="w-4 h-4 text-green-600" />
                {product.certificates.map((c) => (
                  <span key={c.id} className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded font-medium">{c.certType}</span>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="flex gap-3">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-6 rounded-lg font-semibold"
                onClick={() => {
                  addToCart({
                    productId: product.id,
                    name: variantLabel ? `${name}（${variantLabel}）` : name,
                    modelNumber: displaySku,
                    imageUrl: product.images[0]?.url,
                  });
                  toast.success("已加入询价单");
                }}
              >
                <ClipboardList className="w-4 h-4 mr-2" /> 加入询价单
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-6 rounded-lg">
                <Link href="/inquiry">
                  <MessageSquare className="w-4 h-4 mr-2" /> 去询价
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* ── Tabs: Specs / Description / Downloads ── */}
        <div className="mt-12">
          <Tabs defaultValue="specs">
            <TabsList className="bg-gray-100 rounded-lg p-1">
              <TabsTrigger value="specs" className="rounded-md">技术参数</TabsTrigger>
              {desc && <TabsTrigger value="desc" className="rounded-md">产品描述</TabsTrigger>}
              {(product.documents.length > 0 || product.certificates.length > 0) && (
                <TabsTrigger value="downloads" className="rounded-md">资料下载</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="specs" className="mt-6">
              {displaySpecs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200 rounded-xl overflow-hidden">
                  {displaySpecs.map((spec) => (
                    <div key={spec.key} className="bg-white px-5 py-3.5 flex justify-between items-center">
                      <span className="text-sm text-gray-500">{spec.label}</span>
                      <span className="text-sm font-semibold text-gray-900">{spec.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-8 text-center">暂无技术参数</p>
              )}
            </TabsContent>

            {desc && (
              <TabsContent value="desc" className="mt-6">
                <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-line">{desc}</div>
              </TabsContent>
            )}

            {(product.documents.length > 0 || product.certificates.length > 0) && (
              <TabsContent value="downloads" className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {product.documents.map((doc) => (
                    <a key={doc.id} href={doc.filePath} download
                      className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all group">
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">{doc.name}</p>
                        <p className="text-xs text-gray-400">{DOC_TYPE_LABELS[doc.docType]} · {fmtSize(doc.fileSize)}</p>
                      </div>
                      <Download className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors shrink-0" />
                    </a>
                  ))}
                  {product.certificates.map((cert) => (
                    <a key={cert.id} href={cert.filePath} download
                      className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all group">
                      <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-green-600 transition-colors">{cert.name}</p>
                        <p className="text-xs text-gray-400">{cert.certType} · {fmtSize(cert.fileSize)}</p>
                      </div>
                      <Download className="w-4 h-4 text-gray-300 group-hover:text-green-600 transition-colors shrink-0" />
                    </a>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
