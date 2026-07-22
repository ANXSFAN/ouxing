"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, FolderTree, MessageSquare, FileText, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { INQUIRY_STATUS_LABELS } from "@/lib/constants";
import { format } from "date-fns";

interface DashboardStats {
  productCount: number;
  categoryCount: number;
  pendingInquiries: number;
  totalInquiries: number;
  quoteCount: number;
  recentInquiries: {
    id: string;
    name: string;
    company: string | null;
    status: string;
    createdAt: string;
  }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  const loadStats = () => {
    setError("");
    fetch("/api/dashboard/stats")
      .then((res) => {
        if (!res.ok) throw new Error("仪表盘加载失败");
        return res.json();
      })
      .then(setStats)
      .catch((err: Error) => setError(err.message));
  };

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => {
        if (!res.ok) throw new Error("仪表盘加载失败");
        return res.json();
      })
      .then(setStats)
      .catch((err: Error) => setError(err.message));
  }, []);

  const statCards = [
    {
      label: "在线产品",
      value: stats?.productCount ?? "-",
      icon: Package,
      href: "/admin/products",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "产品分类",
      value: stats?.categoryCount ?? "-",
      icon: FolderTree,
      href: "/admin/categories",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "待处理询价",
      value: stats?.pendingInquiries ?? "-",
      icon: MessageSquare,
      href: "/admin/inquiries",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "报价单总数",
      value: stats?.quoteCount ?? "-",
      icon: FileText,
      href: "/admin/quotes",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">仪表盘</h1>
        <p className="text-slate-500 mt-1">欢迎回来，查看系统概览</p>
      </div>

      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            暂时无法获取经营数据，请重新加载。
          </div>
          <Button variant="outline" size="sm" onClick={loadStats}>
            <RefreshCw className="mr-2 h-4 w-4" />重新加载
          </Button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="transition-shadow hover:shadow-sm">
            <Link href={card.href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {card.label}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {/* Recent Inquiries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5" />
            最近询价
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!stats?.recentInquiries?.length ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              暂无询价记录
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentInquiries.map((inquiry) => (
                <Link
                  key={inquiry.id}
                  href={`/admin/inquiries/${inquiry.id}`}
                  className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {inquiry.name}
                      {inquiry.company && (
                        <span className="text-slate-500 font-normal ml-2">
                          {inquiry.company}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-slate-500">
                      {format(new Date(inquiry.createdAt), "yyyy-MM-dd HH:mm")}
                    </p>
                  </div>
                  <Badge
                    variant={
                      inquiry.status === "PENDING" ? "destructive" : "secondary"
                    }
                  >
                    {INQUIRY_STATUS_LABELS[inquiry.status] || inquiry.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
