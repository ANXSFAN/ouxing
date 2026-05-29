import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const sans = Inter_Tight({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "欧星 OUXING — 专业LED照明产品",
  description:
    "欧星提供高品质LED面板灯、筒灯、射灯、灯管等照明产品，涵盖商业照明、工业照明等多种应用场景。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${sans.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased text-neutral-900 bg-white">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
