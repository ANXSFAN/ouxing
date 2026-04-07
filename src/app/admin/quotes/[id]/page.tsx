"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QUOTE_STATUS_LABELS } from "@/lib/constants";
import {
  ArrowLeft,
  Download,
  Loader2,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface QuoteDetail {
  id: string;
  quoteNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerCompany: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  title: string | null;
  notes: string | null;
  validDays: number;
  currency: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  status: string;
  createdAt: string;
  createdBy: { name: string };
  items: {
    id: string;
    productName: string;
    productModel: string;
    specification: string | null;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    notes: string | null;
  }[];
}

export default function QuoteDetailPage() {
  const params = useParams();
  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadingQuoteZh, setDownloadingQuoteZh] = useState(false);
  const [downloadingQuoteEn, setDownloadingQuoteEn] = useState(false);
  const [downloadingPackZh, setDownloadingPackZh] = useState(false);
  const [downloadingPackEn, setDownloadingPackEn] = useState(false);

  useEffect(() => {
    fetch(`/api/quotes/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setQuote(data);
        setLoading(false);
      });
  }, [params.id]);

  const updateStatus = async (status: string) => {
    const res = await fetch(`/api/quotes/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setQuote((prev) => prev ? { ...prev, status } : null);
      toast.success("状态已更新");
    }
  };

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/quotes/${params.id}/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${quote?.quoteNumber || "quote"}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        toast.error("PDF生成失败");
      }
    } catch {
      toast.error("下载失败");
    }
    setDownloading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!quote) return null;

  const currencySymbol = quote.currency === "CNY" ? "¥" : "$";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/quotes"><ArrowLeft className="w-4 h-4 mr-1" />返回</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{quote.quoteNumber}</h1>
            {quote.title && <p className="text-slate-500">{quote.title}</p>}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={quote.status} onValueChange={(v) => v && updateStatus(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(QUOTE_STATUS_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild variant="outline">
            <Link href={`/admin/quotes/${params.id}/edit`}>
              <Pencil className="w-4 h-4 mr-2" />编辑
            </Link>
          </Button>
          <Button onClick={downloadPdf} disabled={downloading} variant="outline">
            {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            PDF
          </Button>
          <Button
            variant="outline"
            disabled={downloadingQuoteZh}
            onClick={async () => {
              setDownloadingQuoteZh(true);
              try {
                const res = await fetch(`/api/quotes/${params.id}/excel?lang=zh`);
                if (res.ok) {
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${quote?.quoteNumber || "quote"}-quotation-zh.xlsx`;
                  a.click();
                  URL.revokeObjectURL(url);
                } else toast.error("报价单生成失败");
              } catch { toast.error("下载失败"); }
              setDownloadingQuoteZh(false);
            }}
          >
            {downloadingQuoteZh ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            报价单(中)
          </Button>
          <Button
            variant="outline"
            disabled={downloadingQuoteEn}
            onClick={async () => {
              setDownloadingQuoteEn(true);
              try {
                const res = await fetch(`/api/quotes/${params.id}/excel?lang=en`);
                if (res.ok) {
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${quote?.quoteNumber || "quote"}-quotation-en.xlsx`;
                  a.click();
                  URL.revokeObjectURL(url);
                } else toast.error("报价单生成失败");
              } catch { toast.error("下载失败"); }
              setDownloadingQuoteEn(false);
            }}
          >
            {downloadingQuoteEn ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            报价单(EN)
          </Button>
          <Button
            variant="outline"
            disabled={downloadingPackZh}
            onClick={async () => {
              setDownloadingPackZh(true);
              try {
                const res = await fetch(`/api/quotes/${params.id}/packing-list?lang=zh`);
                if (res.ok) {
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${quote?.quoteNumber || "quote"}-packing-zh.xlsx`;
                  a.click();
                  URL.revokeObjectURL(url);
                } else toast.error("箱单生成失败");
              } catch { toast.error("下载失败"); }
              setDownloadingPackZh(false);
            }}
          >
            {downloadingPackZh ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            箱单(中)
          </Button>
          <Button
            variant="outline"
            disabled={downloadingPackEn}
            onClick={async () => {
              setDownloadingPackEn(true);
              try {
                const res = await fetch(`/api/quotes/${params.id}/packing-list?lang=en`);
                if (res.ok) {
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${quote?.quoteNumber || "quote"}-packing-en.xlsx`;
                  a.click();
                  URL.revokeObjectURL(url);
                } else toast.error("箱单生成失败");
              } catch { toast.error("下载失败"); }
              setDownloadingPackEn(false);
            }}
          >
            {downloadingPackEn ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            箱单(EN)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <Card>
          <CardHeader><CardTitle className="text-base">客户信息</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3"><User className="w-4 h-4 text-slate-400" /><span className="text-sm">{quote.customerName}</span></div>
            {quote.customerCompany && <div className="flex items-center gap-3"><Building2 className="w-4 h-4 text-slate-400" /><span className="text-sm">{quote.customerCompany}</span></div>}
            {quote.customerEmail && <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-slate-400" /><span className="text-sm">{quote.customerEmail}</span></div>}
            {quote.customerPhone && <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-slate-400" /><span className="text-sm">{quote.customerPhone}</span></div>}
            {quote.customerAddress && <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-slate-400 mt-0.5" /><span className="text-sm">{quote.customerAddress}</span></div>}
          </CardContent>
        </Card>

        {/* Quote Info */}
        <Card>
          <CardHeader><CardTitle className="text-base">报价信息</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-slate-400" /><span className="text-sm">{format(new Date(quote.createdAt), "yyyy-MM-dd")}</span></div>
            <div className="flex justify-between"><span className="text-sm text-slate-500">有效期</span><span className="text-sm">{quote.validDays} 天</span></div>
            <div className="flex justify-between"><span className="text-sm text-slate-500">创建人</span><span className="text-sm">{quote.createdBy.name}</span></div>
            <div className="flex justify-between"><span className="text-sm text-slate-500">状态</span><Badge>{QUOTE_STATUS_LABELS[quote.status]}</Badge></div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardHeader><CardTitle className="text-base">金额汇总</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-slate-500">小计</span><span className="text-sm">{currencySymbol}{parseFloat(quote.subtotal).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</span></div>
            {parseFloat(quote.discount) > 0 && <div className="flex justify-between"><span className="text-sm text-slate-500">折扣</span><span className="text-sm text-red-500">-{currencySymbol}{parseFloat(quote.discount).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</span></div>}
            {parseFloat(quote.tax) > 0 && <div className="flex justify-between"><span className="text-sm text-slate-500">税额</span><span className="text-sm">{currencySymbol}{parseFloat(quote.tax).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</span></div>}
            <div className="flex justify-between pt-3 border-t"><span className="font-bold">总计</span><span className="text-xl font-bold text-amber-600">{currencySymbol}{parseFloat(quote.total).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">产品明细</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>产品名称</TableHead>
                <TableHead>型号</TableHead>
                <TableHead className="text-right">数量</TableHead>
                <TableHead className="text-right">单价</TableHead>
                <TableHead className="text-right">小计</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quote.items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="text-slate-500">{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="text-slate-500">{item.productModel}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{currencySymbol}{parseFloat(item.unitPrice).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">{currencySymbol}{parseFloat(item.totalPrice).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Notes */}
      {quote.notes && (
        <Card>
          <CardHeader><CardTitle className="text-base">备注</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 whitespace-pre-line">{quote.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
