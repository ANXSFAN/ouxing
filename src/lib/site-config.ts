/**
 * 站点级公司信息集中配置。
 * 上线前请把联系方式与数据替换为真实内容 —— 前台页脚、关于页、首页统计均从这里读取。
 */
export const siteConfig = {
  name: "欧星照明",
  shortName: "欧星",
  title: "欧星 OUXING — 专业 LED 照明产品",
  description:
    "欧星提供高品质 LED 面板灯、筒灯、射灯、灯管等照明产品，涵盖商业照明、工业照明等多种应用场景。",
  /** 部署域名，用于 sitemap / OG 链接，可通过环境变量覆盖 */
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",

  /** 联系方式 —— 请填写真实信息；phone 留空则前台不展示 */
  contact: {
    email: "info@ouxing.com",
    phone: "" as string,
  },

  /** 国际认证 */
  certs: ["CE", "UL", "RoHS", "SAA", "DLC", "ISO 9001"],

  /** 公司数据 —— 请核实后填写真实数字 */
  stats: {
    foundedYear: "2015",
    skuCount: "500+",
    exportCountries: "50+",
    teamSize: "200+",
  },
} as const;
