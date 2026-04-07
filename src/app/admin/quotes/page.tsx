"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
import { FileText, Plus, Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { QUOTE_STATUS_LABELS } from "@/lib/constants";
import { format } from "date-fns";
import { toast } from "sonner";

interface Quote {
  id: string;
  quoteNumber: string;
  customerName: string;
  customerCompany: string | null;
  total: string;
  currency: string;
  status: string;
  createdAt: string;
  createdBy: { name: string };
  items: { id: string }[];
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-blue-100 text-blue-600",
  ACCEPTED: "bg-green-100 text-green-600",
  REJECTED: "bg-red-100 text-red-600",
  EXPIRED: "bg-zinc-100 text-zinc-600",
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(() => {
    fetch(`/api/quotes?page=${page}`)
      .then((res) => res.json())
      .then((data) => {
        setQuotes(data.quotes);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      });
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    const res = await fetch(`/api/quotes/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("报价单已删除");
      fetchData();
    }
    setDeleteId(null);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="报价管理"
        description={`共 ${total} 条报价`}
        action={
          <Button asChild>
            <Link href="/admin/quotes/new">
              <Plus className="w-4 h-4 mr-2" />
              新建报价
            </Link>
          </Button>
        }
      />

      {quotes.length === 0 ? (
        <EmptyState icon={FileText} title="暂无报价" description="创建你的第一个报价单" action={<Button asChild><Link href="/admin/quotes/new"><Plus className="w-4 h-4 mr-2" />新建报价</Link></Button>} />
      ) : (
        <>
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>报价编号</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>产品数</TableHead>
                  <TableHead>总金额</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-mono text-sm">{quote.quoteNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{quote.customerName}</p>
                        {quote.customerCompany && <p className="text-xs text-slate-500">{quote.customerCompany}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{quote.items.length}</TableCell>
                    <TableCell className="font-medium">
                      {quote.currency === "CNY" ? "¥" : "$"}
                      {parseFloat(quote.total).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[quote.status]}>
                        {QUOTE_STATUS_LABELS[quote.status] || quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {format(new Date(quote.createdAt), "MM-dd HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/quotes/${quote.id}`}><Eye className="w-4 h-4" /></Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/quotes/${quote.id}/edit`}><Pencil className="w-4 h-4" /></Link>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(quote.id)} className="text-red-600">
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
                <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="删除报价单" description="确定要删除这个报价单吗？" onConfirm={handleDelete} loading={loading} />
    </div>
  );
}
