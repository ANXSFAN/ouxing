"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Plus, Pencil, Trash2, FolderTree } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  slug: string;
  content: Record<string, { name?: string; description?: string }>;
  parentId: string | null;
  parent: { id: string; content: Record<string, { name?: string }> } | null;
  sortOrder: number;
  isActive: boolean;
  _count: { products: number };
}

const EMPTY_FORM = {
  slug: "", parentId: "", sortOrder: 0, isActive: true,
  names: { zh: "", en: "" },
  descriptions: { zh: "", en: "" },
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchCategories = () => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  };
  useEffect(() => { fetchCategories(); }, []);

  const getCatName = (cat: { content: Record<string, { name?: string }> }) =>
    cat.content?.zh?.name || cat.content?.en?.name || "未命名";

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      slug: cat.slug,
      parentId: cat.parentId || "",
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
      names: { zh: cat.content?.zh?.name || "", en: cat.content?.en?.name || "" },
      descriptions: { zh: cat.content?.zh?.description || "", en: cat.content?.en?.description || "" },
    });
    setDialogOpen(true);
  };

  const handleNameChange = (lang: "zh" | "en", value: string) => {
    setForm((prev) => {
      const names = { ...prev.names, [lang]: value };
      const slug = editing ? prev.slug : value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-").replace(/(^-|-$)/g, "");
      return { ...prev, names, ...(lang === "zh" && !editing ? { slug } : {}) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.slug || !form.names.zh) { toast.error("请填写Slug和中文名称"); return; }
    setLoading(true);

    const content: Record<string, { name: string; description: string }> = {
      zh: { name: form.names.zh, description: form.descriptions.zh },
      en: { name: form.names.en, description: form.descriptions.en },
    };

    const url = editing ? `/api/categories/${editing.id}` : "/api/categories";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: form.slug, content, parentId: form.parentId || null,
        sortOrder: form.sortOrder, isActive: form.isActive,
      }),
    });

    const data = await res.json();
    if (!res.ok) toast.error(data.error || "操作失败");
    else { toast.success(editing ? "分类已更新" : "分类已创建"); setDialogOpen(false); fetchCategories(); }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setLoading(true);
    const res = await fetch(`/api/categories/${deleting.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) toast.error(data.error); else { toast.success("分类已删除"); }
    setDeleteDialogOpen(false); setDeleting(null); setLoading(false); fetchCategories();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="分类管理" description="管理产品分类（支持层级和多语言）"
        action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />新建分类</Button>}
      />

      {categories.length === 0 ? (
        <EmptyState icon={FolderTree} title="暂无分类" action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />新建分类</Button>} />
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称(中)</TableHead>
                <TableHead>名称(英)</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>上级分类</TableHead>
                <TableHead>排序</TableHead>
                <TableHead>产品数</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.content?.zh?.name || "-"}</TableCell>
                  <TableCell className="text-slate-500">{cat.content?.en?.name || "-"}</TableCell>
                  <TableCell className="text-slate-500 font-mono text-sm">{cat.slug}</TableCell>
                  <TableCell>{cat.parent ? getCatName(cat.parent) : "-"}</TableCell>
                  <TableCell>{cat.sortOrder}</TableCell>
                  <TableCell>{cat._count.products}</TableCell>
                  <TableCell><Badge variant={cat.isActive ? "default" : "secondary"}>{cat.isActive ? "启用" : "禁用"}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => { setDeleting(cat); setDeleteDialogOpen(true); }} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "编辑分类" : "新建分类"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs defaultValue="zh">
              <TabsList><TabsTrigger value="zh">中文</TabsTrigger><TabsTrigger value="en">English</TabsTrigger></TabsList>
              {(["zh", "en"] as const).map((lang) => (
                <TabsContent key={lang} value={lang} className="space-y-3 mt-3">
                  <div className="space-y-1.5">
                    <Label>名称 {lang === "zh" && <span className="text-red-500">*</span>}</Label>
                    <Input value={form.names[lang]} onChange={(e) => handleNameChange(lang, e.target.value)} placeholder={lang === "zh" ? "例如：面板灯" : "e.g. Panel Light"} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>描述</Label>
                    <Input value={form.descriptions[lang]} onChange={(e) => setForm((p) => ({ ...p, descriptions: { ...p.descriptions, [lang]: e.target.value } }))} />
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <div className="space-y-1.5">
              <Label>Slug <span className="text-red-500">*</span></Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="panel-light" />
            </div>

            <div className="space-y-1.5">
              <Label>上级分类</Label>
              <Select value={form.parentId || "none"} onValueChange={(v) => v && setForm({ ...form, parentId: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="无" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无（顶级分类）</SelectItem>
                  {categories.filter((c) => c.id !== editing?.id).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{getCatName(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>排序</Label>
                <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                <Label>启用</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button type="submit" disabled={loading}>{loading ? "保存中..." : "保存"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="删除分类" description={`确定删除「${deleting ? getCatName(deleting) : ""}」？`} onConfirm={handleDelete} loading={loading} />
    </div>
  );
}
