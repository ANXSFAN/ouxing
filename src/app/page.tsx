import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import {
  Package,
  ArrowRight,
  Lightbulb,
  ShieldCheck,
  BatteryCharging,
  Truck,
} from "lucide-react";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";

type ContentJson = Record<string, { name?: string; description?: string }>;

function getName(content: unknown) {
  const c = content as ContentJson | null;
  return c?.zh?.name || c?.en?.name || "";
}

async function getFeaturedProducts() {
  return prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    take: 8,
    orderBy: { createdAt: "desc" },
  });
}

async function getCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { products: { where: { isActive: true } } } },
    },
    orderBy: { sortOrder: "asc" },
  });
}

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNavbar />

      {/* ── Hero ── */}
      <section className="relative bg-neutral-950 overflow-hidden">
        {/* Background image */}
        <Image
          src="/hero.jpg"
          alt="Commercial LED Lighting"
          fill
          className="object-cover opacity-40"
          priority
          unoptimized
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/70 to-neutral-950/40" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-48 relative z-10 w-full">
          <h1 className="text-7xl md:text-9xl lg:text-[12rem] font-black text-white tracking-tight leading-none mb-10">
            欧星
          </h1>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-amber-500 text-neutral-950 hover:bg-amber-400 h-11 px-7 text-sm font-semibold rounded-lg"
            >
              <Link href="/products">
                浏览产品 <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-transparent border border-neutral-600 text-neutral-200 hover:border-neutral-400 hover:text-white h-11 px-7 text-sm font-semibold rounded-lg"
            >
              <Link href="/inquiry">获取报价</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── 产品分类 ── */}
      {categories.length > 0 && (
        <section className="bg-neutral-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1">
                  Categories
                </p>
                <h2 className="text-2xl font-bold text-neutral-900">
                  产品分类
                </h2>
              </div>
              <Link
                href="/products"
                className="text-sm text-neutral-500 hover:text-neutral-900 font-medium flex items-center gap-1 transition-colors"
              >
                查看全部 <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.id}`}
                  className="group bg-white rounded-xl p-5 border border-neutral-200/80 hover:border-neutral-300 hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center mb-3 group-hover:bg-neutral-200 transition-colors">
                    <Lightbulb className="w-5 h-5 text-neutral-500" />
                  </div>
                  <h3 className="font-semibold text-neutral-900 text-sm group-hover:text-neutral-700 transition-colors">
                    {getName(cat.content)}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    {cat._count.products} 款产品
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 精选产品 ── */}
      {featuredProducts.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1">
                  Featured
                </p>
                <h2 className="text-2xl font-bold text-neutral-900">
                  精选产品
                </h2>
              </div>
              <Link
                href="/products"
                className="text-sm text-neutral-500 hover:text-neutral-900 font-medium flex items-center gap-1 transition-colors"
              >
                查看全部 <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredProducts.map((product) => {
                const specs = product.specs as Record<string, string> | null;
                const highlightSpecs = specs
                  ? Object.entries(specs).slice(0, 4)
                  : [];
                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="group bg-white rounded-xl border border-neutral-200/80 overflow-hidden hover:border-neutral-300 hover:shadow-md transition-all"
                  >
                    <div className="h-52 bg-neutral-50 relative overflow-hidden">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0].url}
                          alt={getName(product.content)}
                          fill
                          className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package className="w-12 h-12 text-neutral-200" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                        {getName(product.category?.content)}
                      </p>
                      <h3 className="text-sm font-semibold text-neutral-900 mt-1 group-hover:text-neutral-700 transition-colors line-clamp-2">
                        {getName(product.content)}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5 font-mono">
                        {product.modelNumber}
                      </p>
                      {highlightSpecs.length > 0 && (
                        <div className="grid grid-cols-2 gap-1.5 mt-3">
                          {highlightSpecs.map(([key, val]) => (
                            <div
                              key={key}
                              className="bg-neutral-50 rounded px-2 py-1 text-[11px]"
                            >
                              <span className="text-neutral-400">{key}</span>
                              <span className="text-neutral-700 font-medium ml-1">
                                {val}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── 优势 ── */}
      <section className="bg-neutral-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1">
              Why Us
            </p>
            <h2 className="text-2xl font-bold text-neutral-900">我们的优势</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: ShieldCheck,
                title: "品质认证",
                desc: "CE / UL / RoHS / SAA / DLC 等国际认证全覆盖",
              },
              {
                icon: BatteryCharging,
                title: "高效节能",
                desc: "高光效LED光源，CRI>80/90可选，寿命超50000小时",
              },
              {
                icon: Truck,
                title: "全球交付",
                desc: "产品出口50+国家，完善供应链确保准时交付",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl p-7 border border-neutral-200/80 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mb-5">
                  <item.icon className="w-6 h-6 text-neutral-600" />
                </div>
                <h3 className="font-bold text-neutral-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-neutral-900 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                需要产品报价？
              </h2>
              <p className="text-neutral-400">
                提交询价，我们将在1-2个工作日内回复您。
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="bg-white text-neutral-900 hover:bg-neutral-100 h-11 px-8 font-semibold shrink-0 rounded-lg"
            >
              <Link href="/inquiry">
                立即询价 <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
