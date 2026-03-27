import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

// Model -> { zh name, en name }
const nameMap: Record<string, { zh: string; en: string }> = {
  "92014": { zh: "LED轨道射灯 40W", en: "LED Track Light 40W" },
  "92079": { zh: "LED轨道射灯 40W GRAZ", en: "LED Track Spotlight 40W GRAZ Bridgelux 3CCT CRI+98" },
  "91037-90-5K": { zh: "LED投光灯 600W 90°", en: "600W LED Floodlight PHILIPS Xitanium CORE MAX 90°" },
  "91037-40-5K": { zh: "LED投光灯 600W 40°", en: "600W LED Floodlight PHILIPS Xitanium CORE MAX 40°" },
  "91482": { zh: "LED投光灯 240W 球场矩阵", en: "LED Floodlight 240W STADIUM MATRIX Philips Xitanium Bridgelux" },
  "5003": { zh: "AR111双头可调灯框 白色", en: "AR111 White Dual Adjustable Frame" },
  "5004": { zh: "AR111双头可调灯框 黑色", en: "AR111 Black Dual Adjustable Frame" },
  "SP768DC0B16W-WW-91515": { zh: "COB灯带 16W 3000K", en: "COB LED Strip 768D 16W 24V 3000K 5m/roll" },
  "SP768DCOB16W-NW-91516": { zh: "COB灯带 16W 4000K", en: "COB LED Strip 768D 16W 24V 4000K 5m/roll" },
  "SP768DC0B16W-CW-91517": { zh: "COB灯带 16W 5700K", en: "COB LED Strip 768D 16W 24V 5700K 5m/roll" },
  "SP240COBAC-WW-91508": { zh: "AC COB灯带 10W 3000K IP65", en: "AC230V COB Strip 240D 10W 3000K IP65 50m/roll" },
  "SP240COBAC-NW-91509": { zh: "AC COB灯带 10W 4000K IP65", en: "AC230V COB Strip 240D 10W 4000K IP65 50m/roll" },
  "SP240COBAC-CW-91510": { zh: "AC COB灯带 10W 6000K IP65", en: "AC230V COB Strip 240D 10W 6000K IP65 50m/roll" },
  "LN40W-3CCT-92087": { zh: "LED线条灯 40W 黑色", en: "LED Linear Light 40W Black 3CCT" },
  "LN50W-3CCT-92088": { zh: "LED线条灯 50W 黑色", en: "LED Linear Light 50W Black 3CCT" },
  "LN9W-3CCT-92089": { zh: "LED线条灯 9W 黑色", en: "LED Linear Light 9W Black 3CCT" },
  "60W12V24V-91489": { zh: "LED电源 60W 12V/24V", en: "LED Power Supply 60W AC200-240V 12V/24V" },
  "100W12V24V-91490": { zh: "LED电源 100W 12V/24V", en: "LED Power Supply 100W AC200-240V 12V/24V" },
  "150W12V24V-91491": { zh: "LED电源 150W 12V/24V", en: "LED Power Supply 150W AC200-240V 12V/24V" },
  "250W12V24V-91492": { zh: "LED电源 250W 12V/24V", en: "LED Power Supply 250W AC200-240V 12V/24V" },
  "60W24V-91884": { zh: "LED电源 60W 24V", en: "LED Power Supply 60W AC220V 24V" },
  "100W24V-91885": { zh: "LED电源 100W 24V", en: "LED Power Supply 100W AC220V 24V" },
  "150W24V-91886": { zh: "LED电源 150W 24V", en: "LED Power Supply 150W AC220V 24V" },
  "200W24V-91887": { zh: "LED电源 200W 24V", en: "LED Power Supply 200W AC220V 24V" },
  "400W24V-91889": { zh: "LED电源 400W 24V", en: "LED Power Supply 400W AC220V 24V" },
  "GEOMETRY-SERIES-A": { zh: "几何装饰板 A系列", en: "Geometry Decorative Panel Series A" },
  "WAVE-BOARD": { zh: "波浪装饰板", en: "Wave Decorative Board" },
  "GEOMETRY-SERIES-B": { zh: "几何装饰板 B系列", en: "Geometry Decorative Panel Series B" },
  "GEOMETRY-SERIES-C": { zh: "几何装饰板 C系列", en: "Geometry Decorative Panel Series C" },
  "GEOMETRY-SERIES-D": { zh: "几何装饰板 D系列", en: "Geometry Decorative Panel Series D" },
  "ROCK-STONE": { zh: "岩石装饰板", en: "Rock Stone Decorative Panel" },
};

async function main() {
  const products = await prisma.product.findMany();
  let updated = 0;

  for (const p of products) {
    const slug = p.slug;
    const names = nameMap[p.modelNumber] || nameMap[slug];
    if (!names) continue;

    const content = p.content as Record<string, { name?: string; description?: string }>;
    content.zh = { ...content.zh, name: names.zh };
    content.en = { ...content.en, name: names.en };

    await prisma.product.update({
      where: { id: p.id },
      data: { content },
    });
    updated++;
    console.log(`Updated: ${p.modelNumber} -> zh: ${names.zh} / en: ${names.en}`);
  }
  console.log(`Done. Updated ${updated} products.`);
}

main().then(() => prisma.$disconnect());
