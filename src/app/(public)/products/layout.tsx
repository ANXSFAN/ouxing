import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "全部产品",
  description:
    "浏览欧星全系 LED 照明产品：面板灯、筒灯、射灯、灯管、工矿灯，支持按参数筛选并在线询价。",
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
