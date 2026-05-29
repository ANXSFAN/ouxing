import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Package, Film } from "lucide-react";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { SnapStackController } from "@/components/motion/snap-stack-controller";
import { cn } from "@/lib/utils";

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
    <div className="snap-stack bg-white text-[#1d1d1f]">
      <SnapStackController />
      <PublicNavbar />

      {/* ═════════════════ HERO — black spotlight + video placeholder ═════════════════ */}
      <section className="snap-page hero-spotlight relative text-white overflow-hidden">
        {/* Video placeholder — replace with <video autoPlay loop muted playsInline src="/hero.mp4" /> when ready */}
        <div className="absolute inset-x-0 bottom-0 top-[40vh] sm:top-[42vh] z-0 flex items-center justify-center px-6 sm:px-12">
          <div className="w-full max-w-3xl aspect-video rounded-3xl border border-dashed border-white/15 bg-white/[0.02] flex flex-col items-center justify-center gap-3">
            <Film className="w-10 h-10 text-white/25" strokeWidth={1.25} />
            <p className="text-white/35 text-[13px] tracking-wide">视频占位 · /public/hero.mp4</p>
          </div>
        </div>

        {/* Wordmark */}
        <div className="absolute inset-x-0 top-[14vh] sm:top-[16vh] text-center px-4 z-10">
          <h1 className="headline-xl text-6xl sm:text-7xl md:text-[120px] lg:text-[140px] text-white">
            欧星 LED
          </h1>
        </div>
      </section>

      {/* ═════════════════ SUB-HERO — second product spotlight (light) ═════════════════ */}
      {subHero && (
        <section className="snap-page relative bg-[#e8e8ed] text-[#1d1d1f] overflow-hidden border-b border-black/5">
          <div className="h-full flex flex-col">
            <div className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 md:pt-20 text-center w-full">
              <ScrollReveal variant="up">
                <p className="text-base md:text-lg text-[#6e6e73] mb-3 font-medium">
                  {getName(subHero.category?.content) || "本月精选"}
                </p>
              </ScrollReveal>
              <ScrollReveal variant="up" delay={100}>
                <h2 className="headline-xl text-5xl sm:text-6xl md:text-[80px] mb-4">
                  {getName(subHero.content)}
                </h2>
              </ScrollReveal>
              <ScrollReveal variant="up" delay={180}>
                <p className="text-xl sm:text-2xl md:text-[28px] text-[#1d1d1f] font-medium mb-6 tracking-tight">
                  专业品质<span className="text-[#86868b]">.</span> 触手可得<span className="text-[#86868b]">.</span>
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
              <div className="relative flex-1 min-h-[360px] sm:min-h-[440px] md:min-h-[520px] mt-6 md:mt-10">
                {subHero.images[0] ? (
                  <Image
                    src={subHero.images[0].url}
                    alt={getName(subHero.content)}
                    fill
                    className="object-contain object-bottom"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package className="w-20 h-20 text-[#d2d2d7]" />
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ═════════════════ BIG PRODUCT BENTO (2 cols) ═════════════════ */}
      {bigBento.length >= 2 && (
        <section className="snap-page bg-white px-2 sm:px-3 py-3">
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
        <section className="snap-page bg-white px-2 sm:px-3 py-3">
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
        <section className="snap-page bg-white py-20 md:py-28">
          <div className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal variant="up">
              <p className="text-base text-[#86868b] text-center mb-3">更多精选</p>
            </ScrollReveal>
            <ScrollReveal variant="up" delay={80}>
              <h2 className="headline-lg text-4xl md:text-6xl text-center mb-4">
                熟悉的型号<span className="text-[#86868b]">. </span>
                <br className="md:hidden" />
                <span className="text-[#86868b]">即刻询价。</span>
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
                    <div className="relative aspect-square bg-[#e8e8ed] rounded-3xl overflow-hidden mb-5">
                      {p.images[0] ? (
                        <Image
                          src={p.images[0].url}
                          alt={getName(p.content)}
                          fill
                          className="object-contain p-8 transition-transform duration-700 group-hover:scale-105"
                          unoptimized
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
      <section className="snap-page bg-[#1d1d1f] text-white py-20 md:py-28 text-center">
        <div className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="up">
            <p className="text-[#86868b] text-base mb-3">为什么选择欧星</p>
          </ScrollReveal>
          <ScrollReveal variant="up" delay={80}>
            <h2 className="headline-xl text-4xl sm:text-6xl md:text-7xl mb-12">
              专业<span className="text-[#86868b]">.</span> 可靠<span className="text-[#86868b]">.</span>
              <br />
              出口 50+ 国家<span className="text-[#86868b]">.</span>
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 mt-16">
            {[
              { v: "10+", l: "年制造经验" },
              { v: "500+", l: "产品 SKU" },
              { v: "50+", l: "出口国家" },
              { v: "50K", l: "小时寿命" },
            ].map((s, i) => (
              <ScrollReveal key={s.l} variant="up" delay={i * 80}>
                <div>
                  <div className="headline-xl text-5xl md:text-6xl text-white">{s.v}</div>
                  <p className="text-sm text-[#86868b] mt-2">{s.l}</p>
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
      <section className="snap-page bg-white py-20 md:py-28 text-center">
        <div className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="up">
            <h2 className="headline-xl text-4xl md:text-6xl mb-4">
              准备好开始您的项目？
            </h2>
          </ScrollReveal>
          <ScrollReveal variant="up" delay={80}>
            <p className="text-xl md:text-2xl text-[#86868b] mb-8">
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
        "apple-tile group block relative aspect-square md:aspect-[5/6] lg:aspect-[5/5] overflow-hidden",
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
            className="apple-tile-img object-contain p-6 sm:p-10"
            unoptimized
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
        "apple-tile group block relative aspect-[4/5] overflow-hidden",
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
            className="apple-tile-img object-contain p-5"
            unoptimized
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
