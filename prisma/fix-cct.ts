import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Change CCT from SELECT to TEXT
  await prisma.attributeDefinition.update({
    where: { key: "cct" },
    data: { type: "TEXT" },
  });
  // Delete CCT options (no longer needed for TEXT type)
  const cct = await prisma.attributeDefinition.findUnique({ where: { key: "cct" } });
  if (cct) {
    await prisma.attributeOption.deleteMany({ where: { attributeId: cct.id } });
  }
  console.log("CCT changed to TEXT type, options removed");
}
main().then(() => prisma.$disconnect());
