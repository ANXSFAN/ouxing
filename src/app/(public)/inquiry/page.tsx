"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Loader2, CheckCircle2, Send, Trash2, Plus, Minus,
  Package, ShoppingBag, Building2, Phone, MessageSquare,
} from "lucide-react";
import {
  getCartItems, setCartItems, removeFromCart, clearCart, addToCart, cartKey,
  type InquiryCartItem,
} from "@/lib/inquiry-cart";

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

  // Load cart from localStorage
  useEffect(() => {
    setItems(getCartItems());
    const onCartChange = () => setItems(getCartItems());
    window.addEventListener("inquiry-cart-change", onCartChange);
    return () => window.removeEventListener("inquiry-cart-change", onCartChange);
  }, []);

  // If coming from product page with ?product=xxx[&variant=yyy], add it to cart.
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-6">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 mb-2">询价已提交</h1>
          <p className="text-sm text-neutral-500 mb-8">我们会在1-2个工作日内回复您。</p>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline" size="sm">
              <Link href="/products">继续浏览</Link>
            </Button>
            <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-white" onClick={() => {
              setSubmitted(false);
              setForm({ company: "", phone: "", message: "" });
              setItems([]);
            }}>再次询价</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 min-h-[calc(100vh-64px)]">
      {/* Page header */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-bold text-neutral-900">询价单</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {items.length > 0
              ? `已选 ${items.length} 个产品，确认后提交询价`
              : "浏览产品后点击「加入询价单」添加产品"}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── 产品列表 ── */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100">
              <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-neutral-400" />
                询价产品
                {items.length > 0 && (
                  <span className="bg-neutral-100 text-neutral-600 text-xs font-medium px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                )}
              </h2>
            </div>

            {items.length === 0 ? (
              <div className="p-10 text-center">
                <Package className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                <p className="text-sm text-neutral-400 mb-4">询价单为空</p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/products">去选产品</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {items.map((item) => {
                  const itemKey = cartKey(item.productId, item.variantId);
                  return (
                  <div key={itemKey} className="flex gap-4 p-4 hover:bg-neutral-50/50 transition-colors">
                    {/* Image */}
                    <div className="w-20 h-20 bg-neutral-50 rounded-lg relative overflow-hidden shrink-0 border border-neutral-100">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-1.5" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-neutral-200" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-neutral-900 line-clamp-1">{item.name}</p>
                          <p className="text-xs text-neutral-400 font-mono mt-0.5">{item.modelNumber}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.productId, item.variantId)}
                          className="text-neutral-300 hover:text-red-500 transition-colors p-1 -mr-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-5 mt-3">
                        {/* Quantity */}
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-neutral-400 mr-1.5">数量</span>
                          <button
                            type="button"
                            onClick={() => updateQty(itemKey, -1)}
                            className="w-7 h-7 rounded-md border border-neutral-200 flex items-center justify-center text-neutral-400 hover:border-neutral-300 hover:text-neutral-600 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => setQty(itemKey, e.target.value)}
                            className="w-14 h-7 text-center text-sm font-medium tabular-nums border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-neutral-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => updateQty(itemKey, 1)}
                            className="w-7 h-7 rounded-md border border-neutral-200 flex items-center justify-center text-neutral-400 hover:border-neutral-300 hover:text-neutral-600 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Expected Price */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-neutral-400 whitespace-nowrap">期望单价</span>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400">¥</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.expectedPrice ?? ""}
                              onChange={(e) => updateExpectedPrice(itemKey, e.target.value)}
                              placeholder=""
                              className="pl-7 w-28 h-8 text-sm"
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

          {/* ── 联系信息 ── */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100">
              <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-neutral-400" />
                补充信息
                <span className="text-xs font-normal text-neutral-400">（选填）</span>
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-neutral-600 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                    公司名称
                  </Label>
                  <Input
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder=""
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-neutral-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    联系电话
                  </Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder=""
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-neutral-600">留言</Label>
                <Textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={3}
                  className="resize-none"
                  placeholder=""
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 hover:bg-neutral-800 text-white h-12 font-semibold rounded-xl text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            {loading ? "提交中..." : `提交询价${items.length > 0 ? ` (${items.length} 个产品)` : ""}`}
          </Button>
        </form>
      </div>
    </div>
  );
}
