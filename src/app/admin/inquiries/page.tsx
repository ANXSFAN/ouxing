"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MessageSquare, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { INQUIRY_STATUS_LABELS } from "@/lib/constants";
import { format } from "date-fns";
import { toast } from "sonner";

type ContentJson = Record<string, { name?: string }>;
function pName(c: unknown) { const v = c as ContentJson | null; return v?.zh?.name || v?.en?.name || ""; }

interface Inquiry {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  phone: string | null;
  status: string;
  createdAt: string;
  products: { product: { content: unknown; modelNumber: string } }[];
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  PROCESSING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  QUOTED: "bg-green-500/10 text-green-500 border-green-500/20",
  CLOSED: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(() => {
    const params = new URLSearchParams({
      page: String(page),
      ...(statusFilter && { status: statusFilter }),
    });
    fetch(`/api/inquiries?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setInquiries(data.inquiries);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      });
  }, [page, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    const res = await fetch(`/api/inquiries/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("询价已删除");
      fetchData();
    } else {
      toast.error("删除失败");
    }
    setDeleteId(null);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="询价管理"
        description={`共 ${total} 条询价`}
      />

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={(v: string | null) => { setStatusFilter(v === "all" || !v ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            {Object.entries(INQUIRY_STATUS_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {inquiries.length === 0 ? (
        <EmptyState icon={MessageSquare} title="暂无询价" description="客户提交的询价将显示在这里" />
      ) : (
        <>
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>公司</TableHead>
                  <TableHead>电话</TableHead>
                  <TableHead>产品</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map((inquiry) => (
                  <TableRow key={inquiry.id}>
                    <TableCell className="font-medium">{inquiry.company || "-"}</TableCell>
                    <TableCell className="text-slate-500">{inquiry.phone || "-"}</TableCell>
                    <TableCell>
                      {inquiry.products.length > 0 ? (
                        <span className="text-sm text-slate-600">
                          {inquiry.products.map((p) => pName(p.product.content) || p.product.modelNumber).join(", ")}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[inquiry.status]}>
                        {INQUIRY_STATUS_LABELS[inquiry.status] || inquiry.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {format(new Date(inquiry.createdAt), "MM-dd HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/inquiries/${inquiry.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(inquiry.id)}
                          className="text-red-600"
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">第 {page} / {totalPages} 页</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
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
        title="删除询价"
        description="确定要删除这条询价记录吗？"
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
}
