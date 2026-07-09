<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md

本文件是 sysled 项目的 AI 协作指南，供 Codex 等工具自动读取。内容为本项目专属的设计规范、决策记录与整改状态，请在改动代码（尤其是前台页面）前遵循。

## 项目背景

sysled 是一个 **B2B LED 照明产品网站**（品牌 FactorLED），面向企业客户，不是 C 端消费品站。前台公开页位于 `src/app/(public)/*` 与 `src/app/page.tsx`。

## 设计总原则：B2B 专业克制

B2B 网站设计必须专业、克制、商务化，**不要用多彩配色方案**。

- **原因**：面向企业客户，过度使用品牌多色会显得不专业。
- **做法**：以中性色（黑 / 白 / 灰）为主色调，品牌色仅在 logo 本身出现。整站使用单一低调的强调色（如深灰或深蓝）。避免彩色渐变、多色光晕、彩虹条纹等花哨元素。卡片、按钮、图标都保持克制。

## 前台设计语言：Shopify 电商货架风格

前台公开页采用 **"Shopify 电商货架"** 风格，定位为像 Allbirds / Glossier / 普通 Shopify 店铺那样的 B2B 货架站。

- **重要背景（避免踩坑）**：首次重设计曾交付"编辑 / 餐厅艺术"风格（Fraunces 衬线大标题、italic 副标、坐标、序号 № 装饰），用户明确拒绝并反馈："灯具网站应该偏向 shopify 那种电商风格，而不是这种餐厅艺术风格"。不要再走艺术 / 编辑风或 Apple 范式。

具体规范：

- **字体**：只用 Inter Tight (`--font-sans`)。不要用 Fraunces 衬线 / 斜体或 JetBrains Mono 作为主字体。仅 SKU 等技术字段使用 mono fallback。中文使用 Noto Sans SC（此前只有 Inter Tight，中文会掉到微软雅黑，属于廉价感根源之一）。
- **配色**：白 / 中性灰 / 黑。`bg-neutral-50` 作为分区背景。CTA 主按钮 `bg-neutral-900`。trust / cert 用 `emerald-` 系列（低饱和绿色）。不要琥珀色 filament、不要光谱条、不要彩色 hover 光晕。
- **排版**：`text-xl/2xl/3xl font-bold` 即可；不要超大显示字 (7xl-9xl)、不要 italic 副标、不要 "kicker" 小标记（"/ 01 · CATEGORIES" 这类已废弃）。不要负字距。
- **圆角**：用 `rounded-md` (8px) 或 `rounded-lg` (10px)；不要用 pill (`rounded-full`) 作为主按钮形状，pill 只用在标签 chip。
- **卡片**：白底 + `border-neutral-200`。hover 用 `.product-card` 工具类（轻微 shadow + 内部图片 scale 1.04）。不要 translateY 抬升过度。
- **section 间距**：`py-12 md:py-16` 或 `py-16 md:py-20`；不要 `py-28`。
- **动画**：只保留 `ScrollReveal`（淡入 12px 位移）和 `.animate-cart-bounce` / `.animate-soft-pulse`。`LightBeam` / `GridBackdrop` / `Marquee` 已删除。首页不要滚动劫持，用普通滚动。
- **电商专属元素**：trust strip（认证 / 质保 / 发货行）、价值卖点 4 列、品类瓷砖（产品图打底）、产品卡 hover 显示加入询价按钮、PDP 数量选择器 + 加购按钮、面包屑、筛选 chip。
- **避免**：italic 斜体、超大衬线、坐标（N 22.55°）、序号装饰（№ 001 / / 01）、技术网格底纹、光谱渐变、装饰性英文句点。

参考方向：Allbirds、Glossier、Casper、Brooklinen、Outdoor Voices —— 任何标准 Shopify B2C 店铺都可对照。

## 整改记录与待办（2026-07 "廉价粗糙"反馈）

2026-07-05 老板反馈网站"廉价粗糙"，已完成一轮整改：

- 加载 Noto Sans SC 中文字体（修复中文字体断层）
- 去掉标题负字距
- 删首页视频占位框
- 首页去滚动劫持，改普通滚动
- 清理中文里的装饰性英文句点
- 页脚去死链
- 联系方式 / 统计数据集中到 `src/lib/site-config.ts`
- 询盘表单加必填姓名 + 邮箱
- 补 metadata / sitemap / robots / 404
- 开启 next/image 优化

**廉价感三大根源**：中文字体断层 + 占位假内容外露 + Apple 范式与 B2B 货架目标相悖。

**仍待老板提供的真实资产**：

- 产品图（uploads 里只有 3 张，来源是微信图 / Stock 素材）
- hero 视频或工厂实拍
- 真实电话（`site-config.ts` 里 `phone` 留空则页脚不显示）
- 真实统计数字（`site-config.ts` 的 `stats`）

**做前台改动时数据先走 `src/lib/site-config.ts`，不要硬编码。**
