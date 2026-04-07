"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2, Search, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  content: Record<string, { name?: string }>;
  modelNumber: string;
  price: string | null;
  category: { content: Record<string, { name?: string }> } | null;
}

function pName(p: Product) {
  return p.content?.zh?.name || p.content?.en?.name || p.modelNumber;
}
function cName(c: { content: Record<string, { name?: string }> } | null) {
  return c?.content?.zh?.name || c?.content?.en?.name || "";
}

interface QuoteItem {
  productId: string;
  productName: string;
  productModel: string;
  specification: string;
  quantity: number;
  unitPrice: number;
}

export default function EditQuotePage() {
  const router = useRouter();
  const params = useParams();
  const quoteId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("");

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerCompany: "",
    customerPhone: "",
    customerAddress: "",
    title: "",
    notes: "",
    validDays: 30,
    currency: "CNY",
    discount: 0,
    tax: 0,
  });

  const [discountMode, setDiscountMode] = useState<"fixed" | "percent">("fixed");
  const [taxMode, setTaxMode] = useState<"fixed" | "percent">("fixed");
  const [items, setItems] = useState<QuoteItem[]>([]);

  // Load existing quote data
  useEffect(() => {
    fetch(`/api/quotes/${quoteId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.id) {
          setQuoteNumber(data.quoteNumber);
          setForm({
            customerName: data.customerName || "",
            customerEmail: data.customerEmail || "",
            customerCompany: data.customerCompany || "",
            customerPhone: data.customerPhone || "",
            customerAddress: data.customerAddress || "",
            title: data.title || "",
            notes: data.notes || "",
            validDays: data.validDays || 30,
            currency: data.currency || "CNY",
            discount: parseFloat(data.discount) || 0,
            tax: parseFloat(data.tax) || 0,
          });
          if (data.items?.length) {
            setItems(
              data.items.map(
                (item: {
                  productId: string;
                  productName: string;
                  productModel: string;
                  specification: string | null;
                  quantity: number;
                  unitPrice: string;
                }) => ({
                  productId: item.productId,
                  productName: item.productName,
                  productModel: item.productModel,
                  specification: item.specification || "",
                  quantity: item.quantity,
                  unitPrice: parseFloat(item.unitPrice) || 0,
                })
              )
            );
          }
        }
        setInitialLoading(false);
      });
  }, [quoteId]);

  const searchProducts = () => {
    const params = new URLSearchParams({
      search: productSearch,
      all: "true",
      pageSize: "20",
    });
    fetch(`/api/products?${params}`)
      .then((res) => res.json())
      .then((data) => setProducts(data.products));
  };

  useEffect(() => {
    if (productDialogOpen) searchProducts();
  }, [productDialogOpen]);

  const addProduct = (product: Product) => {
    if (items.find((i) => i.productId === product.id)) {
      toast.error("该产品已添加");
      return;
    }
    setItems([
      ...items,
      {
        productId: product.id,
        productName: pName(product),
        productModel: product.modelNumber,
        specification: "",
        quantity: 1,
        unitPrice: product.price ? parseFloat(product.price) : 0,
      },
    ]);
    setProductDialogOpen(false);
  };

  const updateItem = (
    index: number,
    field: keyof QuoteItem,
    value: string | number
  ) => {
    const newItems = [...items];
    (newItems[index] as unknown as Record<string, unknown>)[field] = value;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const discountAmount = discountMode === "percent" ? subtotal * form.discount / 100 : form.discount;
  const taxAmount = taxMode === "percent" ? subtotal * form.tax / 100 : form.tax;
  const total = subtotal - discountAmount + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("请至少添加一个产品");
      return;
    }
    setLoading(true);

    const res = await fetch(`/api/quotes/${quoteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, discount: discountAmount, tax: taxAmount, items }),
    });

    if (res.ok) {
      toast.success("报价单已更新");
      router.push(`/admin/quotes/${quoteId}`);
    } else {
      const data = await res.json();
      toast.error(data.error || "更新失败");
    }
    setLoading(false);
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/quotes/${quoteId}`}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">编辑报价单</h1>
            {quoteNumber && (
              <p className="text-sm text-slate-500">{quoteNumber}</p>
            )}
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {loading ? "保存中..." : "保存修改"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">客户信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>客户姓名 *</Label>
              <Input
                value={form.customerName}
                onChange={(e) =>
                  setForm({ ...form, customerName: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>公司名称</Label>
              <Input
                value={form.customerCompany}
                onChange={(e) =>
                  setForm({ ...form, customerCompany: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>邮箱</Label>
              <Input
                type="email"
                value={form.customerEmail}
                onChange={(e) =>
                  setForm({ ...form, customerEmail: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>电话</Label>
              <Input
                value={form.customerPhone}
                onChange={(e) =>
                  setForm({ ...form, customerPhone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>地址</Label>
              <Textarea
                value={form.customerAddress}
                onChange={(e) =>
                  setForm({ ...form, customerAddress: e.target.value })
                }
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Products */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">产品明细</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setProductDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                添加产品
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                点击"添加产品"选择要报价的产品
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>产品</TableHead>
                    <TableHead className="w-20">数量</TableHead>
                    <TableHead className="w-28">单价(¥)</TableHead>
                    <TableHead className="w-28 text-right">小计</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <p className="font-medium text-sm">
                          {item.productName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.productModel}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "quantity",
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "unitPrice",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ¥
                        {(item.quantity * item.unitPrice).toLocaleString(
                          "zh-CN",
                          { minimumFractionDigits: 2 }
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="text-red-500 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Totals */}
            {items.length > 0 && (
              <div className="mt-6 border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">小计</span>
                  <span className="font-medium">
                    ¥
                    {subtotal.toLocaleString("zh-CN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-500">折扣</span>
                  <div className="flex items-center gap-0">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.discount || ""}
                      onChange={(e) => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })}
                      className="w-28 h-8 text-right rounded-r-none"
                    />
                    <button
                      type="button"
                      onClick={() => setDiscountMode(discountMode === "fixed" ? "percent" : "fixed")}
                      className="h-8 px-2.5 border border-l-0 rounded-r-md text-xs font-medium bg-slate-50 hover:bg-slate-100 transition-colors whitespace-nowrap"
                    >
                      {discountMode === "fixed" ? "¥" : "%"}
                    </button>
                    {discountMode === "percent" && form.discount > 0 && (
                      <span className="text-xs text-slate-400 ml-2 whitespace-nowrap">= ¥{discountAmount.toFixed(2)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-500">税额</span>
                  <div className="flex items-center gap-0">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.tax || ""}
                      onChange={(e) => setForm({ ...form, tax: parseFloat(e.target.value) || 0 })}
                      className="w-28 h-8 text-right rounded-r-none"
                    />
                    <button
                      type="button"
                      onClick={() => setTaxMode(taxMode === "fixed" ? "percent" : "fixed")}
                      className="h-8 px-2.5 border border-l-0 rounded-r-md text-xs font-medium bg-slate-50 hover:bg-slate-100 transition-colors whitespace-nowrap"
                    >
                      {taxMode === "fixed" ? "¥" : "%"}
                    </button>
                    {taxMode === "percent" && form.tax > 0 && (
                      <span className="text-xs text-slate-400 ml-2 whitespace-nowrap">= ¥{taxAmount.toFixed(2)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-base font-bold">总计</span>
                  <span className="text-xl font-bold text-amber-600">
                    ¥
                    {total.toLocaleString("zh-CN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">报价备注</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>报价标题</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="可选"
            />
          </div>
          <div className="space-y-2">
            <Label>有效期(天)</Label>
            <Input
              type="number"
              value={form.validDays}
              onChange={(e) =>
                setForm({
                  ...form,
                  validDays: parseInt(e.target.value) || 30,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>货币</Label>
            <Input
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            />
          </div>
          <div className="lg:col-span-3 space-y-2">
            <Label>备注</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="付款方式、交货条件等..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Product Search Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>选择产品</DialogTitle>
          </DialogHeader>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="搜索产品..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  searchProducts();
                }
              }}
              className="pl-9"
            />
          </div>
          <div className="max-h-80 overflow-y-auto space-y-2">
            {products.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => addProduct(product)}
                className="w-full text-left p-3 rounded-lg border hover:border-amber-500/50 hover:bg-amber-50/50 transition-colors"
              >
                <p className="font-medium text-sm">{pName(product)}</p>
                <p className="text-xs text-slate-500">
                  {product.modelNumber}
                  {cName(product.category)
                    ? ` · ${cName(product.category)}`
                    : ""}
                  {product.price &&
                    ` · ¥${parseFloat(product.price).toFixed(2)}`}
                </p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
