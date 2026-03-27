import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create default admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedPassword,
      name: "管理员",
      role: "SUPER_ADMIN",
    },
  });
  console.log("Admin user ready");

  // Seed common LED attribute definitions
  const attrs = [
    { key: "power", name: { zh: "功率", en: "Power" }, type: "TEXT", unit: "W", scope: "PRODUCT", isHighlight: true },
    { key: "cct", name: { zh: "色温", en: "CCT" }, type: "SELECT", unit: "K", scope: "PRODUCT", isHighlight: true, isFilterable: true },
    { key: "luminous_flux", name: { zh: "光通量", en: "Luminous Flux" }, type: "TEXT", unit: "lm", scope: "PRODUCT", isHighlight: true },
    { key: "cri", name: { zh: "显色指数", en: "CRI" }, type: "SELECT", unit: null, scope: "PRODUCT", isHighlight: true, isFilterable: true },
    { key: "beam_angle", name: { zh: "发光角度", en: "Beam Angle" }, type: "TEXT", unit: "°", scope: "PRODUCT", isHighlight: false },
    { key: "ip_rating", name: { zh: "防护等级", en: "IP Rating" }, type: "SELECT", unit: null, scope: "PRODUCT", isHighlight: true, isFilterable: true },
    { key: "voltage", name: { zh: "工作电压", en: "Voltage" }, type: "TEXT", unit: "V", scope: "PRODUCT", isHighlight: false },
    { key: "dimensions", name: { zh: "尺寸", en: "Dimensions" }, type: "TEXT", unit: "mm", scope: "PRODUCT", isHighlight: false },
    { key: "weight", name: { zh: "重量", en: "Weight" }, type: "TEXT", unit: "kg", scope: "PRODUCT", isHighlight: false },
    { key: "material", name: { zh: "材质", en: "Material" }, type: "TEXT", unit: null, scope: "PRODUCT", isHighlight: false },
    { key: "lifespan", name: { zh: "寿命", en: "Lifespan" }, type: "TEXT", unit: "h", scope: "PRODUCT", isHighlight: false },
    { key: "warranty", name: { zh: "质保", en: "Warranty" }, type: "TEXT", unit: null, scope: "PRODUCT", isHighlight: false },
  ];

  for (const [i, attr] of attrs.entries()) {
    await prisma.attributeDefinition.upsert({
      where: { key: attr.key },
      update: {},
      create: {
        key: attr.key,
        name: attr.name,
        type: attr.type,
        unit: attr.unit,
        scope: attr.scope,
        isHighlight: attr.isHighlight ?? false,
        isFilterable: attr.isFilterable ?? false,
        sortOrder: i,
      },
    });
  }
  console.log(`Created ${attrs.length} attribute definitions`);

  // Add options for SELECT type attributes
  const cctAttr = await prisma.attributeDefinition.findUnique({ where: { key: "cct" } });
  if (cctAttr) {
    const cctOptions = ["2700K", "3000K", "3500K", "4000K", "5000K", "6000K", "6500K"];
    for (const val of cctOptions) {
      const exists = await prisma.attributeOption.findFirst({ where: { attributeId: cctAttr.id, value: val } });
      if (!exists) await prisma.attributeOption.create({ data: { attributeId: cctAttr.id, value: val } });
    }
  }

  const criAttr = await prisma.attributeDefinition.findUnique({ where: { key: "cri" } });
  if (criAttr) {
    for (const val of [">70", ">80", ">90", ">95"]) {
      const exists = await prisma.attributeOption.findFirst({ where: { attributeId: criAttr.id, value: val } });
      if (!exists) await prisma.attributeOption.create({ data: { attributeId: criAttr.id, value: val } });
    }
  }

  const ipAttr = await prisma.attributeDefinition.findUnique({ where: { key: "ip_rating" } });
  if (ipAttr) {
    for (const val of ["IP20", "IP40", "IP44", "IP54", "IP65", "IP66", "IP67", "IP68"]) {
      const exists = await prisma.attributeOption.findFirst({ where: { attributeId: ipAttr.id, value: val } });
      if (!exists) await prisma.attributeOption.create({ data: { attributeId: ipAttr.id, value: val } });
    }
  }
  console.log("Created attribute options for CCT, CRI, IP Rating");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
