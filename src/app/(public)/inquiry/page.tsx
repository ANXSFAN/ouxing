"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  Loader2, CheckCircle2, Send, Trash2, Plus, Minus,
  Package,
} from "lucide-react";
import {
  getCartItems, setCartItems, removeFromCart, clearCart, addToCart, cartKey,
  type InquiryCartItem,
} from "@/lib/inquiry-cart";
import { cn } from "@/lib/utils";

type ContentJson = Record<string, { name?: string }>;
function getName(c: unknown) { const v = c as ContentJson | null; return v?.zh?.name || v?.en?.name || ""; }

export default function InquiryPage() {
  return <Suspense><InquiryContent /></Suspense>;
}

function InquiryContent() {
  const searchParams = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<InquiryCartItem[]>([]);
  const [form, setForm] = useState({ company: "", phone: "", message: "" });

  useEffect(() => {
    setItems(getCartItems());
    const onCartChange = () => setItems(getCartItems());
    window.addEventListener("inquiry-cart-change", onCartChange);
    return () => window.removeEventListener("inquiry-cart-change", onCartChange);
  }, []);

  const productId = searchParams.get("product");
  const variantIdParam = searchParams.get("variant");
  useEffect(() => {
    if (!productId) return;
    const key = cartKey(productId, variantIdParam);
    const existing = getCartItems().find((i) => cartKey(i.productId, i.variantId) === key);
    if (existing) return;
    fetch(`/api/products/${productId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.id) return;
        const variant = variantIdParam
          ? (d.variants as { id: string; sku: string; specs: Record<string, string>; images?: { url: string }[] }[] | undefined)
              ?.find((v) => v.id === variantIdParam)
          : null;
        const specLabel = variant
          ? Object.entries(variant.specs || {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(" · ")
          : "";
        const baseName = getName(d.content) || d.modelNumber;
        addToCart({
          productId: d.id,
          variantId: variant?.id ?? null,
          name: specLabel ? `${baseName}（${specLabel}）` : baseName,
          modelNumber: variant?.sku || d.modelNumber,
          imageUrl: variant?.images?.[0]?.url || d.images?.[0]?.url,
        });
      })
      .catch(() => {});
  }, [productId, variantIdParam]);

  const updateQty = (key: string, delta: number) => {
    const updated = items.map((i) => {
      if (cartKey(i.productId, i.variantId) === key) {
        return { ...i, quantity: Math.max(1, i.quantity + delta) };
      }
      return i;
    });
    setItems(updated);
    setCartItems(updated);
  };

  const setQty = (key: string, value: string) => {
    const num = parseInt(value, 10);
    const updated = items.map((i) => {
      if (cartKey(i.productId, i.variantId) === key) {
        return { ...i, quantity: isNaN(num) || num < 1 ? 1 : num };
      }
      return i;
    });
    setItems(updated);
    setCartItems(updated);
  };

  const updateExpectedPrice = (key: string, price: string) => {
    const updated = items.map((i) => {
      if (cartKey(i.productId, i.variantId) === key) {
        return { ...i, expectedPrice: price ? parseFloat(price) : undefined };
      }
      return i;
    });
    setItems(updated);
    setCartItems(updated);
  };

  const handleRemove = (productId: string, variantId: string | null) => {
    removeFromCart(productId, variantId);
    setItems(getCartItems());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 && !form.message) {
      toast.error("请至少添加一个产品或填写留言");
      return;
    }
    setLoading(true);
    const payload = {
      ...form,
      productIds: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
        expectedPrice: i.expectedPrice,
      })),
    };
    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      clearCart();
      setSubmitted(true);
    } else {
      try {
        const d = await res.json();
        toast.error(d.error || "提交失败");
      } catch {
        toast.error("提交失败，请重试");
      }
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-white">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 rounded-full bg-[#f5f5f7] flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-[#1d1d1f]" strokeWidth={1.5} />
          </div>
          <h1 className="headline-xl text-3xl md:text-5xl text-[#1d1d1f] mb-3">
            询价已提交<span className="text-[#86868b]">.</span>
          </h1>
          <p className="text-[15px] text-[#86868b] mb-10 leading-relaxed">
            我们会在 <span className="text-[#1d1d1f] font-medium">1–2 个工作日</span> 内回复您的询价单。
          </p>
          <div className="flex flex-wrap gap-x-7 gap-y-3 justify-center items-center">
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setForm({ company: "", phone: "", message: "" });
                setItems([]);
              }}
              className="appbtn"
            >
              再次询价
            </button>
            <Link href="/products" className="applink">继续浏览</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-[calc(100vh-44px)] text-[#1d1d1f]">
      {/* Hero header */}
      <section className="bg-white pt-12 md:pt-16 pb-8 md:pb-10 text-center">
        <div className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-base md:text-lg text-[#86868b] mb-3 font-medium">询价单</p>
          <h1 className="headline-xl text-4xl sm:text-6xl md:text-[72px] mb-4">
            告诉我们您的需求<span className="text-[#86868b]">.</span>
          </h1>
          <p className="text-[15px] md:text-[17px] text-[#86868b]">
            {items.length > 0
              ? `已选 ${items.length} 件产品，确认后提交询价`
              : "浏览产品后点击「加入询价单」添加产品"}
          </p>
        </div>
      </section>

      <div className="max-w-[768px] mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ── Product list ── */}
          <div className="bg-[#f5f5f7] rounded-3xl overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between">
              <h2 className="headline-lg text-[17px] text-[#1d1d1f] flex items-center gap-2">
                询价产品
                {items.length > 0 && (
                  <span className="bg-[#1d1d1f] text-white text-[11px] font-medium px-2 py-0.5 rounded-full tabular-nums">
                    {items.length}
                  </span>
                )}
              </h2>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => { clearCart(); setItems([]); }}
                  className="text-[13px] text-[#86868b] hover:text-[#1d1d1f] underline underline-offset-4 transition-colors"
                >
                  清空
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="px-6 pb-12 pt-4 text-center">
                <Package className="w-12 h-12 text-[#d2d2d7] mx-auto mb-3" strokeWidth={1.25} />
                <p className="text-[13px] text-[#86868b] mb-6">询价单为空</p>
                <Link href="/products" className="applink">去选产品</Link>
              </div>
            ) : (
              <div className="divide-y divide-black/5">
                {items.map((item) => {
                  const itemKey = cartKey(item.productId, item.variantId);
                  return (
                    <div key={itemKey} className="flex gap-4 px-6 py-5">
                      <Link
                        href={`/products/${item.productId}`}
                        className="w-20 h-20 bg-white rounded-2xl relative overflow-hidden shrink-0"
                      >
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-2" unoptimized />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-[#d2d2d7]" />
                          </div>
                        )}
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              href={`/products/${item.productId}`}
                              className="text-[14px] font-semibold text-[#1d1d1f] hover:opacity-80 transition-opacity line-clamp-1"
                            >
                              {item.name}
                            </Link>
                            <p className="text-[12px] text-[#86868b] mt-0.5 tabular-nums">{item.modelNumber}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemove(item.productId, item.variantId)}
                            className="text-[#86868b] hover:text-[#1d1d1f] transition-colors p-1.5 -mr-1.5"
                            aria-label="移除"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                        </div>

                        <div className="flex items-center flex-wrap gap-x-5 gap-y-2 mt-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] text-[#86868b]">数量</span>
                            <div className="inline-flex items-center bg-white rounded-full px-1">
                              <button
                                type="button"
                                onClick={() => updateQty(itemKey, -1)}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
                              >
                                <Minus className="w-3 h-3" strokeWidth={1.75} />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => setQty(itemKey, e.target.value)}
                                className="w-10 h-7 text-center text-[13px] font-semibold tabular-nums bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <button
                                type="button"
                                onClick={() => updateQty(itemKey, 1)}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
                              >
                                <Plus className="w-3 h-3" strokeWidth={1.75} />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[12px] text-[#86868b] whitespace-nowrap">期望单价</span>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#86868b]">¥</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.expectedPrice ?? ""}
                                onChange={(e) => updateExpectedPrice(itemKey, e.target.value)}
                                className="pl-7 pr-3 w-24 h-7 text-[13px] bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 tabular-nums"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Contact info ── */}
          <div className="bg-[#f5f5f7] rounded-3xl overflow-hidden">
            <div className="px-6 py-5">
              <h2 className="headline-lg text-[17px] text-[#1d1d1f] flex items-center gap-2">
                补充信息
                <span className="text-[12px] font-normal text-[#86868b]">（选填）</span>
              </h2>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] text-[#86868b] mb-2">公司名称</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className={appleInputCls}
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-[#86868b] mb-2">联系电话</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={appleInputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-[#86868b] mb-2">留言</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={4}
                  placeholder="如有特殊需求请在此说明…"
                  className="w-full px-4 py-3 bg-white rounded-2xl text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/15 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 text-center">
            <button
              type="submit"
              disabled={loading}
              className="appbtn h-12 px-8 text-[15px] min-w-[240px] disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" strokeWidth={1.75} />}
              {loading ? "提交中..." : `提交询价${items.length > 0 ? ` (${items.length} 件)` : ""}`}
            </button>
            <p className="text-[12px] text-[#86868b] mt-4">
              提交后您将收到自动确认邮件，销售工程师将在 1–2 个工作日内回复
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

const appleInputCls =
  "w-full h-11 px-4 bg-white rounded-2xl text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/15 transition-all";
