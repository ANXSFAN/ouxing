import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Package } from "lucide-react";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ContentJson = Record<string, { name?: string; description?: string }>;

function getName(content: unknown) {
  const c = content as ContentJson | null;
  return c?.zh?.name || c?.en?.name || "";
}

async function getProducts() {
  return prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: true,
      images: { where: { variantId: null }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
    take: 14,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });
}

export default async function HomePage() {
  const products = await getProducts();

  const subHero = products[0];
  const bigBento = products.slice(1, 3);
  const smallBento = products.slice(3, 7);
  const lineup = products.slice(7, 13);

  return (
    <div className="bg-white text-[#1d1d1f]">
      <PublicNavbar />

      {/* ═════════════════ HERO — black spotlight ═════════════════ */}
      <section className="hero-spotlight relative text-white overflow-hidden min-h-[72vh] md:min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="headline-xl text-4xl sm:text-5xl md:text-6xl text-white">
            欧星 LED
          </h1>
          <p className="mt-5 text-lg sm:text-xl md:text-2xl text-white/70 font-medium">
            专业 LED 照明制造商，服务全球采购商
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <Link href="/products" className="appbtn appbtn-light">浏览产品</Link>
            <Link href="/inquiry" className="applink applink-light">立即询价</Link>
          </div>
        </div>
      </section>

      {/* ═════════════════ SUB-HERO — featured product spotlight (light) ═════════════════ */}
      {subHero && (
        <section className="relative bg-[#e8e8ed] text-[#1d1d1f] overflow-hidden border-b border-black/5">
          <div className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 text-center w-full">
            <ScrollReveal variant="up">
              <p className="text-base md:text-lg text-[#6e6e73] mb-3 font-medium">
                {getName(subHero.category?.content) || "本月精选"}
              </p>
            </ScrollReveal>
            <ScrollReveal variant="up" delay={100}>
              <h2 className="headline-xl text-3xl md:text-4xl mb-4">
                {getName(subHero.content)}
              </h2>
            </ScrollReveal>
            <ScrollReveal variant="up" delay={180}>
              <p className="text-xl sm:text-2xl md:text-[26px] text-[#1d1d1f] font-medium mb-6">
                专业品质，触手可得
              </p>
            </ScrollReveal>
            <ScrollReveal variant="up" delay={260}>
              <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
                <Link href={`/products/${subHero.id}`} className="applink">了解更多</Link>
                <Link href="/inquiry" className="applink">立即询价</Link>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal variant="fade" delay={350}>
            <div className="relative h-[360px] sm:h-[440px] md:h-[520px] mt-6 md:mt-10">
              {subHero.images[0] ? (
                <Image
                  src={subHero.images[0].url}
                  alt={getName(subHero.content)}
                  fill
                  className="object-contain object-bottom"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="w-20 h-20 text-[#d2d2d7]" />
                </div>
              )}
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* ═════════════════ BIG PRODUCT BENTO (2 cols) ═════════════════ */}
      {bigBento.length >= 2 && (
        <section className="bg-white px-2 sm:px-3 py-3">
          <div className="w-full max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-3">
            <ScrollReveal variant="rise">
              <ProductBigTile theme="light" product={bigBento[0]} />
            </ScrollReveal>
            <ScrollReveal variant="rise" delay={140}>
              <ProductBigTile theme="dark" product={bigBento[1]} />
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ═════════════════ SMALL PRODUCT BENTO (4 cols) ═════════════════ */}
      {smallBento.length > 0 && (
        <section className="bg-white px-2 sm:px-3 py-3">
          <div className="w-full max-w-[1440px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3">
            {smallBento.map((p, i) => (
              <ScrollReveal key={p.id} variant="rise" delay={i * 100}>
                <ProductSmallTile
                  product={p}
                  theme={i % 2 === 0 ? "dark" : "light"}
                />
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}

      {/* ═════════════════ LINEUP — product grid ═════════════════ */}
      {lineup.length > 0 && (
        <section className="bg-white py-20 md:py-28">
          <div className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal variant="up">
              <p className="text-base text-[#86868b] text-center mb-3">更多精选</p>
            </ScrollReveal>
            <ScrollReveal variant="up" delay={80}>
              <h2 className="headline-lg text-3xl md:text-4xl text-center mb-4">
                熟悉的型号，即刻询价
              </h2>
            </ScrollReveal>
            <ScrollReveal variant="up" delay={160}>
              <div className="text-center mb-14">
                <Link href="/products" className="applink">查看所有产品</Link>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12">
              {lineup.map((p, i) => (
                <ScrollReveal key={p.id} variant="rise" delay={(i % 3) * 120}>
                  <Link href={`/products/${p.id}`} className="group block text-center">
                    <div className="relative aspect-square bg-neutral-50 border border-neutral-200 rounded-lg overflow-hidden mb-5">
                      {p.images[0] ? (
                        <Image
                          src={p.images[0].url}
                          alt={getName(p.content)}
                          fill
                          className="object-contain p-6 transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package className="w-12 h-12 text-[#86868b]" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-[#86868b] mb-1">
                      {getName(p.category?.content)}
                    </p>
                    <h3 className="headline-lg text-lg md:text-xl text-[#1d1d1f] mb-2 group-hover:opacity-80 transition-opacity">
                      {getName(p.content)}
                    </h3>
                    <span className="applink">了解更多</span>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═════════════════ WHY OUXING (dark band) ═════════════════ */}
      <section className="bg-[#1d1d1f] text-white py-20 md:py-28 text-center">
        <div className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="up">
            <p className="text-[#a1a1a6] text-base mb-3">为什么选择欧星</p>
          </ScrollReveal>
          <ScrollReveal variant="up" delay={80}>
            <h2 className="headline-xl text-3xl md:text-4xl mb-10">
              专业可靠，
              <br className="md:hidden" />
              出口 {siteConfig.stats.exportCountries} 国家
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 mt-16">
            {[
              { v: siteConfig.stats.foundedYear, l: "成立年份" },
              { v: siteConfig.stats.skuCount, l: "产品 SKU" },
              { v: siteConfig.stats.exportCountries, l: "出口国家" },
              { v: siteConfig.stats.teamSize, l: "团队成员" },
            ].map((s, i) => (
              <ScrollReveal key={s.l} variant="up" delay={i * 80}>
                <div>
                  <div className="headline-xl text-4xl text-white tabular-nums">{s.v}</div>
                  <p className="text-sm text-[#a1a1a6] mt-2">{s.l}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal variant="up" delay={400}>
            <div className="mt-12 flex flex-wrap justify-center gap-x-7 gap-y-2">
              <Link href="/about" className="applink applink-light">了解我们</Link>
              <Link href="/inquiry" className="applink applink-light">联系销售</Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═════════════════ FINAL CTA ═════════════════ */}
      <section className="bg-white py-20 md:py-28 text-center">
        <div className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="up">
            <h2 className="headline-xl text-3xl md:text-4xl mb-4">
              准备好开始您的项目？
            </h2>
          </ScrollReveal>
          <ScrollReveal variant="up" delay={80}>
            <p className="text-xl md:text-2xl text-[#6e6e73] mb-8">
              提交需求清单，我们将于 1–2 个工作日内回复方案与报价。
            </p>
          </ScrollReveal>
          <ScrollReveal variant="up" delay={160}>
            <div className="flex flex-wrap justify-center gap-x-7 gap-y-3 items-center">
              <Link href="/inquiry" className="appbtn">立即询价</Link>
              <Link href="/products" className="applink">浏览全部产品</Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

/* ────────── Product Bento tiles ────────── */

interface ProductPayload {
  id: string;
  content: unknown;
  category: { content: unknown } | null;
  images: { url: string }[];
}

function ProductBigTile({ theme, product }: { theme: "light" | "dark"; product: ProductPayload }) {
  const isDark = theme === "dark";
  const name = getName(product.content);
  const catName = getName(product.category?.content);
  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(
        "product-card group block relative aspect-square md:aspect-[5/6] lg:aspect-[5/5] overflow-hidden",
        isDark ? "bg-[#1d1d1f] text-white" : "bg-[#e8e8ed] text-[#1d1d1f]",
      )}
    >
      <div className="absolute inset-x-0 top-0 flex flex-col items-center pt-14 sm:pt-20 px-6 text-center z-10">
        {catName && (
          <p className={cn("text-sm font-medium mb-2", isDark ? "text-[#a1a1a6]" : "text-[#6e6e73]")}>
            {catName}
          </p>
        )}
        <h3 className="headline-xl text-3xl sm:text-5xl md:text-[44px] mb-4 max-w-md">
          {name}
        </h3>
        <span className={cn("applink", isDark && "applink-light")}>了解更多</span>
      </div>
      {product.images[0] ? (
        <div className="absolute inset-x-0 bottom-0 h-[58%]">
          <Image
            src={product.images[0].url}
            alt={name}
            fill
            className="product-card-img object-contain p-6 sm:p-10"
          />
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-0 h-[58%] flex items-center justify-center">
          <Package className={cn("w-16 h-16", isDark ? "text-[#3a3a3c]" : "text-[#d2d2d7]")} />
        </div>
      )}
    </Link>
  );
}

function ProductSmallTile({ product, theme }: { product: ProductPayload; theme: "light" | "dark" }) {
  const isDark = theme === "dark";
  const name = getName(product.content);
  const catName = getName(product.category?.content);
  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(
        "product-card group block relative aspect-[4/5] overflow-hidden",
        isDark ? "bg-[#1d1d1f] text-white" : "bg-[#e8e8ed] text-[#1d1d1f]",
      )}
    >
      <div className="absolute inset-x-0 top-0 flex flex-col items-center pt-10 px-5 text-center z-10">
        {catName && (
          <p className={cn("text-xs mb-2 font-medium", isDark ? "text-[#a1a1a6]" : "text-[#6e6e73]")}>
            {catName}
          </p>
        )}
        <h3 className={cn("headline-lg text-xl sm:text-2xl mb-3", isDark ? "text-white" : "text-[#1d1d1f]")}>
          {name}
        </h3>
        <span className={cn("applink", isDark && "applink-light")}>了解更多</span>
      </div>
      {product.images[0] ? (
        <div className="absolute inset-x-0 bottom-0 h-[55%]">
          <Image
            src={product.images[0].url}
            alt={name}
            fill
            className="product-card-img object-contain p-5"
          />
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-0 h-[55%] flex items-center justify-center">
          <Package className={cn("w-12 h-12", isDark ? "text-[#3a3a3c]" : "text-[#d2d2d7]")} />
        </div>
      )}
    </Link>
  );
}
