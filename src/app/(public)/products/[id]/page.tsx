"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DOC_TYPE_LABELS, SHIPPING_SPEC_KEYS } from "@/lib/constants";
import { addToCart } from "@/lib/inquiry-cart";
import { toast } from "sonner";
import {
  Download, FileText, Shield, Package, Loader2,
  ChevronLeft, ChevronRight, Image as ImageIcon,
  ClipboardList, Truck, ShieldCheck, RotateCw, Plus, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ContentJson = Record<string, { name?: string; description?: string }>;
interface AttrDef { key: string; name: Record<string, string>; unit: string | null; isHighlight: boolean }
interface ProductImg { id: string; url: string; alt: string | null }
interface VariantRow { id: string; sku: string; price: string | null; specs: Record<string, string>; isActive: boolean; images: ProductImg[] }
interface ProductDetail {
  id: string; slug: string; modelNumber: string;
  content: ContentJson; specs: Record<string, string | string[]> | null;
  category: { id: string; content: ContentJson } | null;
  images: ProductImg[];
  documents: { id: string; name: string; filePath: string; fileSize: number; docType: string }[];
  certificates: { id: string; name: string; certType: string; filePath: string; fileSize: number }[];
  variants: VariantRow[];
}

function getName(c: unknown) { const v = c as ContentJson | null; return v?.zh?.name || v?.en?.name || ""; }
function getDesc(c: unknown) { const v = c as ContentJson | null; return v?.zh?.description || v?.en?.description || ""; }
function fmtSize(b: number) { return b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`; }

const SHIPPING_KEYS = new Set<string>(SHIPPING_SPEC_KEYS);

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
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);

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

  const activeVariants = useMemo(
    () => (product?.variants || []).filter((v) => v.isActive),
    [product?.variants],
  );

  const variantDimensions = useMemo(() => {
    if (activeVariants.length === 0) return [];
    const allKeys = new Set<string>();
    activeVariants.forEach((v) =>
      Object.keys(v.specs || {}).forEach((k) => { if (!SHIPPING_KEYS.has(k)) allKeys.add(k); }),
    );
    return Array.from(allKeys)
      .map((key) => {
        const values = [...new Set(activeVariants.map((v) => v.specs?.[key]).filter(Boolean))] as string[];
        return { key, values };
      })
      .filter((d) => d.values.length > 0);
  }, [activeVariants]);

  useEffect(() => {
    if (activeVariants.length > 0 && Object.keys(selections).length === 0) {
      const first = activeVariants[0];
      setSelections(first.specs || {});
    }
  }, [activeVariants, selections]);

  const currentVariant = useMemo(() => {
    if (activeVariants.length === 0 || variantDimensions.length === 0) return null;
    return activeVariants.find((v) =>
      variantDimensions.every((dim) => v.specs?.[dim.key] === selections[dim.key]),
    ) || null;
  }, [activeVariants, variantDimensions, selections]);

  const displayImages: ProductImg[] = useMemo(() => {
    if (currentVariant && currentVariant.images.length > 0) return currentVariant.images;
    return product?.images || [];
  }, [currentVariant, product?.images]);

  useEffect(() => { setSelectedImg(0); }, [currentVariant?.id]);

  const pickVariant = (dimKey: string, val: string): VariantRow | null => {
    const candidates = activeVariants.filter((v) => v.specs?.[dimKey] === val);
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];
    const scored = candidates.map((v) => ({
      v,
      score: Object.entries(v.specs || {}).filter(([k, vv]) => selections[k] === vv).length,
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored[0].v;
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-6 h-6 animate-spin text-[#86868b]" />
    </div>
  );
  if (!product) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Package className="w-12 h-12 text-[#d2d2d7]" />
      <p className="text-[#86868b]">产品不存在</p>
    </div>
  );

  const name = getName(product.content);
  const desc = getDesc(product.content);
  const catName = getName(product.category?.content);
  const productSpecs = product.specs || {};
  const displaySku = currentVariant?.sku || product.modelNumber;

  const dimKeys = new Set(variantDimensions.map((d) => d.key));

  const displaySpecs = (() => {
    const merged: Record<string, string | string[]> = { ...productSpecs };
    if (currentVariant) {
      for (const [k, v] of Object.entries(currentVariant.specs)) merged[k] = v;
    }
    return Object.entries(merged)
      .filter(([, v]) => v && (typeof v === "string" ? v.trim() !== "" : v.length > 0))
      .filter(([k]) => !dimKeys.has(k))
      .filter(([k]) => !SHIPPING_KEYS.has(k))
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

  const variantLabel = currentVariant
    ? Object.entries(currentVariant.specs)
        .filter(([k]) => !SHIPPING_KEYS.has(k))
        .map(([k, v]) => `${getAttrLabel(k)}: ${v}`)
        .join(", ")
    : "";

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) {
      addToCart({
        productId: product.id,
        variantId: currentVariant?.id ?? null,
        name: variantLabel ? `${name}（${variantLabel}）` : name,
        modelNumber: displaySku,
        imageUrl: displayImages[0]?.url,
      });
    }
    toast.success(`已加入询价单 (${qty} 件)`);
  };

  return (
    <div className="bg-white min-h-screen text-[#1d1d1f]">
      {/* Apple-style breadcrumb — thin, no bg band */}
      <div className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-2">
        <div className="text-[12px] text-[#86868b] flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-[#1d1d1f] transition-colors">首页</Link>
          <span className="text-[#d2d2d7]">›</span>
          <Link href="/products" className="hover:text-[#1d1d1f] transition-colors">全部产品</Link>
          {catName && <>
            <span className="text-[#d2d2d7]">›</span>
            <Link href={`/products?category=${product.category?.id}`} className="hover:text-[#1d1d1f] transition-colors">{catName}</Link>
          </>}
          <span className="text-[#d2d2d7]">›</span>
          <span className="text-[#1d1d1f] font-medium line-clamp-1">{name}</span>
        </div>
      </div>

      <div className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* ── Image Gallery ── */}
          <div className="lg:col-span-7">
            <div className="aspect-square bg-[#e8e8ed] rounded-3xl relative overflow-hidden group">
              {displayImages[selectedImg] ? (
                <Image
                  key={displayImages[selectedImg].id}
                  src={displayImages[selectedImg].url}
                  alt={name}
                  fill
                  className="object-contain p-10 transition-transform duration-500 group-hover:scale-[1.03]"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#d2d2d7]">
                  <ImageIcon className="w-16 h-16" />
                  <span className="text-xs uppercase mt-2 tracking-wider">NO IMAGE</span>
                </div>
              )}
              {displayImages.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImg(Math.max(0, selectedImg - 1))}
                    disabled={selectedImg === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center disabled:opacity-30 hover:bg-white transition-all shadow-sm"
                    aria-label="上一张"
                  >
                    <ChevronLeft className="w-5 h-5 text-[#1d1d1f]" strokeWidth={1.75} />
                  </button>
                  <button
                    onClick={() => setSelectedImg(Math.min(displayImages.length - 1, selectedImg + 1))}
                    disabled={selectedImg === displayImages.length - 1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center disabled:opacity-30 hover:bg-white transition-all shadow-sm"
                    aria-label="下一张"
                  >
                    <ChevronRight className="w-5 h-5 text-[#1d1d1f]" strokeWidth={1.75} />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/85 backdrop-blur-md rounded-full px-3 py-1 text-[11px] text-[#1d1d1f] tabular-nums font-medium">
                    {selectedImg + 1} / {displayImages.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {displayImages.length > 1 && (
              <div className="flex gap-2.5 mt-4 overflow-x-auto pb-2">
                {displayImages.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImg(i)}
                    className={cn(
                      "w-20 h-20 rounded-2xl overflow-hidden transition-all shrink-0 relative bg-[#e8e8ed]",
                      i === selectedImg
                        ? "ring-2 ring-[#1d1d1f] ring-offset-2 ring-offset-white"
                        : "opacity-60 hover:opacity-100",
                    )}
                  >
                    <Image src={img.url} alt="" fill className="object-contain p-2" unoptimized />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product Info ── */}
          <div className="lg:col-span-5">
            {catName && (
              <p className="text-[13px] text-[#86868b] mb-2 font-medium">{catName}</p>
            )}
            <h1 className="headline-lg text-3xl md:text-4xl text-[#1d1d1f] leading-tight">{name}</h1>
            <p className="text-[13px] text-[#86868b] mt-2 mb-6 tabular-nums">SKU · {displaySku}</p>

            {/* Certificates row — restrained outline pills */}
            {product.certificates.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mb-6">
                {product.certificates.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1d1d1f] border border-[#d2d2d7] px-2.5 py-1 rounded-full"
                  >
                    <Shield className="w-3 h-3" strokeWidth={1.75} /> {c.certType}
                  </span>
                ))}
              </div>
            )}

            {desc && (
              <p className="text-[15px] text-[#424245] leading-relaxed mb-7 whitespace-pre-line">{desc}</p>
            )}

            {/* Variant selector */}
            {variantDimensions.length > 0 && (
              <div className="space-y-5 pb-7 mb-7 border-b border-black/10">
                {variantDimensions.map((dim) => (
                  <div key={dim.key}>
                    <p className="text-[13px] font-semibold text-[#1d1d1f] mb-3">
                      {getAttrLabel(dim.key)}
                      <span className="text-[#86868b] font-normal ml-2">
                        {selections[dim.key]}
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {dim.values.map((val) => {
                        const active = selections[dim.key] === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => {
                              const target = pickVariant(dim.key, val);
                              if (target) setSelections({ ...(target.specs || {}) });
                            }}
                            className={cn(
                              "inline-flex items-center px-4 py-2 rounded-full border text-[13px] font-medium transition-all",
                              active
                                ? "border-[#1d1d1f] bg-[#1d1d1f] text-white"
                                : "border-[#d2d2d7] hover:border-[#1d1d1f] text-[#1d1d1f] bg-white",
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

            {/* Highlight specs */}
            {highlightSpecs.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-7">
                {highlightSpecs.slice(0, 4).map((spec) => (
                  <div
                    key={spec.key}
                    className="bg-[#f5f5f7] rounded-2xl px-4 py-3"
                  >
                    <p className="text-[11px] text-[#86868b] mb-1">
                      {spec.label}
                    </p>
                    <p className="text-[15px] font-semibold text-[#1d1d1f] tabular-nums">{spec.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity + CTA */}
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <p className="text-[13px] font-medium text-[#1d1d1f] w-10">数量</p>
                <div className="inline-flex items-center border border-[#d2d2d7] rounded-full h-12 px-1">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
                    aria-label="减少"
                  >
                    <Minus className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 h-10 text-center text-[14px] font-semibold tabular-nums bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
                    aria-label="增加"
                  >
                    <Plus className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className="appbtn w-full h-12 text-[15px]"
              >
                <ClipboardList className="w-4 h-4" strokeWidth={1.75} /> 加入询价单
              </button>
              <div className="text-center pt-1">
                <Link href="/inquiry" className="applink">直接询价</Link>
              </div>
            </div>

            {/* Trust badges — minimal apple-style */}
            <div className="mt-8 pt-7 border-t border-black/10 grid grid-cols-3 gap-3">
              {[
                { icon: Truck, title: "全球发货", desc: "50+ 国家" },
                { icon: ShieldCheck, title: "品质保障", desc: "国际认证" },
                { icon: RotateCw, title: "5 年质保", desc: "长寿命" },
              ].map((b) => (
                <div key={b.title} className="text-center">
                  <b.icon className="w-5 h-5 text-[#1d1d1f] mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-[12px] font-medium text-[#1d1d1f]">{b.title}</p>
                  <p className="text-[11px] text-[#86868b] mt-0.5">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="mt-20">
          <Tabs defaultValue="specs">
            <TabsList className="bg-transparent gap-0 p-0 h-auto border-b border-black/10 rounded-none w-full justify-start">
              <TabsTrigger
                value="specs"
                className="rounded-none border-0 px-5 mr-1 pb-4 pt-2 text-[14px] font-medium data-[state=active]:border-b-2 data-[state=active]:border-[#1d1d1f] data-[state=active]:shadow-none data-[state=active]:bg-transparent text-[#86868b] data-[state=active]:text-[#1d1d1f] transition-colors"
              >
                技术参数
              </TabsTrigger>
              {desc && (
                <TabsTrigger
                  value="desc"
                  className="rounded-none border-0 px-5 mr-1 pb-4 pt-2 text-[14px] font-medium data-[state=active]:border-b-2 data-[state=active]:border-[#1d1d1f] data-[state=active]:shadow-none data-[state=active]:bg-transparent text-[#86868b] data-[state=active]:text-[#1d1d1f] transition-colors"
                >
                  产品描述
                </TabsTrigger>
              )}
              <TabsTrigger
                value="downloads"
                className="rounded-none border-0 px-5 mr-1 pb-4 pt-2 text-[14px] font-medium data-[state=active]:border-b-2 data-[state=active]:border-[#1d1d1f] data-[state=active]:shadow-none data-[state=active]:bg-transparent text-[#86868b] data-[state=active]:text-[#1d1d1f] transition-colors"
              >
                资料下载
              </TabsTrigger>
            </TabsList>

            <TabsContent value="specs" className="mt-8">
              {displaySpecs.length > 0 ? (
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 max-w-3xl">
                  {displaySpecs.map((spec) => (
                    <div
                      key={spec.key}
                      className="flex items-baseline justify-between py-3.5 border-b border-black/10"
                    >
                      <dt className="text-[13px] text-[#86868b]">{spec.label}</dt>
                      <dd className="text-[14px] font-medium text-[#1d1d1f] tabular-nums text-right ml-4">
                        {spec.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-[13px] text-[#86868b] py-8 text-center">暂无技术参数</p>
              )}
            </TabsContent>

            {desc && (
              <TabsContent value="desc" className="mt-8">
                <div className="max-w-3xl text-[15px] text-[#424245] leading-relaxed whitespace-pre-line">
                  {desc}
                </div>
              </TabsContent>
            )}

            <TabsContent value="downloads" className="mt-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <DownloadCard
                  href={`/api/products/${product.id}/datasheet?lang=zh`}
                  icon={FileText}
                  title="产品规格书"
                  meta="PDF · 中文"
                />
                <DownloadCard
                  href={`/api/products/${product.id}/datasheet?lang=en`}
                  icon={FileText}
                  title="Product Datasheet"
                  meta="PDF · English"
                />
                {product.documents.map((doc) => (
                  <DownloadCard
                    key={doc.id}
                    href={doc.filePath}
                    download
                    icon={FileText}
                    title={doc.name}
                    meta={`${DOC_TYPE_LABELS[doc.docType]} · ${fmtSize(doc.fileSize)}`}
                  />
                ))}
                {product.certificates.map((cert) => (
                  <DownloadCard
                    key={cert.id}
                    href={cert.filePath}
                    download
                    icon={Shield}
                    title={cert.name}
                    meta={`${cert.certType} · ${fmtSize(cert.fileSize)}`}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function DownloadCard({
  href,
  download,
  icon: Icon,
  title,
  meta,
}: {
  href: string;
  download?: boolean;
  icon: typeof FileText;
  title: string;
  meta: string;
}) {
  return (
    <a
      href={href}
      download={download}
      className="group flex items-center gap-3 p-4 rounded-2xl bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-[#1d1d1f]" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[#1d1d1f] truncate">
          {title}
        </p>
        <p className="text-[11px] text-[#86868b] mt-0.5">{meta}</p>
      </div>
      <Download className="w-4 h-4 text-[#86868b] group-hover:text-[#1d1d1f] transition-colors shrink-0" strokeWidth={1.75} />
    </a>
  );
}
