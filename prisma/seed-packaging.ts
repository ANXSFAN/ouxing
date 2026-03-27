import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const packagingAttrs = [
    { key: "qty_per_carton", name: { zh: "每箱数量", en: "QTY/CTN" }, type: "NUMBER", unit: "pcs", scope: "PRODUCT" },
    { key: "carton_length", name: { zh: "箱长", en: "Carton L" }, type: "NUMBER", unit: "cm", scope: "PRODUCT" },
    { key: "carton_width", name: { zh: "箱宽", en: "Carton W" }, type: "NUMBER", unit: "cm", scope: "PRODUCT" },
    { key: "carton_height", name: { zh: "箱高", en: "Carton H" }, type: "NUMBER", unit: "cm", scope: "PRODUCT" },
    { key: "net_weight", name: { zh: "净重/箱", en: "N.W/CTN" }, type: "NUMBER", unit: "kg", scope: "PRODUCT" },
    { key: "gross_weight", name: { zh: "毛重/箱", en: "G.W/CTN" }, type: "NUMBER", unit: "kg", scope: "PRODUCT" },
  ];

  for (const [i, attr] of packagingAttrs.entries()) {
    await prisma.attributeDefinition.upsert({
      where: { key: attr.key },
      update: {},
      create: { ...attr, sortOrder: 100 + i, isHighlight: false, isFilterable: false },
    });
  }
  console.log(`Created ${packagingAttrs.length} packaging attributes`);
}

main().then(() => prisma.$disconnect());
