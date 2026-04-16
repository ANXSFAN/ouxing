"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/upload/image-upload";
import { FileUpload } from "@/components/upload/file-upload";
import { DOC_TYPE_LABELS, CERT_TYPES } from "@/lib/constants";
import { Loader2, Save, ArrowLeft, Sparkles, Trash2 } from "lucide-react";
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

/** Cartesian product of arrays: [[a,b],[1,2]] → [[a,1],[a,2],[b,1],[b,2]] */
function cartesian<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  return arrays.reduce<T[][]>(
    (acc, arr) => acc.flatMap((combo) => arr.map((v) => [...combo, v])),
    [[]],
  );
}

/** Build SKU suffix from specs values: "3000K-18W" */
function buildSkuSuffix(specValues: string[]): string {
  return specValues.join("-");
}

/** Get attribute display label */
function attrLabel(attr: AttributeDef): string {
  return attr.name.zh || attr.name.en || attr.key;
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
  // Specs: value can be string (single) or string[] (multi-value → variant dimension)
  const [specs, setSpecs] = useState<Record<string, string | string[]>>({});

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
      setSpecs(existingSpecs);

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

  const updateSpec = useCallback((key: string, value: string | string[]) => {
    setSpecs((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** Toggle a value in a multi-select spec */
  const toggleSpecOption = useCallback((key: string, optValue: string, checked: boolean) => {
    setSpecs((prev) => {
      const current = prev[key];
      const arr = Array.isArray(current) ? [...current] : current ? [current] : [];
      if (checked && !arr.includes(optValue)) arr.push(optValue);
      if (!checked) {
        const idx = arr.indexOf(optValue);
        if (idx >= 0) arr.splice(idx, 1);
      }
      return { ...prev, [key]: arr.length === 1 ? arr[0] : arr.length === 0 ? "" : arr };
    });
  }, []);

  /** Which spec keys have multi-value (variant dimensions) */
  const multiValueKeys = Object.entries(specs)
    .filter(([, v]) => Array.isArray(v) && v.length > 1)
    .map(([k]) => k);

  // ── Variant generation ──

  const generateVariants = useCallback(() => {
    if (multiValueKeys.length === 0) {
      toast.error("没有多值参数。请在技术参数中为SELECT属性勾选多个值。");
      return;
    }

    const dimensions = multiValueKeys.map((key) => {
      const vals = specs[key] as string[];
      return { key, values: vals };
    });

    const combos = cartesian(dimensions.map((d) => d.values));
    const base = modelNumber || "SKU";

    // Build variant rows, preserving existing prices if specs match
    const newVariants: VariantRow[] = combos.map((combo) => {
      const variantSpecs: Record<string, string> = {};
      dimensions.forEach((dim, i) => { variantSpecs[dim.key] = combo[i]; });
      const suffix = buildSkuSuffix(combo);
      const sku = `${base}-${suffix}`;

      // Try to find existing variant with same specs
      const existing = variants.find((v) => {
        return dimensions.every((dim) => v.specs[dim.key] === variantSpecs[dim.key]);
      });

      return {
        sku: existing?.sku || sku,
        price: existing?.price || "",
        specs: variantSpecs,
        isActive: existing?.isActive ?? true,
      };
    });

    setVariants(newVariants);
    toast.success(`已生成 ${newVariants.length} 个变体`);
  }, [multiValueKeys, specs, modelNumber, variants]);

  // ── Submit ──

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !modelNumber || !nameZh) { toast.error("请填写Slug、型号和中文名称"); return; }
    setLoading(true);

    // Build specs payload: filter empties, keep arrays for multi-value
    const specsPayload: Record<string, string | string[]> = {};
    for (const [k, v] of Object.entries(specs)) {
      if (Array.isArray(v)) {
        if (v.length > 0) specsPayload[k] = v;
      } else if (v && v.trim() !== "") {
        specsPayload[k] = v;
      }
    }

    const payload = {
      slug, modelNumber,
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
        .map((v, i) => ({
          sku: v.sku.trim(),
          price: v.price ? parseFloat(v.price) : null,
          specs: v.specs,
          sortOrder: i,
          isActive: v.isActive,
        })),
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

  /** Get display value for a spec key (for showing in variant table) */
  const getAttrName = (key: string) => {
    const attr = attributes.find((a) => a.key === key);
    return attr ? attrLabel(attr) : key;
  };

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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Slug <span className="text-red-500">*</span></Label>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>型号 <span className="text-red-500">*</span></Label>
                  <Input value={modelNumber} onChange={(e) => setModelNumber(e.target.value)} required />
                </div>
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
                SELECT 类型属性可勾选多个值，多值属性将作为变体维度自动生成变体组合。
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
                    const specVal = specs[attr.key];
                    const currentArr = Array.isArray(specVal) ? specVal : specVal ? [specVal] : [];

                    return (
                      <div key={attr.key}>
                        <Label className="text-sm font-medium mb-2 block">
                          {attrLabel(attr)}
                          {attr.unit && <span className="text-slate-400 ml-1">({attr.unit})</span>}
                          {Array.isArray(specVal) && specVal.length > 1 && (
                            <Badge variant="secondary" className="ml-2 text-[10px]">变体维度</Badge>
                          )}
                        </Label>

                        {attr.type === "SELECT" ? (
                          <div className="flex flex-wrap gap-2">
                            {attr.options.map((opt) => {
                              const checked = currentArr.includes(opt.value);
                              return (
                                <label
                                  key={opt.value}
                                  className={`
                                    flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all text-sm
                                    ${checked
                                      ? "border-blue-500 bg-blue-50 text-blue-700"
                                      : "border-slate-200 hover:border-slate-300 text-slate-600"
                                    }
                                  `}
                                >
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(c) => toggleSpecOption(attr.key, opt.value, !!c)}
                                  />
                                  {opt.color && <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: opt.color }} />}
                                  {opt.value}
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <Input
                            type={attr.type === "NUMBER" ? "number" : "text"}
                            className="max-w-xs"
                            value={(specVal as string) || ""}
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
                        value={(specs[attr.key] as string) || ""}
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
                    在技术参数中勾选多个SELECT选项（如多种色温/功率），然后点击"生成变体"自动创建组合。
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateVariants}
                  disabled={multiValueKeys.length === 0}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  生成变体
                  {multiValueKeys.length > 0 && (
                    <span className="ml-1 text-xs text-slate-400">
                      ({multiValueKeys.map((k) => getAttrName(k)).join(" × ")})
                    </span>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {variants.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-400">
                  <p>暂无变体。</p>
                  <p className="mt-1">请先到"技术参数"中为 SELECT 类型属性勾选多个值，再点击"生成变体"。</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Header */}
                  <div className="grid grid-cols-[200px_1fr_140px_60px_40px] gap-2 text-xs text-slate-500 px-1 font-medium">
                    <span>SKU</span>
                    <span>规格</span>
                    <span>价格</span>
                    <span>上架</span>
                    <span></span>
                  </div>
                  {/* Rows */}
                  {variants.map((v, i) => (
                    <div key={i} className="grid grid-cols-[200px_1fr_140px_60px_40px] gap-2 items-center py-1 border-b border-slate-100 last:border-0">
                      <Input
                        value={v.sku}
                        onChange={(e) => { const next = [...variants]; next[i] = { ...v, sku: e.target.value }; setVariants(next); }}
                        className="font-mono text-xs"
                      />
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(v.specs).map(([key, val]) => (
                          <Badge key={key} variant="secondary" className="text-[10px]">
                            {getAttrName(key)}: {val}
                          </Badge>
                        ))}
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        value={v.price}
                        onChange={(e) => { const next = [...variants]; next[i] = { ...v, price: e.target.value }; setVariants(next); }}
                        placeholder="—"
                      />
                      <div className="flex justify-center">
                        <Switch
                          checked={v.isActive}
                          onCheckedChange={(c) => { const next = [...variants]; next[i] = { ...v, isActive: c }; setVariants(next); }}
                        />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
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
