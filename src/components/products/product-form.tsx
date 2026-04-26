"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/upload/image-upload";
import { FileUpload } from "@/components/upload/file-upload";
import { DOC_TYPE_LABELS, CERT_TYPES } from "@/lib/constants";
import { Loader2, Save, ArrowLeft, Plus, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Category { id: string; content: Record<string, { name?: string }> }
interface AttributeDef {
  id: string; key: string; name: Record<string, string>;
  type: string; unit: string | null; scope: string;
  options: { value: string; color: string | null }[];
}

interface UploadedImage { url: string; fileName: string }
interface UploadedFile { url: string; fileName: string; fileSize: number; mimeType: string; name?: string; docType?: string; certType?: string }
interface VariantRow { sku: string; price: string; specs: Record<string, string>; isActive: boolean }

interface ProductFormProps {
  initialData?: Record<string, unknown>;
  isEditing?: boolean;
}

// ── Helpers ──

/** Get attribute display label */
function attrLabel(attr: AttributeDef): string {
  return attr.name.zh || attr.name.en || attr.key;
}

/** Coerce spec value (string | string[]) to single string */
function coerceSpec(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] || "";
  return v || "";
}

/**
 * Auto-generate URL-safe slug from product name / model.
 * Falls back through nameEn → nameZh → modelNumber and appends a short
 * random suffix to avoid collisions on the unique constraint.
 */
