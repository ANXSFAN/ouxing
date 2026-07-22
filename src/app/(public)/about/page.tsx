import {
  Factory, Award, Users, Globe, Truck, ShieldCheck, Headphones, Zap,
} from "lucide-react";
import type { Metadata } from "next";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "关于我们",
  description:
    "欧星是一家专注于 LED 照明产品研发与制造的企业，产品通过 CE、UL、RoHS 等多项国际认证，远销 50 多个国家和地区。",
};

export default function AboutPage() {
  return (
    <div className="bg-white text-[#1d1d1f]">
      {/* ═════════════════ HERO ═════════════════ */}
      <section className="bg-white pt-16 md:pt-24 pb-16 md:pb-20 text-center">
        <div className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="up">
            <p className="text-base md:text-lg text-[#86868b] mb-3 font-medium">
              成立于 2015
            </p>
          </ScrollReveal>
          <ScrollReveal variant="up" delay={100}>
            <h1 className="headline-xl text-3xl sm:text-4xl md:text-5xl mb-5">
              关于欧星
            </h1>
          </ScrollReveal>
          <ScrollReveal variant="up" delay={180}>
            <p className="text-xl sm:text-2xl md:text-[28px] text-[#1d1d1f] font-medium max-w-3xl mx-auto">
              十年磨一剑，
              <br className="md:hidden" />
              做经得起时间检验的 LED 产品
            </p>
          </ScrollReveal>
          <ScrollReveal variant="up" delay={260}>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
              <Link href="/products" className="applink">浏览产品</Link>
              <Link href="/inquiry" className="applink">联系我们</Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═════════════════ INTRO with image ═════════════════ */}
      <section className="bg-white pb-16 md:pb-24">
        <div className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="fade">
            <div className="aspect-[16/9] bg-neutral-50 border border-neutral-200 rounded-lg overflow-hidden relative">
              <Image src="/hero.jpg" alt="欧星工厂" fill className="object-cover" />
            </div>
          </ScrollReveal>

          <ScrollReveal variant="up" delay={120}>
            <p className="text-[17px] md:text-[19px] text-[#424245] mt-10 leading-relaxed max-w-3xl">
              欧星是一家专注于 LED 照明产品研发与制造的企业。公司拥有现代化生产基地，
              配备全自动 SMT 贴片线、无尘组装车间和完善的老化测试系统。产品通过 CE、UL、RoHS、SAA、DLC 等多项国际认证，
              远销 50 多个国家和地区。
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ═════════════════ STATS (dark band) ═════════════════ */}
      <section className="bg-[#1d1d1f] text-white py-20 md:py-24 text-center">
        <div className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="up">
            <p className="text-[#86868b] text-base mb-3">数据说话</p>
          </ScrollReveal>
          <ScrollReveal variant="up" delay={80}>
            <h2 className="headline-xl text-3xl md:text-4xl mb-12">
              十年深耕
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12">
            {[
              { v: siteConfig.stats.foundedYear, l: "成立年份" },
              { v: siteConfig.stats.skuCount, l: "产品 SKU" },
              { v: siteConfig.stats.exportCountries, l: "出口国家" },
              { v: siteConfig.stats.teamSize, l: "团队成员" },
            ].map((s, i) => (
              <ScrollReveal key={s.l} variant="up" delay={i * 80}>
                <div>
                  <div className="headline-xl text-4xl text-white tabular-nums">{s.v}</div>
                  <p className="text-sm text-[#86868b] mt-2">{s.l}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════ CAPABILITIES ═════════════════ */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="up">
            <p className="text-base text-[#86868b] text-center mb-3">核心能力</p>
          </ScrollReveal>
          <ScrollReveal variant="up" delay={80}>
            <h2 className="headline-lg text-3xl md:text-4xl text-center mb-4">
              从光学到出厂，
              <br className="md:hidden" />
              <span className="text-[#6e6e73]">全程自主把控</span>
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-12">
            {[
              { icon: Factory, title: "自有工厂", desc: "现代化生产基地，全自动 SMT 贴片产线" },
              { icon: Award, title: "品质认证", desc: "CE / UL / RoHS / SAA / DLC 全覆盖" },
              { icon: Users, title: "研发团队", desc: "光学、电子、结构多学科协同" },
              { icon: Globe, title: "全球网络", desc: "产品远销 50 多个国家和地区" },
            ].map((item, i) => (
              <ScrollReveal key={item.title} variant="up" delay={i * 80}>
                <div className="product-card bg-neutral-50 p-7 h-full">
                  <item.icon className="w-7 h-7 text-[#1d1d1f] mb-5" strokeWidth={1.5} />
                  <h3 className="headline-lg text-[19px] text-[#1d1d1f] mb-2">{item.title}</h3>
                  <p className="text-[13px] text-[#6e6e73] leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════ SERVICE PROMISES ═════════════════ */}
      <section className="bg-[#f5f5f7] py-20 md:py-24">
        <div className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="up">
            <p className="text-base text-[#86868b] text-center mb-3">服务承诺</p>
          </ScrollReveal>
          <ScrollReveal variant="up" delay={80}>
            <h2 className="headline-lg text-3xl md:text-4xl text-center mb-12">
              专业 · 可靠 · 及时
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-8">
            {[
              { icon: ShieldCheck, title: "品质保障", desc: "所有产品出厂前 100% 老化测试" },
              { icon: Zap, title: "高效节能", desc: "光效高达 150 lm/W，5 年质保" },
              { icon: Truck, title: "全球发货", desc: "完善供应链，准时到港" },
              { icon: Headphones, title: "技术支持", desc: "工程师 7×12 小时在线" },
            ].map((s, i) => (
              <ScrollReveal key={s.title} variant="up" delay={i * 80}>
                <div>
                  <s.icon className="w-6 h-6 text-[#1d1d1f] mb-4" strokeWidth={1.5} />
                  <p className="headline-lg text-[17px] text-[#1d1d1f]">{s.title}</p>
                  <p className="text-[13px] text-[#6e6e73] mt-1.5 leading-relaxed">{s.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════ CTA ═════════════════ */}
      <section className="bg-[#1d1d1f] py-20 md:py-28 text-center">
        <div className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="up">
            <h2 className="headline-xl text-3xl md:text-4xl text-white mb-4">
              找一个可靠的 LED 供应商
            </h2>
          </ScrollReveal>
          <ScrollReveal variant="up" delay={80}>
            <p className="text-xl md:text-2xl text-[#86868b] mb-8 max-w-2xl mx-auto">
              提交需求清单，我们将于 1–2 个工作日内回复方案与报价。
            </p>
          </ScrollReveal>
          <ScrollReveal variant="up" delay={160}>
            <div className="flex flex-wrap justify-center gap-x-7 gap-y-3 items-center">
              <Link href="/inquiry" className="appbtn-light appbtn">立即询价</Link>
              <Link href="/products" className="applink applink-light">浏览产品</Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
