import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

const products = [
  { model: "92014", item: "LED Track light", desc: "AC 85-265V 40W 4000lm 3000K ≥92% 60°IP20 Reflector with glass, isolated high P with flicker power supply, white two-wire", watt: "40W", color: "3CCT", qtyPerCarton: 10, cL: 54.5, cW: 34, cH: 21.5, nw: 9.3, gw: 11, price: 61 },
  { model: "92079", item: "LED Track light", desc: "LED Spotlight 40W GRAZ White Bridgelux Chip 3CCT - Three-Phase Track - 4400Lm - CRI +98", watt: "40W", color: "3CCT", qtyPerCarton: 10, cL: 54.5, cW: 34, cH: 24.5, nw: 10.3, gw: 11.8, price: 68 },
  { model: "91037-90-5K", item: "LED Module", desc: "600W LED Floodlight PHILIPS Xitanium - CORE MAX- 150Lm/W- CLASS A 90°", watt: "600W", color: "5000K", qtyPerCarton: 1, cL: 62, cW: 43.7, cH: 20.8, nw: 6.5, gw: 7.5, price: 1298 },
  { model: "91037-40-5K", item: "LED Module", desc: "600W LED Floodlight PHILIPS Xitanium - CORE MAX- 150Lm/W- CLASS A 40°", watt: "600W", color: "5000K", qtyPerCarton: 1, cL: 62, cW: 43.7, cH: 20.8, nw: 6.5, gw: 7.5, price: 1298 },
  { model: "91482", item: "LED Module", desc: "LED Floodlight 240W - STADIUM MATRIX - Philips Xitanium Driver - SMD5050 Bridgelux 240Lm/W High Brightness", watt: "240W", color: "5000K", qtyPerCarton: 1, cL: 36, cW: 33.5, cH: 17.5, nw: 4.6, gw: 5.3, price: 568 },
  { model: "5003", item: "AR111 Front Ring", desc: "AR111 White Dual Adjustable Frame", watt: "", color: "", qtyPerCarton: 36, cL: 62.5, cW: 35.5, cH: 55, nw: 15, gw: 16.3, price: 9 },
  { model: "5004", item: "AR111 Front Ring", desc: "AR111 BLACK Dual Adjustable Frame", watt: "", color: "", qtyPerCarton: 36, cL: 62.5, cW: 35.5, cH: 55, nw: 15, gw: 16.3, price: 9 },
  { model: "SP768DC0B16W-WW-91515", item: "LED Strip light", desc: "COB-768D-8-24V-Bare board - 5 meters/roll, Blue film fiberglass double-sided tape, Paper roll spool + anti-static bag + color box + inner box", watt: "16W", color: "3000K", qtyPerCarton: 100, cL: 34, cW: 17.5, cH: 23.5, nw: 2.55, gw: 2.95, price: 6.76 },
  { model: "SP768DCOB16W-NW-91516", item: "LED Strip light", desc: "COB-768D-8-24V-Bare board - 5 meters/roll, Blue film fiberglass double-sided tape, Paper roll spool + anti-static bag + color box + inner box", watt: "16W", color: "4000K", qtyPerCarton: 100, cL: 34, cW: 17.5, cH: 23.5, nw: 2.55, gw: 2.95, price: 6.76 },
  { model: "SP768DC0B16W-CW-91517", item: "LED Strip light", desc: "COB-768D-8-24V-Bare board - 5 meters/roll, Blue film fiberglass double-sided tape, Paper roll spool + anti-static bag + color box + inner box", watt: "16W", color: "5700K", qtyPerCarton: 100, cL: 34, cW: 17.5, cH: 23.5, nw: 2.55, gw: 2.95, price: 6.76 },
  { model: "SP240COBAC-WW-91508", item: "LED Strip light", desc: "AC230V 240COB CRI>90 675-750LM/M 9W/M IP65 hollow PVC 50M/roll 8mm 10cm cuttable", watt: "10W", color: "3000K", qtyPerCarton: 100, cL: 37.5, cW: 28.5, cH: 27.5, nw: 7.8, gw: 8.4, price: 3.99 },
  { model: "SP240COBAC-NW-91509", item: "LED Strip light", desc: "AC230V 240COB CRI>90 675-750LM/M 9W/M IP65 PVC 50M/roll 8mm 10cm cuttable", watt: "10W", color: "4000K", qtyPerCarton: 100, cL: 37.5, cW: 28.5, cH: 27.5, nw: 7.8, gw: 8.4, price: 3.99 },
  { model: "SP240COBAC-CW-91510", item: "LED Strip light", desc: "AC230V 240COB CRI>90 675-750LM/M 9W/M IP65 PVC 50M/roll 8mm 10cm cuttable", watt: "10W", color: "6000K", qtyPerCarton: 100, cL: 37.5, cW: 28.5, cH: 27.5, nw: 7.8, gw: 8.4, price: 3.99 },
  { model: "LN40W-3CCT-92087", item: "Linear light", desc: "LED Linear Light Black", watt: "40W", color: "3CCT", qtyPerCarton: 6, cL: 128, cW: 19.5, cH: 19.5, nw: 10, gw: 11.7, price: 128 },
  { model: "LN50W-3CCT-92088", item: "Linear light", desc: "LED Linear Light Black", watt: "50W", color: "3CCT", qtyPerCarton: 6, cL: 158, cW: 19.5, cH: 19.5, nw: 11.3, gw: 13.3, price: 162 },
  { model: "LN9W-3CCT-92089", item: "Linear light", desc: "LED Linear Light Black", watt: "9W", color: "3CCT", qtyPerCarton: 4, cL: 40, cW: 20, cH: 20, nw: 1.9, gw: 2.5, price: 80 },
  { model: "60W12V24V-91489", item: "LED power supply", desc: "AC200V-240V OUT:12V/24V 60W", watt: "60W", color: "", qtyPerCarton: 80, cL: 39, cW: 28, cH: 17, nw: 17, gw: 18, price: 21 },
  { model: "100W12V24V-91490", item: "LED power supply", desc: "AC200V-240V OUT:12V/24V 100W", watt: "100W", color: "", qtyPerCarton: 80, cL: 39, cW: 28, cH: 17, nw: 17, gw: 18, price: 27.2 },
  { model: "150W12V24V-91491", item: "LED power supply", desc: "AC200V-240V OUT:12V/24V 150W", watt: "150W", color: "", qtyPerCarton: 60, cL: 39, cW: 28, cH: 17, nw: 15, gw: 16, price: 32 },
  { model: "250W12V24V-91492", item: "LED power supply", desc: "AC200V-240V OUT:12V/24V 250W", watt: "250W", color: "", qtyPerCarton: 52, cL: 39, cW: 28, cH: 17, nw: 16.8, gw: 17.8, price: 36.9 },
  { model: "60W24V-91884", item: "LED power supply", desc: "AC220V OUT:24V 60W", watt: "60W", color: "", qtyPerCarton: 132, cL: 50, cW: 30.5, cH: 17.5, nw: 15, gw: 16, price: 15.4 },
  { model: "100W24V-91885", item: "LED power supply", desc: "AC220V OUT:24V 100W", watt: "100W", color: "", qtyPerCarton: 108, cL: 50, cW: 30.5, cH: 17.5, nw: 15.1, gw: 16.1, price: 20.6 },
  { model: "150W24V-91886", item: "LED power supply", desc: "AC220V OUT:24V 150W", watt: "150W", color: "", qtyPerCarton: 100, cL: 50, cW: 30.5, cH: 17.5, nw: 15.5, gw: 16.5, price: 24.5 },
  { model: "200W24V-91887", item: "LED power supply", desc: "AC220V OUT:24V 200W", watt: "200W", color: "", qtyPerCarton: 90, cL: 50, cW: 30.5, cH: 17.5, nw: 16.2, gw: 17.2, price: 25.9 },
  { model: "400W24V-91889", item: "LED power supply", desc: "AC220V OUT:24V 400W", watt: "400W", color: "", qtyPerCarton: 60, cL: 50, cW: 30.5, cH: 17.5, nw: 17.2, gw: 18.2, price: 35 },
  { model: "GEOMETRY-SERIES-A", item: "Decorative panel", desc: "GEOMETRY SERIES A", watt: "", color: "beige", qtyPerCarton: 18, cL: 123, cW: 41, cH: 63, nw: 27, gw: 29, price: 50 },
  { model: "WAVE-BOARD", item: "Decorative panel", desc: "WAVE BOARD", watt: "", color: "beige", qtyPerCarton: 10, cL: 123, cW: 41, cH: 63, nw: 15, gw: 17, price: 70 },
  { model: "GEOMETRY-SERIES-B", item: "Decorative panel", desc: "GEOMETRY SERIES B", watt: "", color: "2A", qtyPerCarton: 15, cL: 123, cW: 41, cH: 63, nw: 22.5, gw: 24.5, price: 50 },
  { model: "GEOMETRY-SERIES-C", item: "Decorative panel", desc: "GEOMETRY SERIES C", watt: "", color: "white", qtyPerCarton: 18, cL: 123, cW: 41, cH: 63, nw: 27, gw: 29, price: 50 },
  { model: "GEOMETRY-SERIES-D", item: "Decorative panel", desc: "GEOMETRY SERIES D", watt: "", color: "white", qtyPerCarton: 22, cL: 123, cW: 41, cH: 63, nw: 33, gw: 35, price: 50 },
  { model: "ROCK-STONE", item: "Decorative panel", desc: "ROCK STONE", watt: "", color: "3A gray", qtyPerCarton: 6, cL: 123, cW: 41, cH: 63, nw: 14.4, gw: 16.4, price: 60 },
];

