"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { INQUIRY_STATUS_LABELS } from "@/lib/constants";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Loader2,
  Save,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface InquiryDetail {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  message: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  products: {
    quantity: number | null;
    expectedPrice: string | null;
    product: {
      id: string;
      content: Record<string, { name?: string }>;
      modelNumber: string;
      category: { content: Record<string, { name?: string }> } | null;
      images: { url: string }[];
    };
  }[];
}

export default function InquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    fetch(`/api/inquiries/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setInquiry(data);
        setStatus(data.status);
        setAdminNotes(data.adminNotes || "");
        setLoading(false);
      });
  }, [params.id]);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/inquiries/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNotes }),
    });

    if (res.ok) {
      toast.success("已保存");
    } else {
      toast.error("保存失败");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!inquiry) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/inquiries">
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">询价详情</h1>
        </div>
        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
          >
            <Link href={`/admin/quotes/new?inquiry=${inquiry.id}`}>
              <FileText className="w-4 h-4 mr-2" />
              生成报价
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            保存
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">客户信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-sm">{inquiry.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-sm">{inquiry.email}</span>
            </div>
            {inquiry.company && (
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="text-sm">{inquiry.company}</span>
              </div>
            )}
            {inquiry.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-sm">{inquiry.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">
                {format(new Date(inquiry.createdAt), "yyyy-MM-dd HH:mm")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Message */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">询价内容</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
              {inquiry.message}
            </p>

            {/* Products */}
            {inquiry.products.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-medium text-slate-900 mb-3">
                  关联产品
                </h4>
                <div className="space-y-2">
                  {inquiry.products.map((p) => {
                    const pName = (p.product.content as Record<string, { name?: string }>)?.zh?.name
                      || (p.product.content as Record<string, { name?: string }>)?.en?.name
                      || p.product.modelNumber;
                    const catName = p.product.category
                      ? ((p.product.category.content as Record<string, { name?: string }>)?.zh?.name || "")
                      : "";
                    const imgUrl = p.product.images?.[0]?.url;
                    return (
                      <div
                        key={p.product.id}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="w-14 h-14 rounded-lg bg-white border border-slate-100 relative overflow-hidden shrink-0">
                          {imgUrl ? (
                            <Image src={imgUrl} alt={pName} fill className="object-contain p-1" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">无图</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{pName}</p>
                          <p className="text-xs text-slate-500">
                            {p.product.modelNumber}{catName ? ` · ${catName}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {p.expectedPrice && (
                            <Badge variant="outline" className="text-amber-600 border-amber-200">
                              期望 ¥{parseFloat(p.expectedPrice).toFixed(2)}
                            </Badge>
                          )}
                          {p.quantity && (
                            <Badge variant="secondary">x{p.quantity}</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">处理状态</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={status} onValueChange={(v) => v && setStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INQUIRY_STATUS_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">管理员备注</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="添加内部备注..."
              rows={3}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
