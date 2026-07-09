import Link from "next/link";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1d1d1f]">
      <PublicNavbar />
      <main className="flex-1 flex items-center justify-center px-4 py-24 text-center">
        <div>
          <p className="text-base text-[#86868b] mb-3">404</p>
          <h1 className="headline-xl text-4xl md:text-6xl mb-4">页面不存在</h1>
          <p className="text-[15px] md:text-[17px] text-[#6e6e73] mb-8">
            您访问的页面可能已被移动或删除。
          </p>
          <div className="flex flex-wrap justify-center gap-x-7 gap-y-3 items-center">
            <Link href="/" className="appbtn">返回首页</Link>
            <Link href="/products" className="applink">浏览产品</Link>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