// Category mapping: item name -> slug
const categoryMap: Record<string, { slug: string; zh: string; en: string }> = {
  "LED Track light": { slug: "track-light", zh: "轨道灯", en: "LED Track Light" },
  "LED Module": { slug: "led-module", zh: "LED模组/投光灯", en: "LED Module / Floodlight" },
  "AR111 Front Ring": { slug: "ar111-frame", zh: "AR111灯框", en: "AR111 Front Ring" },
  "LED Strip light": { slug: "strip-light", zh: "灯带", en: "LED Strip Light" },
  "Linear light": { slug: "linear-light", zh: "线条灯", en: "Linear Light" },
  "LED power supply": { slug: "power-supply", zh: "LED电源", en: "LED Power Supply" },
  "Decorative panel": { slug: "decorative-panel", zh: "装饰板", en: "Decorative Panel" },
};

async function main() {
  // Create categories
  for (const [, cat] of Object.entries(categoryMap)) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        slug: cat.slug,
        content: { zh: { name: cat.zh }, en: { name: cat.en } },
        sortOrder: 10,
        isActive: true,
      },
    });
  }
  console.log("Categories ready");

  // Get category IDs
  const allCats = await prisma.category.findMany();
  const catIdMap: Record<string, string> = {};
  for (const c of allCats) {
    catIdMap[c.slug] = c.id;
  }

  // Create products
  let created = 0;
  let skipped = 0;
  for (const p of products) {
    const slug = p.model.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const catInfo = categoryMap[p.item] || categoryMap["Decorative panel"];
    const categoryId = catIdMap[catInfo.slug];

    // Build specs
    const specs: Record<string, string> = {};
    if (p.watt) specs.power = p.watt;
    if (p.color) specs.cct = p.color;
    specs.qty_per_carton = String(p.qtyPerCarton);
    specs.carton_length = String(p.cL);
    specs.carton_width = String(p.cW);
    specs.carton_height = String(p.cH);
    specs.net_weight = String(p.nw);
    specs.gross_weight = String(p.gw);

    // Check if exists
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      skipped++;
      continue;
    }

    await prisma.product.create({
      data: {
        slug,
        modelNumber: p.model,
        content: {
          zh: { name: p.desc.split("\n")[0].slice(0, 80), description: p.desc },
          en: { name: p.desc.split("\n")[0].slice(0, 80), description: p.desc },
        },
        price: p.price,
        specs,
        isActive: true,
        isFeatured: false,
        categoryId,
      },
    });
    created++;
    console.log(`Created: ${p.model}`);
  }

  console.log(`Done. Created: ${created}, Skipped (exists): ${skipped}`);
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); prisma.$disconnect(); });
