"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Plus, Pencil, Trash2, Package, Search, ChevronLeft, ChevronRight, FileDown, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface Product {
  id: string;
  slug: string;
  modelNumber: string;
  content: Record<string, { name?: string; description?: string }>;
  isActive: boolean;
  isFeatured: boolean;
  category: { id: string; content: Record<string, { name?: string }> } | null;
  images: { url: string }[];
  createdAt: string;
}

function getProductName(p: Product) {
  return p.content?.zh?.name || p.content?.en?.name || p.modelNumber;
}
function getCatName(cat: { content: Record<string, { name?: string }> } | null) {
  if (!cat) return "-";
  return cat.content?.zh?.name || cat.content?.en?.name || "-";
}

interface Category {
  id: string;
  content: Record<string, { name?: string }>;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [jumpValue, setJumpValue] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);

  const fetchProducts = useCallback(() => {
    setFetching(true);
    setFetchError("");
    const params = new URLSearchParams({
      page: String(page),
      all: "true",
      ...(search && { search }),
      ...(categoryFilter && { category: categoryFilter }),
    });
    fetch(`/api/products?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("产品列表加载失败");
        return res.json();
      })
      .then((data) => {
        setProducts(data.products);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setSelectedIds(new Set());
      })
      .catch((error: Error) => setFetchError(error.message))
      .finally(() => setFetching(false));
  }, [page, search, categoryFilter]);

  useEffect(() => {
    const timer = window.setTimeout(fetchProducts, 300);
    return () => window.clearTimeout(timer);
  }, [fetchProducts]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories);
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    const res = await fetch(`/api/products/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("产品已删除");
      fetchProducts();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "删除失败", { duration: 6000 });
    }
    setDeleteId(null);
    setLoading(false);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleJump = () => {
    const target = Number(jumpValue);
    if (!Number.isInteger(target) || target < 1 || target > totalPages) {
      toast.error(`请输入 1 - ${totalPages} 之间的页码`);
      return;
    }
    setPage(target);
    setJumpValue("");
  };

  const handleBatchStatus = async (isActive: boolean) => {
    if (selectedIds.size === 0) return;
    setBatchLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selectedIds], isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "批量操作失败");
      toast.success(`已${isActive ? "上架" : "下架"} ${data.updated} 个产品`);
      fetchProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "批量操作失败");
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="产品管理"
        description={`共 ${total} 个产品`}
        action={
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="w-4 h-4 mr-2" />
              新建产品
            </Link>
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="搜索产品名称或型号..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v: string | null) => { setCategoryFilter(v === "all" || !v ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="全部分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {getCatName(cat)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {selectedIds.size > 0 && !fetching && !fetchError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-sm text-slate-600">已选择 <strong className="text-slate-900">{selectedIds.size}</strong> 个产品</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={batchLoading} onClick={() => handleBatchStatus(false)}>批量下架</Button>
            <Button size="sm" disabled={batchLoading} onClick={() => handleBatchStatus(true)}>批量上架</Button>
          </div>
        </div>
      )}
      {fetching ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white" aria-label="正在加载产品">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 border-b border-slate-100 p-4 last:border-0">
              <div className="h-12 w-12 animate-pulse rounded-md bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : fetchError ? (
        <div className="rounded-lg border border-red-200 bg-white px-6 py-10 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-3 font-medium text-slate-900">无法加载产品</p>
          <p className="mt-1 text-sm text-slate-500">请检查网络或服务状态后重试。</p>
          <Button variant="outline" className="mt-4" onClick={fetchProducts}>
            <RefreshCw className="mr-2 h-4 w-4" />重新加载
          </Button>
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="暂无产品"
          description="创建你的第一个产品"
          action={
            <Button asChild>
              <Link href="/admin/products/new">
                <Plus className="w-4 h-4 mr-2" />
                新建产品
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              <Checkbox
                aria-label="选择本页全部产品"
                checked={products.length > 0 && selectedIds.size === products.length}
                onCheckedChange={(checked) => setSelectedIds(checked ? new Set(products.map((product) => product.id)) : new Set())}
              />
              选择本页全部产品
            </label>
            {products.map((product) => (
              <article key={product.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex gap-3">
                  <Checkbox
                    className="mt-1"
                    aria-label={`选择${getProductName(product)}`}
                    checked={selectedIds.has(product.id)}
                    onCheckedChange={(checked) => setSelectedIds((current) => {
                      const next = new Set(current);
                      if (checked) next.add(product.id); else next.delete(product.id);
                      return next;
                    })}
                  />
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
                    {product.images[0] ? (
                      <Image src={product.images[0].url} alt={getProductName(product)} fill className="object-contain" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><Package className="h-5 w-5 text-slate-300" /></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/products/${product.id}/edit`} className="line-clamp-2 font-medium text-slate-900">
                      {getProductName(product)}
                    </Link>
                    <p className="mt-1 font-mono text-xs text-slate-500">{product.modelNumber}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant={product.isActive ? "default" : "secondary"}>{product.isActive ? "上架" : "下架"}</Badge>
                      <Badge variant="secondary">{getCatName(product.category)}</Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/api/products/${product.id}/datasheet?lang=zh`} target="_blank" rel="noopener noreferrer"><FileDown className="mr-1 h-4 w-4" />规格书</a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/products/${product.id}/edit`}><Pencil className="mr-1 h-4 w-4" />编辑</Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteId(product.id)} className="text-red-600"><Trash2 className="mr-1 h-4 w-4" />删除</Button>
                </div>
              </article>
            ))}
          </div>
          <div className="hidden bg-white rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      aria-label="选择本页全部产品"
                      checked={products.length > 0 && selectedIds.size === products.length}
                      onCheckedChange={(checked) => setSelectedIds(checked ? new Set(products.map((product) => product.id)) : new Set())}
                    />
                  </TableHead>
                  <TableHead className="w-16">图片</TableHead>
                  <TableHead>产品名称</TableHead>
                  <TableHead>型号</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Checkbox
                        aria-label={`选择${getProductName(product)}`}
                        checked={selectedIds.has(product.id)}
                        onCheckedChange={(checked) => setSelectedIds((current) => {
                          const next = new Set(current);
                          if (checked) next.add(product.id); else next.delete(product.id);
                          return next;
                        })}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0].url}
                            alt={getProductName(product)}
                            width={48}
                            height={48}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-slate-300" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{getProductName(product)}</p>
                        {product.isFeatured && (
                          <Badge variant="outline" className="mt-1 text-amber-600 border-amber-200">
                            精选
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {product.modelNumber}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getCatName(product.category)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? "上架" : "下架"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild title="下载规格书（中文）">
                          <a href={`/api/products/${product.id}/datasheet?lang=zh`} target="_blank" rel="noopener noreferrer">
                            <FileDown className="w-4 h-4" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Pencil className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(product.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                第 {page} / {totalPages} 页，共 {total} 条
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <div className="hidden items-center gap-1.5 text-sm text-slate-500 sm:flex">
                  <span>跳至</span>
                  <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpValue}
                    onChange={(e) => setJumpValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleJump()}
                    className="w-16 h-8 text-center"
                  />
                  <span>页</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleJump}>
                  确定
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="删除产品"
        description="确定要删除这个产品吗？关联的图片、文档和证书也会被删除。此操作不可撤销。"
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
}
