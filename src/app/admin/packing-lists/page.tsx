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
import { Package, Download, Eye, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
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

export default function PackingListsPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

  const downloadPackingList = async (quoteId: string, quoteNumber: string, lang: "zh" | "en") => {
    setDownloadingId(`${quoteId}-${lang}`);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/packing-list?lang=${lang}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${quoteNumber}-packing-list-${lang}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        toast.error("箱单生成失败");
      }
    } catch {
      toast.error("下载失败");
    }
    setDownloadingId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="箱单管理"
        description={`共 ${total} 条记录`}
      />

      {quotes.length === 0 ? (
        <EmptyState icon={Package} title="暂无箱单" description="请先创建报价单" />
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
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={downloadingId === `${quote.id}-zh`}
                          onClick={() => downloadPackingList(quote.id, quote.quoteNumber, "zh")}
                        >
                          {downloadingId === `${quote.id}-zh` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                          <span className="ml-1 text-xs">中</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={downloadingId === `${quote.id}-en`}
                          onClick={() => downloadPackingList(quote.id, quote.quoteNumber, "en")}
                        >
                          {downloadingId === `${quote.id}-en` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                          <span className="ml-1 text-xs">EN</span>
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
    </div>
  );
}
