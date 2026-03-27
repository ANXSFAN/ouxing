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
  Loader2, X, CheckCircle2, Send, Trash2, Plus, Minus,
  Package, ShoppingBag,
} from "lucide-react";
import {
  getCartItems, setCartItems, removeFromCart, clearCart, addToCart,
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
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "", message: "" });

  // Load cart from localStorage
  useEffect(() => {
    setItems(getCartItems());
    const onCartChange = () => setItems(getCartItems());
    window.addEventListener("inquiry-cart-change", onCartChange);
    return () => window.removeEventListener("inquiry-cart-change", onCartChange);
  }, []);

  // If coming from product page with ?product=xxx, add it to cart
  const productId = searchParams.get("product");
  useEffect(() => {
    if (!productId) return;
    // Check if already in cart
    const existing = getCartItems().find((i) => i.productId === productId);
    if (existing) return;
    // Fetch product info and add
    fetch(`/api/products/${productId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.id) {
          addToCart({
            productId: d.id,
            name: getName(d.content) || d.modelNumber,
            modelNumber: d.modelNumber,
            imageUrl: d.images?.[0]?.url,
          });
        }
      })
      .catch(() => {});
  }, [productId]);

  const updateQty = (productId: string, delta: number) => {
    const updated = items.map((i) => {
      if (i.productId === productId) {
        return { ...i, quantity: Math.max(1, i.quantity + delta) };
      }
      return i;
    });
    setItems(updated);
    setCartItems(updated);
  };

  const updateExpectedPrice = (productId: string, price: string) => {
    const updated = items.map((i) => {
      if (i.productId === productId) {
        return { ...i, expectedPrice: price ? parseFloat(price) : undefined };
      }
      return i;
    });
    setItems(updated);
    setCartItems(updated);
  };

  const handleRemove = (productId: string) => {
    removeFromCart(productId);
    setItems(getCartItems());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error("请填写姓名和邮箱");
      return;
    }
    if (items.length === 0 && !form.message) {
      toast.error("请至少添加一个产品或填写留言");
      return;
    }

    setLoading(true);
    const payload = {
      ...form,
      productIds: items.map((i) => ({
        productId: i.productId,
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
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">询价已提交</h1>
          <p className="text-sm text-gray-500 mb-6">我们会在1-2个工作日内回复您。</p>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline" size="sm"><Link href="/products">继续浏览</Link></Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
              setSubmitted(false);
              setForm({ name: "", email: "", company: "", phone: "", message: "" });
              setItems([]);
            }}>再次询价</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900">询价单</h1>
          <p className="text-sm text-gray-400 mt-1">
            {items.length > 0
              ? `已选 ${items.length} 个产品，填写联系信息提交询价`
              : "浏览产品后点击「加入询价单」添加产品"}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ── 产品列表（购物车风格） ── */}
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              询价产品 ({items.length})
            </h2>

            {items.length === 0 ? (
              <div className="border border-dashed border-gray-200 rounded-xl p-10 text-center">
                <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400 mb-4">询价单为空</p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/products">去选产品</Link>
                </Button>
              </div>
            ) : (
              <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-4 p-4 bg-white">
                    {/* Image */}
                    <div className="w-20 h-20 bg-gray-50 rounded-lg relative overflow-hidden shrink-0">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-1" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-200" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{item.modelNumber}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.productId)}
                          className="text-gray-300 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-4 mt-3">
                        {/* Quantity */}
                        <div className="flex items-center gap-0.5">
                          <Label className="text-xs text-gray-400 mr-2">数量</Label>
                          <button
                            type="button"
                            onClick={() => updateQty(item.productId, -1)}
                            className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-10 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.productId, 1)}
                            className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Expected Price (optional) */}
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-gray-400 whitespace-nowrap">期望单价</Label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">¥</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.expectedPrice ?? ""}
                              onChange={(e) => updateExpectedPrice(item.productId, e.target.value)}
                              placeholder="可选"
                              className="pl-7 w-28 h-8 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── 联系信息 ── */}
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              联系信息
            </h2>
            <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-gray-600">姓名 *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-gray-600">邮箱 *</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-gray-600">公司</Label>
                  <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-gray-600">电话</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-600">留言（可选）</Label>
                <Textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={3}
                  className="resize-none"
                  placeholder="补充说明，如交付时间、特殊要求等..."
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 font-semibold rounded-lg"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            {loading ? "提交中..." : `提交询价${items.length > 0 ? ` (${items.length} 个产品)` : ""}`}
          </Button>
        </form>
      </div>
    </div>
  );
}
