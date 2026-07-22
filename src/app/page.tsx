import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Headphones, Package, ShieldCheck, Truck } from "lucide-react";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";
type ContentJson = Record<string, { name?: string; description?: string }>;

function getText(content: unknown, field: "name" | "description" = "name") {
  const value = content as ContentJson | null;
  return value?.zh?.[field] || value?.en?.[field] || "";
}

async function getProducts() {
  return prisma.product.findMany({
    where: { isActive: true },
    include: { category: true, images: { where: { variantId: null }, orderBy: { sortOrder: "asc" }, take: 1 } },
    take: 16,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });
}

export default async function HomePage() {
  const products = await getProducts();
  const featured = products.slice(0, 8);
  const seen = new Set<string>();
  const categories = products.filter((product) => {
    if (!product.category || seen.has(product.category.id)) return false;
    seen.add(product.category.id);
    return true;
  }).slice(0, 4);

  return (
    <main className="min-h-screen bg-white text-[#17212b]">
      <PublicNavbar />
      <section className="relative min-h-[620px] overflow-hidden bg-[#17212b] text-white md:min-h-[700px]">
        <Image src="/hero.jpg" alt="现代商业空间 LED 照明应用" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#101820]/90 via-[#101820]/58 to-transparent" />
        <div className="site-wrap relative flex min-h-[620px] items-center py-20 md:min-h-[700px]">
          <div className="max-w-2xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.14em] text-white/72">FactorLED · Commercial Lighting</p>
            <h1 className="max-w-xl text-4xl font-bold leading-[1.12] sm:text-5xl md:text-6xl">为商业与工程项目提供可靠的 LED 照明</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/78 md:text-lg">从产品选型、规格确认到批量交付，为全球采购商提供清晰、高效的项目支持。</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/products" className="appbtn appbtn-light">浏览产品</Link>
              <Link href="/inquiry" className="appbtn border border-white/35 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20">提交项目需求</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-200 bg-white">
        <div className="site-wrap grid grid-cols-2 divide-x divide-neutral-200 md:grid-cols-4">
          {[
            { icon: BadgeCheck, title: "国际认证", text: siteConfig.certs.join(" · ") },
            { icon: ShieldCheck, title: "稳定品质", text: "规范质检与批次追踪" },
            { icon: Truck, title: "灵活交付", text: "支持样品与批量订单" },
            { icon: Headphones, title: "项目支持", text: "销售与技术团队协同" },
          ].map((item) => (
            <div key={item.title} className="flex min-h-28 items-center gap-3 px-3 py-5 first:pl-0 last:pr-0 md:px-6">
              <item.icon className="h-5 w-5 shrink-0 text-emerald-700" strokeWidth={1.7} />
              <div><p className="text-sm font-semibold text-neutral-900">{item.title}</p><p className="mt-1 text-xs leading-5 text-neutral-500">{item.text}</p></div>
            </div>
          ))}
        </div>
      </section>

      {categories.length > 0 && (
        <section className="py-16 md:py-20"><div className="site-wrap">
          <SectionHeading title="按产品类型查找" description="快速定位适合商业、办公与工业项目的灯具系列。" href="/products" />
          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {categories.map((product, index) => (
              <ScrollReveal key={product.category!.id} variant="up" delay={index * 70}>
                <Link href={`/products?category=${product.category!.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-lg bg-neutral-100">
                  {product.images[0] ? <Image src={product.images[0].url} alt={getText(product.category!.content)} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" /> : <div className="absolute inset-0 flex items-center justify-center"><Package className="h-12 w-12 text-neutral-300" /></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/5 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white"><h3 className="text-lg font-bold md:text-xl">{getText(product.category!.content)}</h3><ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" /></div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div></section>
      )}

      {featured.length > 0 && (
        <section className="bg-[#f4f6f5] py-16 md:py-20"><div className="site-wrap">
          <SectionHeading title="重点产品" description="常用型号与重点系列，支持进一步获取规格书和项目报价。" href="/products" />
          <div className="mt-8 grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
            {featured.map((product, index) => (
              <ScrollReveal key={product.id} variant="up" delay={(index % 4) * 60}>
                <article className="product-card group h-full bg-white">
                  <Link href={`/products/${product.id}`} className="block">
                    <div className="relative aspect-square overflow-hidden bg-neutral-50">
                      {product.images[0] ? <Image src={product.images[0].url} alt={getText(product.content)} fill className="product-card-img object-contain p-6" /> : <div className="absolute inset-0 flex items-center justify-center"><Package className="h-10 w-10 text-neutral-300" /></div>}
                    </div>
                    <div className="p-4 md:p-5"><p className="text-xs text-neutral-500">{getText(product.category?.content)}</p><h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-neutral-900 md:text-base">{getText(product.content)}</h3><p className="mt-2 font-mono text-[11px] text-neutral-400">{product.modelNumber}</p></div>
                  </Link>
                  <div className="px-4 pb-4 md:px-5 md:pb-5"><Link href={`/inquiry?product=${product.id}`} className="flex h-10 items-center justify-center rounded-md border border-neutral-300 text-sm font-semibold text-neutral-800 transition-colors hover:border-[#294457] hover:bg-[#294457] hover:text-white">加入询价</Link></div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div></section>
      )}

      <section className="py-16 md:py-20"><div className="site-wrap grid overflow-hidden rounded-lg border border-neutral-200 bg-white lg:grid-cols-[1.08fr_.92fr]">
        <div className="p-7 md:p-12 lg:p-14">
          <p className="text-sm font-semibold text-[#294457]">从产品到项目交付</p>
          <h2 className="mt-4 max-w-xl text-3xl font-bold leading-tight text-neutral-950 md:text-4xl">更少沟通成本，更清晰的采购流程</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-neutral-600">明确产品参数、认证要求、数量和交付节点后，我们会整理匹配型号并提供报价建议，帮助采购团队更快推进决策。</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">{["产品规格与替代型号建议", "样品、批量与交付协同", "询盘清单集中管理", "面向出口项目的认证支持"].map((text) => <div key={text} className="flex gap-3 text-sm font-medium text-neutral-700"><BadgeCheck className="h-5 w-5 shrink-0 text-emerald-700" />{text}</div>)}</div>
        </div>
        <div className="grid grid-cols-2 bg-[#172630] text-white">{[[siteConfig.stats.foundedYear, "成立年份"], [siteConfig.stats.skuCount, "产品 SKU"], [siteConfig.stats.exportCountries, "出口国家"], [siteConfig.stats.teamSize, "团队成员"]].map(([value, label]) => <div key={label} className="flex min-h-40 flex-col justify-center border-b border-r border-white/10 p-7 md:p-9"><strong className="text-3xl font-bold tabular-nums md:text-4xl">{value}</strong><span className="mt-2 text-sm text-white/58">{label}</span></div>)}</div>
      </div></section>

      <section className="bg-[#294457] py-14 text-white md:py-16"><div className="site-wrap flex flex-col items-start justify-between gap-7 md:flex-row md:items-center">
        <div><h2 className="text-2xl font-bold md:text-3xl">有明确型号或项目清单？</h2><p className="mt-3 text-sm leading-6 text-white/70 md:text-base">提交数量、参数或应用场景，我们会整理下一步建议。</p></div>
        <Link href="/inquiry" className="appbtn appbtn-light shrink-0">开始询价</Link>
      </div></section>
      <PublicFooter />
    </main>
  );
}

function SectionHeading({ title, description, href }: { title: string; description: string; href: string }) {
  return <div className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-5 sm:flex-row sm:items-end"><div><h2 className="text-2xl font-bold text-neutral-950 md:text-3xl">{title}</h2><p className="mt-2 text-sm leading-6 text-neutral-500 md:text-base">{description}</p></div><Link href={href} className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#294457] hover:underline hover:underline-offset-4">查看全部 <ArrowRight className="h-4 w-4" /></Link></div>;
}
