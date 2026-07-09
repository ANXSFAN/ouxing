import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

const footerCols: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "产品",
    links: [
      { label: "全部产品", href: "/products" },
      { label: "面板灯", href: "/products?category=panel" },
      { label: "筒灯", href: "/products?category=downlight" },
      { label: "射灯", href: "/products?category=spotlight" },
      { label: "灯管", href: "/products?category=tube" },
    ],
  },
  {
    title: "公司",
    links: [
      { label: "关于我们", href: "/about" },
      { label: "在线询价", href: "/inquiry" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="bg-[#f5f5f7] text-[#6e6e73] text-[12px] leading-[1.5]">
      <div className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-8 border-b border-black/10">
          <div className="col-span-2 md:col-span-2">
            <p className="text-[#1d1d1f] font-semibold text-[13px] mb-3">{siteConfig.name}</p>
            <p className="text-[12px] leading-relaxed max-w-xs">
              专业 LED 照明产品制造商，远销 {siteConfig.stats.exportCountries} 国家。
            </p>
            <p className="mt-4 text-[12px]">
              <a href={`mailto:${siteConfig.contact.email}`} className="hover:underline underline-offset-4">
                {siteConfig.contact.email}
              </a>
            </p>
            {siteConfig.contact.phone && (
              <p className="text-[12px]">
                <a
                  href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`}
                  className="hover:underline underline-offset-4"
                >
                  {siteConfig.contact.phone}
                </a>
              </p>
            )}
          </div>

          {footerCols.map((col) => (
            <div key={col.title}>
              <p className="text-[#1d1d1f] font-semibold text-[13px] mb-3">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label + l.href}>
                    <Link
                      href={l.href}
                      className="hover:underline underline-offset-4 transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap text-[11px]">
            <span className="text-[#86868b]">国际认证</span>
            {siteConfig.certs.map((c, i) => (
              <span key={c} className="flex items-center gap-3">
                <span>{c}</span>
                {i < siteConfig.certs.length - 1 && <span className="text-[#d2d2d7]">·</span>}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-[#86868b]">
            © {new Date().getFullYear()} {siteConfig.name}. 保留所有权利.
          </p>
        </div>
      </div>
    </footer>
  );
}
