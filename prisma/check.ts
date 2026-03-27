import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const cats = await prisma.category.findMany({ take: 3 });
  for (const c of cats) {
    console.log(`slug: ${c.slug}, content type: ${typeof c.content}, content:`, JSON.stringify(c.content));
  }
}

main().then(() => prisma.$disconnect());
