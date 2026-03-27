"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, FolderTree, MessageSquare, FileText, Clock } from "lucide-react";
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

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then(setStats);
  }, []);

  const statCards = [
    {
      label: "在线产品",
      value: stats?.productCount ?? "-",
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "产品分类",
      value: stats?.categoryCount ?? "-",
      icon: FolderTree,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "待处理询价",
      value: stats?.pendingInquiries ?? "-",
      icon: MessageSquare,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "报价单总数",
      value: stats?.quoteCount ?? "-",
      icon: FileText,
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label}>
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
                <div
                  key={inquiry.id}
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
