import Link from "next/link";
import { Mail } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

const columns = [
  { title: "产品", links: [{ label: "全部产品", href: "/products" }, { label: "面板灯", href: "/products?category=panel" }, { label: "筒灯", href: "/products?category=downlight" }, { label: "工矿灯", href: "/products?category=highbay" }] },
  { title: "公司", links: [{ label: "关于我们", href: "/about" }, { label: "在线询价", href: "/inquiry" }] },
];

export function PublicFooter() {
  return <footer className="bg-[#152029] text-white/65"><div className="site-wrap py-12 md:py-16">
    <div className="grid gap-10 border-b border-white/10 pb-12 md:grid-cols-[1.5fr_.7fr_.7fr]">
      <div><p className="text-xl font-bold text-white">FactorLED</p><p className="mt-4 max-w-md text-sm leading-7">{siteConfig.description}</p><div className="mt-6 space-y-3 text-sm"><a href={`mailto:${siteConfig.contact.email}`} className="flex items-center gap-3 hover:text-white"><Mail className="h-4 w-4" />{siteConfig.contact.email}</a></div></div>
      {columns.map((column) => <div key={column.title}><p className="text-sm font-semibold text-white">{column.title}</p><ul className="mt-5 space-y-3 text-sm">{column.links.map((link) => <li key={link.href + link.label}><Link href={link.href} className="hover:text-white">{link.label}</Link></li>)}</ul></div>)}
    </div>
    <div className="flex flex-col justify-between gap-4 pt-6 text-xs sm:flex-row sm:items-center"><p>© {new Date().getFullYear()} {siteConfig.name}. 保留所有权利。</p><p>认证：{siteConfig.certs.join(" · ")}</p></div>
  </div></footer>;
}
