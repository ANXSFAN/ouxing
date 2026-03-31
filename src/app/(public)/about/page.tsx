import { Factory, Award, Users, Globe } from "lucide-react";

export default function AboutPage() {
  return (
    <div>
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900">关于我们</h1>
          <p className="text-sm text-gray-400 mt-1">欧星 - 专业LED照明产品制造商</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 简介 */}
        <section className="py-12 max-w-2xl">
          <p className="text-gray-600 leading-relaxed">
            欧星成立于2015年，是一家专注于LED照明产品研发与制造的企业。公司拥有现代化生产基地，
            配备全自动SMT贴片线、无尘组装车间和完善的老化测试系统。产品通过CE、UL、RoHS、SAA、DLC等多项国际认证，远销50多个国家和地区。
          </p>
        </section>

        {/* 数据 */}
        <section className="py-10 border-y border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "2015年", label: "成立" },
              { value: "500+", label: "产品型号" },
              { value: "50+", label: "出口国家" },
              { value: "200+", label: "团队成员" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-gray-900">{s.value}</div>
                <div className="text-sm text-gray-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 能力 */}
        <section className="py-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">核心能力</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Factory, title: "自有工厂", desc: "现代化生产基地，全自动SMT产线" },
              { icon: Award, title: "品质认证", desc: "CE / UL / RoHS / SAA / DLC" },
              { icon: Users, title: "研发团队", desc: "光学、电子、结构多学科团队" },
              { icon: Globe, title: "全球网络", desc: "产品远销50+国家和地区" },
            ].map((item) => (
              <div key={item.title} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                  <item.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
