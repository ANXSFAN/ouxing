import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "在线询价",
  description: "提交您的产品需求清单，销售工程师将在 1–2 个工作日内通过邮箱回复方案与报价。",
};

export default function InquiryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