function autoSlug(nameEn: string, nameZh: string, model: string): string {
  const candidates = [nameEn, nameZh, model, "product"];
  let base = "";
  for (const c of candidates) {
    base = c.toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    if (base) break;
  }
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "product"}-${suffix}`;
}

// ── Component ──

export function ProductForm({ initialData, isEditing }: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<AttributeDef[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [documents, setDocuments] = useState<UploadedFile[]>([]);
  const [certificates, setCertificates] = useState<UploadedFile[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [slug, setSlug] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  // Multilingual content
  const [nameZh, setNameZh] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [descZh, setDescZh] = useState("");
  const [descEn, setDescEn] = useState("");
  // Product-level specs (single value per attribute).
  // Variant overrides live on each variant's own specs.
  const [specs, setSpecs] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setCategories(d); });
    fetch("/api/attributes").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setAttributes(d); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (initialData) {
      setSlug((initialData.slug as string) || "");
      setModelNumber((initialData.modelNumber as string) || "");
      setPrice(initialData.price ? String(initialData.price) : "");
      setCategoryId((initialData.categoryId as string) || "");
      setIsActive((initialData.isActive as boolean) ?? true);
      setIsFeatured((initialData.isFeatured as boolean) ?? false);

      const content = initialData.content as Record<string, { name?: string; description?: string }>;
      setNameZh(content?.zh?.name || "");
      setNameEn(content?.en?.name || "");
      setDescZh(content?.zh?.description || "");
      setDescEn(content?.en?.description || "");

      const existingSpecs = (initialData.specs as Record<string, string | string[]>) || {};
      const normalized: Record<string, string> = {};
      for (const [k, v] of Object.entries(existingSpecs)) normalized[k] = coerceSpec(v);
      setSpecs(normalized);

      if (initialData.images) {
        setImages((initialData.images as { url: string; alt?: string }[]).map((img) => ({ url: img.url, fileName: img.alt || "" })));
      }
      if (initialData.documents) {
        setDocuments((initialData.documents as UploadedFile[]).map((d) => ({
          url: (d as unknown as { filePath: string }).filePath || d.url,
          fileName: d.fileName, fileSize: d.fileSize, mimeType: d.mimeType, name: d.name, docType: d.docType,
        })));
      }
      if (initialData.certificates) {
        setCertificates((initialData.certificates as UploadedFile[]).map((c) => ({
          url: (c as unknown as { filePath: string }).filePath || c.url,
          fileName: c.fileName, fileSize: c.fileSize, mimeType: c.mimeType, name: c.name, certType: c.certType,
        })));
      }
      if (initialData.variants) {
        setVariants((initialData.variants as { sku: string; price: unknown; specs: Record<string, string>; isActive: boolean }[]).map((v) => ({
          sku: v.sku,
          price: v.price != null ? String(v.price) : "",
          specs: v.specs || {},
          isActive: v.isActive ?? true,
        })));
      }
    }
  }, [initialData]);

  const getCatName = (cat: Category) => {
    const c = typeof cat.content === "string" ? JSON.parse(cat.content) : cat.content;
    return c?.zh?.name || c?.en?.name || "未命名";
  };

  // ── Spec helpers ──

  const updateSpec = useCallback((key: string, value: string) => {
    setSpecs((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ── Variant helpers ──

  const addVariant = useCallback(() => {
    setVariants((prev) => {
      const base = modelNumber || "SKU";
      const suffix = prev.length + 1;
      return [...prev, { sku: `${base}-${suffix}`, price: "", specs: {}, isActive: true }];
    });
  }, [modelNumber]);

  const updateVariant = useCallback((i: number, patch: Partial<VariantRow>) => {
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }, []);

  const setVariantSpec = useCallback((i: number, key: string, value: string) => {
    setVariants((prev) => prev.map((v, idx) => {
      if (idx !== i) return v;
      return { ...v, specs: { ...v.specs, [key]: value } };
    }));
  }, []);

  const removeVariantSpec = useCallback((i: number, key: string) => {
    setVariants((prev) => prev.map((v, idx) => {
      if (idx !== i) return v;
      const next = { ...v.specs };
      delete next[key];
      return { ...v, specs: next };
    }));
  }, []);

  const removeVariant = useCallback((i: number) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  // ── Submit ──

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelNumber || !nameZh) { toast.error("请填写型号和中文名称"); return; }
    setLoading(true);

    // Editing: keep existing slug. Creating: derive one automatically.
    const finalSlug = slug || autoSlug(nameEn, nameZh, modelNumber);

    // Build specs payload: filter empties
    const specsPayload: Record<string, string> = {};
    for (const [k, v] of Object.entries(specs)) {
      if (v && v.trim() !== "") specsPayload[k] = v;
    }

    const payload = {
      slug: finalSlug, modelNumber,
      content: {
        zh: { name: nameZh, description: descZh },
        en: { name: nameEn, description: descEn },
      },
      price: price ? parseFloat(price) : null,
      specs: Object.keys(specsPayload).length > 0 ? specsPayload : null,
      categoryId: categoryId || null,
      isActive, isFeatured,
      variants: variants
        .filter((v) => v.sku.trim())
        .map((v, i) => {
          const cleanSpecs: Record<string, string> = {};
          for (const [k, val] of Object.entries(v.specs)) {
            if (val && val.trim() !== "") cleanSpecs[k] = val;
          }
          return {
            sku: v.sku.trim(),
            price: v.price ? parseFloat(v.price) : null,
            specs: cleanSpecs,
            sortOrder: i,
            isActive: v.isActive,
          };
        }),
      images: images.map((img) => ({ url: img.url, fileName: img.fileName })),
      documents: documents.map((d) => ({ url: d.url, fileName: d.fileName, fileSize: d.fileSize, mimeType: d.mimeType, name: d.name || d.fileName, docType: d.docType || "DATASHEET" })),
      certificates: certificates.map((c) => ({ url: c.url, fileName: c.fileName, fileSize: c.fileSize, mimeType: c.mimeType, name: c.name || c.fileName, certType: c.certType || "其他" })),
    };

    const url = isEditing ? `/api/products/${(initialData as { id: string }).id}` : "/api/products";
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { toast.success(isEditing ? "产品已更新" : "产品已创建"); router.push("/admin/products"); }
    else { const data = await res.json(); toast.error(data.error || "操作失败"); }
    setLoading(false);
  };

  // ── Attribute grouping ──
  const SHIPPING_KEYS = ["qty_per_carton", "carton_length", "carton_width", "carton_height", "net_weight", "gross_weight"];
  const productAttrs = attributes.filter((a) => a.scope === "PRODUCT" && !SHIPPING_KEYS.includes(a.key));
  const shippingAttrs = attributes.filter((a) => SHIPPING_KEYS.includes(a.key));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild><Link href="/admin/products"><ArrowLeft className="w-4 h-4 mr-1" />返回</Link></Button>
          <h1 className="text-2xl font-bold">{isEditing ? "编辑产品" : "新建产品"}</h1>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {loading ? "保存中..." : "保存"}
        </Button>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="content">多语言内容</TabsTrigger>
          <TabsTrigger value="specs">技术参数</TabsTrigger>
          <TabsTrigger value="shipping">包装运输</TabsTrigger>
          <TabsTrigger value="variants">
            变体
            {variants.length > 0 && (
              <span className="ml-1.5 text-xs bg-blue-100 text-blue-700 rounded-full px-1.5">{variants.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="media">图片</TabsTrigger>
          <TabsTrigger value="docs">文档与证书</TabsTrigger>
        </TabsList>

        {/* 基本信息 */}
        <TabsContent value="basic">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>型号 <span className="text-red-500">*</span></Label>
                <Input value={modelNumber} onChange={(e) => setModelNumber(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>分类</Label>
                  <Select
                    value={categoryId || "none"}
                    onValueChange={(v) => v && setCategoryId(v === "none" ? "" : v)}
                  >
                    <SelectTrigger><SelectValue placeholder="选择分类" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">无分类</SelectItem>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{getCatName(c)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>价格（仅后台可见）</Label>
                  <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2"><Switch checked={isActive} onCheckedChange={setIsActive} /><Label>上架</Label></div>
                <div className="flex items-center gap-2"><Switch checked={isFeatured} onCheckedChange={setIsFeatured} /><Label>精选</Label></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 多语言内容 */}
        <TabsContent value="content">
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="zh">
                <TabsList><TabsTrigger value="zh">中文</TabsTrigger><TabsTrigger value="en">English</TabsTrigger></TabsList>
                <TabsContent value="zh" className="space-y-4 mt-4">
                  <div className="space-y-2"><Label>产品名称(中) <span className="text-red-500">*</span></Label><Input value={nameZh} onChange={(e) => setNameZh(e.target.value)} required /></div>
                  <div className="space-y-2"><Label>描述(中)</Label><Textarea value={descZh} onChange={(e) => setDescZh(e.target.value)} rows={4} /></div>
                </TabsContent>
                <TabsContent value="en" className="space-y-4 mt-4">
                  <div className="space-y-2"><Label>Product Name(EN)</Label><Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Description(EN)</Label><Textarea value={descEn} onChange={(e) => setDescEn(e.target.value)} rows={4} /></div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 技术参数 */}
        <TabsContent value="specs">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">技术参数</CardTitle>
              <p className="text-sm text-slate-400">
                填写产品的默认参数。如有多种规格（如不同功率、色温），请到&ldquo;变体&rdquo;中添加变体并在变体里覆盖对应参数。
              </p>
            </CardHeader>
            <CardContent>
              {productAttrs.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">
                  暂无产品属性。请先在 <Link href="/admin/attributes" className="text-blue-600 underline">属性管理</Link> 中创建。
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {productAttrs.map((attr) => {
                    const specVal = specs[attr.key] || "";

                    return (
                      <div key={attr.key}>
                        <Label className="text-sm font-medium mb-2 block">
                          {attrLabel(attr)}
                          {attr.unit && <span className="text-slate-400 ml-1">({attr.unit})</span>}
                        </Label>

                        {attr.type === "SELECT" ? (
                          <div className="flex flex-wrap gap-2">
                            {attr.options.map((opt) => {
                              const checked = specVal === opt.value;
                              return (
                                <button
                                  type="button"
                                  key={opt.value}
                                  onClick={() => updateSpec(attr.key, checked ? "" : opt.value)}
                                  className={`
                                    flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-sm
                                    ${checked
                                      ? "border-blue-500 bg-blue-50 text-blue-700"
                                      : "border-slate-200 hover:border-slate-300 text-slate-600"
                                    }
                                  `}
                                >
                                  {opt.color && <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: opt.color }} />}
                                  {opt.value}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <Input
                            type={attr.type === "NUMBER" ? "number" : "text"}
                            className="max-w-xs"
                            value={specVal}
                            onChange={(e) => updateSpec(attr.key, e.target.value)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 包装运输 */}
        <TabsContent value="shipping">
          <Card>
            <CardHeader><CardTitle className="text-base">包装运输参数</CardTitle></CardHeader>
            <CardContent>
              {shippingAttrs.length === 0 ? (
                <p className="text-sm text-slate-400 py-4">暂无包装运输属性。请先在 <Link href="/admin/attributes" className="text-blue-600 underline">属性管理</Link> 中创建。</p>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {shippingAttrs.map((attr) => (
                    <div key={attr.key} className="space-y-2">
                      <Label>{attrLabel(attr)}{attr.unit && <span className="text-slate-400 ml-1">({attr.unit})</span>}</Label>
                      <Input
                        type="number"
                        value={specs[attr.key] || ""}
                        onChange={(e) => updateSpec(attr.key, e.target.value)}
                        placeholder=""
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 变体 */}
        <TabsContent value="variants">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">产品变体</CardTitle>
                  <p className="text-sm text-slate-400 mt-1">
                    手动添加变体。每个变体里设置的参数会覆盖&ldquo;技术参数&rdquo;中的同名参数；未设置的参数沿用产品默认值。
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                  <Plus className="w-4 h-4 mr-1" /> 添加变体
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {variants.length === 0 ? (
                <div className="text-center py-10 text-sm text-slate-400">
                  <p>暂无变体。</p>
                  <p className="mt-1">如果产品有多种规格（例如不同功率/色温），点击右上角&ldquo;添加变体&rdquo;。</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {variants.map((v, i) => (
                    <VariantCard
                      key={i}
                      index={i}
                      variant={v}
                      attributes={productAttrs}
                      onChange={(patch) => updateVariant(i, patch)}
                      onSpecChange={(key, val) => setVariantSpec(i, key, val)}
                      onSpecRemove={(key) => removeVariantSpec(i, key)}
                      onRemove={() => removeVariant(i)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 图片 */}
        <TabsContent value="media">
          <Card><CardHeader><CardTitle className="text-base">产品图片</CardTitle></CardHeader><CardContent><ImageUpload images={images} onChange={setImages} /></CardContent></Card>
        </TabsContent>

        {/* 文档与证书 */}
        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">技术文档</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {documents.map((doc, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1"><Label className="text-xs">文件名</Label><Input value={doc.name || doc.fileName} onChange={(e) => { const d = [...documents]; d[i] = { ...doc, name: e.target.value }; setDocuments(d); }} /></div>
                  <div className="w-40 space-y-1"><Label className="text-xs">类型</Label>
                    <Select value={doc.docType || "DATASHEET"} onValueChange={(v) => { if (!v) return; const d = [...documents]; d[i] = { ...doc, docType: v }; setDocuments(d); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(DOC_TYPE_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              <FileUpload files={documents} onChange={setDocuments} type="document" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">认证证书</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {certificates.map((cert, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1"><Label className="text-xs">证书名称</Label><Input value={cert.name || cert.fileName} onChange={(e) => { const c = [...certificates]; c[i] = { ...cert, name: e.target.value }; setCertificates(c); }} /></div>
                  <div className="w-32 space-y-1"><Label className="text-xs">类型</Label>
                    <Select value={cert.certType || "其他"} onValueChange={(v) => { if (!v) return; const c = [...certificates]; c[i] = { ...cert, certType: v }; setCertificates(c); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CERT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              <FileUpload files={certificates} onChange={setCertificates} type="certificate" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  );
}

// ── VariantCard ──

interface VariantCardProps {
  index: number;
  variant: VariantRow;
  attributes: AttributeDef[];
  onChange: (patch: Partial<VariantRow>) => void;
  onSpecChange: (key: string, value: string) => void;
  onSpecRemove: (key: string) => void;
  onRemove: () => void;
}

function VariantCard({ index, variant, attributes, onChange, onSpecChange, onSpecRemove, onRemove }: VariantCardProps) {
  const usedKeys = new Set(Object.keys(variant.specs));
  const availableAttrs = attributes.filter((a) => !usedKeys.has(a.key));

  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50/40">
      {/* Top row: SKU / Price / Active / Delete */}
      <div className="flex items-end gap-3">
        <div className="w-10 text-xs text-slate-400 pb-2.5">#{index + 1}</div>
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-slate-500">SKU</Label>
          <Input
            value={variant.sku}
            onChange={(e) => onChange({ sku: e.target.value })}
            className="font-mono text-sm"
            placeholder="SKU"
          />
        </div>
        <div className="w-36 space-y-1">
          <Label className="text-xs text-slate-500">价格</Label>
          <Input
            type="number"
            step="0.01"
            value={variant.price}
            onChange={(e) => onChange({ price: e.target.value })}
            placeholder="—"
          />
        </div>
        <div className="flex items-center gap-2 pb-2.5">
          <Switch checked={variant.isActive} onCheckedChange={(c) => onChange({ isActive: c })} />
          <span className="text-xs text-slate-500">上架</span>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove} className="shrink-0">
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>

      {/* Spec overrides */}
      <div className="pl-10">
        <Label className="text-xs text-slate-500 block mb-2">规格覆盖</Label>
        <div className="flex flex-wrap gap-2 items-center">
          {Object.entries(variant.specs).map(([key, val]) => {
            const attr = attributes.find((a) => a.key === key);
            return (
              <VariantSpecChip
                key={key}
                attrKey={key}
                attr={attr}
                value={val}
                onChange={(v) => onSpecChange(key, v)}
                onRemove={() => onSpecRemove(key)}
              />
            );
          })}

          {availableAttrs.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-dashed border-slate-300 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600 bg-transparent"
              >
                <Plus className="w-3 h-3" /> 添加参数
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
                {availableAttrs.map((a) => (
                  <DropdownMenuItem
                    key={a.key}
                    onClick={() => onSpecChange(a.key, "")}
                  >
                    {attrLabel(a)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {Object.keys(variant.specs).length === 0 && (
          <p className="text-xs text-slate-400 mt-1">未设置任何覆盖，此变体将显示为产品默认参数。</p>
        )}
      </div>
    </div>
  );
}

interface VariantSpecChipProps {
  attrKey: string;
  attr: AttributeDef | undefined;
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
}

function VariantSpecChip({ attrKey, attr, value, onChange, onRemove }: VariantSpecChipProps) {
  const label = attr ? attrLabel(attr) : attrKey;
  const unit = attr?.unit;

  return (
    <div className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-md border border-slate-200 bg-white text-xs">
      <span className="text-slate-500 font-medium">{label}{unit && <span className="text-slate-400">({unit})</span>}:</span>
      {attr?.type === "SELECT" && attr.options.length > 0 ? (
        <Select value={value} onValueChange={(v) => onChange(v || "")}>
          <SelectTrigger className="h-6 min-w-[80px] text-xs border-0 shadow-none bg-transparent px-1 focus:ring-0">
            <SelectValue placeholder="选择" />
          </SelectTrigger>
          <SelectContent>
            {attr.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="inline-flex items-center gap-2">
                  {opt.color && <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: opt.color }} />}
                  {opt.value}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          type={attr?.type === "NUMBER" ? "number" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 min-w-[80px] w-24 text-xs border-0 shadow-none bg-transparent px-1 focus-visible:ring-0"
          placeholder="填写"
        />
      )}
      <button
        type="button"
        onClick={onRemove}
        className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 hover:text-red-500"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
