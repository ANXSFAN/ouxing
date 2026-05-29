import Link from "next/link";

const footerCols: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "购物",
    links: [
      { label: "全部产品", href: "/products" },
      { label: "面板灯", href: "/products?category=panel" },
      { label: "筒灯 / 射灯", href: "/products?category=downlight" },
      { label: "在线询价", href: "/inquiry" },
    ],
  },
  {
    title: "公司",
    links: [
      { label: "关于我们", href: "/about" },
      { label: "认证资质", href: "/about" },
      { label: "工厂展示", href: "/about" },
      { label: "联系我们", href: "/inquiry" },
    ],
  },
  {
    title: "支持",
    links: [
      { label: "产品资料", href: "/products" },
      { label: "技术参数", href: "/products" },
      { label: "保修政策", href: "/inquiry" },
      { label: "OEM/ODM", href: "/inquiry" },
    ],
  },
];

const certs = ["CE", "UL", "RoHS", "SAA", "DLC", "ISO 9001"];

export function PublicFooter() {
  return (
    <footer className="bg-[#f5f5f7] text-[#6e6e73] text-[12px] leading-[1.5]">
      <div className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-8 border-b border-black/10">
          <div className="col-span-2 md:col-span-1">
            <p className="text-[#1d1d1f] font-semibold text-[13px] mb-3">欧星照明</p>
            <p className="text-[12px] leading-relaxed max-w-xs">
              专业 LED 照明产品制造商，远销 50+ 国家。
            </p>
            <p className="mt-4 text-[12px]">
              <a href="mailto:info@ouxing.com" className="hover:underline underline-offset-4">info@ouxing.com</a>
            </p>
            <p className="text-[12px]">
              <a href="tel:+8675512345678" className="hover:underline underline-offset-4">+86 755 1234 5678</a>
            </p>
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
            {certs.map((c, i) => (
              <span key={c} className="flex items-center gap-3">
                <span>{c}</span>
                {i < certs.length - 1 && <span className="text-[#d2d2d7]">·</span>}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-[#86868b]">
            © {new Date().getFullYear()} 欧星照明. 保留所有权利.
          </p>
        </div>
      </div>
    </footer>
  );
}
