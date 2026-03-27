"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Plus, Pencil, Trash2, Star, SlidersHorizontal, Tags } from "lucide-react";
import { toast } from "sonner";

interface Attribute {
  id: string;
  key: string;
  name: Record<string, string>;
  type: string;
  unit: string | null;
  scope: string;
  isHighlight: boolean;
  isFilterable: boolean;
  sortOrder: number;
  isPinned: boolean;
  options: { id: string; value: string; color: string | null }[];
}

export default function AttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(() => {
    fetch("/api/attributes")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setAttributes(data);
        else console.error("Unexpected response:", data);
      })
      .catch((err) => console.error("Failed to fetch attributes:", err));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const highlighted = attributes.filter((a) => a.isHighlight);
  const filterable = attributes.filter((a) => a.isFilterable);
  const regular = attributes.filter((a) => !a.isHighlight && !a.isFilterable);

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    const res = await fetch(`/api/attributes/${deleteId}`, { method: "DELETE" });
    if (res.ok) { toast.success("属性已删除"); fetchData(); }
    else toast.error("删除失败");
    setDeleteId(null);
    setLoading(false);
  };

  const typeLabel: Record<string, string> = { TEXT: "文本", NUMBER: "数字", SELECT: "选择" };
  const scopeLabel: Record<string, string> = { PRODUCT: "产品", VARIANT: "变体" };

  const renderTable = (title: string, icon: React.ReactNode, items: Attribute[], color: string) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h3 className="text-sm font-semibold text-slate-700">{title} ({items.length})</h3>
        </div>
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>名称(中)</TableHead>
                <TableHead>名称(英)</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>单位</TableHead>
                <TableHead>作用域</TableHead>
                <TableHead>选项数</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((attr) => (
                <TableRow key={attr.id}>
                  <TableCell>
                    <span className="font-mono text-sm">{attr.key}</span>
                    <div className="flex gap-1 mt-1">
                      {attr.isHighlight && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">高亮</span>}
                      {attr.isFilterable && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">可筛选</span>}
                    </div>
                  </TableCell>
                  <TableCell>{attr.name.zh || "-"}</TableCell>
                  <TableCell className="text-slate-500">{attr.name.en || "-"}</TableCell>
                  <TableCell><Badge variant="secondary">{typeLabel[attr.type] || attr.type}</Badge></TableCell>
                  <TableCell className="text-slate-500">{attr.unit || "-"}</TableCell>
                  <TableCell><Badge variant="outline">{scopeLabel[attr.scope] || attr.scope}</Badge></TableCell>
                  <TableCell>{attr.type === "SELECT" ? attr.options.length : "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/attributes/${attr.id}`}><Pencil className="w-4 h-4" /></Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(attr.id)} className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="属性管理"
        description="管理产品的技术参数属性定义"
        action={<Button asChild><Link href="/admin/attributes/new"><Plus className="w-4 h-4 mr-2" />新建属性</Link></Button>}
      />

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-amber-50 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
            <Star className="h-4 w-4" /> 高亮属性
          </div>
          <p className="mt-1 text-2xl font-bold text-amber-900">{highlighted.length}</p>
        </div>
        <div className="rounded-lg border bg-blue-50 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
            <SlidersHorizontal className="h-4 w-4" /> 可筛选
          </div>
          <p className="mt-1 text-2xl font-bold text-blue-900">{filterable.length}</p>
        </div>
        <div className="rounded-lg border bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <Tags className="h-4 w-4" /> 普通属性
          </div>
          <p className="mt-1 text-2xl font-bold text-slate-800">{regular.length}</p>
        </div>
      </div>

      {attributes.length === 0 ? (
        <EmptyState icon={Tags} title="暂无属性" description="创建产品技术参数的属性定义" action={<Button asChild><Link href="/admin/attributes/new"><Plus className="w-4 h-4 mr-2" />新建属性</Link></Button>} />
      ) : (
        <>
          {renderTable("高亮属性", <Star className="h-4 w-4 text-amber-600" />, highlighted, "amber")}
          {renderTable("可筛选属性", <SlidersHorizontal className="h-4 w-4 text-blue-600" />, filterable, "blue")}
          {renderTable("普通属性", <Tags className="h-4 w-4 text-slate-500" />, regular, "slate")}
        </>
      )}

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="删除属性" description="确定删除此属性？关联的选项也会被删除。" onConfirm={handleDelete} loading={loading} />
    </div>
  );
}
