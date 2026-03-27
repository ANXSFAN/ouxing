"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/upload/image-upload";
import { FileUpload } from "@/components/upload/file-upload";
import { DOC_TYPE_LABELS, CERT_TYPES } from "@/lib/constants";
import { Loader2, Save, ArrowLeft, Plus, Trash2 } from "lucide-react";
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

interface ProductFormProps {
  initialData?: Record<string, unknown>;
  isEditing?: boolean;
}

export function ProductForm({ initialData, isEditing }: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<AttributeDef[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [documents, setDocuments] = useState<UploadedFile[]>([]);
  const [certificates, setCertificates] = useState<UploadedFile[]>([]);
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
  // Specs (from attribute definitions)
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [addedSpecKeys, setAddedSpecKeys] = useState<string[]>([]);

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
      const existingSpecs = (initialData.specs as Record<string, string>) || {};
      setSpecs(existingSpecs);
      // Initialize addedSpecKeys from existing specs (exclude shipping keys)
      const SHIPPING_KEYS = ["qty_per_carton", "carton_length", "carton_width", "carton_height", "net_weight", "gross_weight"];
      setAddedSpecKeys(Object.keys(existingSpecs).filter((k) => existingSpecs[k] && !SHIPPING_KEYS.includes(k)));

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
    }
  }, [initialData]);

  const getCatName = (cat: Category) => {
    const c = typeof cat.content === "string" ? JSON.parse(cat.content) : cat.content;
    return c?.zh?.name || c?.en?.name || "未命名";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !modelNumber || !nameZh) { toast.error("请填写Slug、型号和中文名称"); return; }
    setLoading(true);

    const payload = {
      slug, modelNumber,
      content: {
        zh: { name: nameZh, description: descZh },
        en: { name: nameEn, description: descEn },
      },
      price: price ? parseFloat(price) : null,
      specs: Object.keys(specs).length > 0 ? specs : null,
      categoryId: categoryId || null,
      isActive, isFeatured,
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

        {/* 技术参数 - 按需添加 */}
        <TabsContent value="specs">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">技术参数</CardTitle>
                {/* 添加参数按钮 + 下拉选择 */}
                {productAttrs.filter((a) => !addedSpecKeys.includes(a.key)).length > 0 && (
                  <Select onValueChange={(v: string | null) => {
                    if (v && typeof v === "string" && !addedSpecKeys.includes(v)) {
                      setAddedSpecKeys([...addedSpecKeys, v]);
                    }
                  }}>
                    <SelectTrigger className="w-auto gap-2">
                      <Plus className="w-4 h-4" />
                      <SelectValue placeholder="添加参数" />
                    </SelectTrigger>
                    <SelectContent>
                      {productAttrs.filter((a) => !addedSpecKeys.includes(a.key)).map((attr) => (
                        <SelectItem key={attr.key} value={attr.key}>
                          {attr.name.zh || attr.name.en || attr.key}
                          {attr.unit && <span className="text-slate-400 ml-1">({attr.unit})</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {addedSpecKeys.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">
                  点击右上角「添加参数」选择要填写的技术参数
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {addedSpecKeys.map((key) => {
                    const attr = productAttrs.find((a) => a.key === key);
                    if (!attr) return null;
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <Label className="w-24 shrink-0 text-right text-sm truncate" title={attr.name.zh || attr.key}>
                          {attr.name.zh || attr.name.en || attr.key}
                          {attr.unit && <span className="text-slate-400 ml-0.5">({attr.unit})</span>}
                        </Label>
                        <div className="flex-1 min-w-0">
                          {attr.type === "SELECT" ? (
                            <Select value={specs[key] || ""} onValueChange={(v) => v && setSpecs({ ...specs, [key]: v === "__clear__" ? "" : v })}>
                              <SelectTrigger><SelectValue placeholder="选择..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__clear__">不选</SelectItem>
                                {attr.options.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    <div className="flex items-center gap-2">
                                      {opt.color && <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: opt.color }} />}
                                      {opt.value}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              type={attr.type === "NUMBER" ? "number" : "text"}
                              value={specs[key] || ""}
                              onChange={(e) => setSpecs({ ...specs, [key]: e.target.value })}
                            />
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-600 shrink-0 h-8 w-8 p-0"
                          onClick={() => {
                            setAddedSpecKeys(addedSpecKeys.filter((k) => k !== key));
                            const newSpecs = { ...specs };
                            delete newSpecs[key];
                            setSpecs(newSpecs);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
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
                      <Label>{attr.name.zh || attr.name.en || attr.key}{attr.unit && <span className="text-slate-400 ml-1">({attr.unit})</span>}</Label>
                      <Input
                        type="number"
                        value={specs[attr.key] || ""}
                        onChange={(e) => setSpecs({ ...specs, [attr.key]: e.target.value })}
                        placeholder=""
                      />
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
