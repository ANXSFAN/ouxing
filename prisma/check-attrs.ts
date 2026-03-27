import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });
async function main() {
  const attrs = await prisma.attributeDefinition.findMany({
    select: { key: true, isHighlight: true, isFilterable: true },
  });
  console.log(JSON.stringify(attrs, null, 2));
}
main().then(() => prisma.$disconnect());
