import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="bg-neutral-900 text-neutral-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <Image
                src="/logo.jpg"
                alt="欧星"
                width={150}
                height={26}
                className="h-6 w-auto brightness-0 invert opacity-80"
                unoptimized
              />
            </div>
            <p className="text-sm text-neutral-500 leading-relaxed">
              专业LED照明产品制造商，提供面板灯、筒灯、射灯等全系列LED产品。
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-4">
              快速导航
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: "/products", label: "产品中心" },
                { href: "/about", label: "关于我们" },
                { href: "/inquiry", label: "在线询价" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-500 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Product Lines */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-4">
              产品系列
            </h4>
            <ul className="space-y-2.5 text-sm text-neutral-500">
              <li>面板灯 / 筒灯</li>
              <li>射灯 / 灯管</li>
              <li>灯带 / 工矿灯</li>
              <li>投光灯 / 路灯</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-4">
              联系我们
            </h4>
            <ul className="space-y-3">
              {[
                { icon: Mail, text: "info@ouxing.com" },
                { icon: Phone, text: "+86 755-1234-5678" },
                { icon: MapPin, text: "广东省深圳市宝安区" },
              ].map((item) => (
                <li
                  key={item.text}
                  className="flex items-center gap-2.5 text-sm text-neutral-500"
                >
                  <div className="w-8 h-8 border border-neutral-700 rounded-lg flex items-center justify-center shrink-0">
                    <item.icon className="w-3.5 h-3.5" />
                  </div>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-neutral-800 text-xs text-neutral-600 text-center">
          &copy; {new Date().getFullYear()} 欧星. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
