import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

const translations: Record<string, { name: string; description: string }> = {
  "panel-light": { name: "Panel Light", description: "LED Panel Light Series" },
  "downlight": { name: "Downlight", description: "LED Downlight Series" },
  "spotlight": { name: "Spotlight", description: "LED Spotlight Series" },
  "tube-light": { name: "Tube Light", description: "LED Tube Light Series" },
  "strip-light": { name: "Strip Light", description: "LED Strip Light Series" },
  "high-bay": { name: "High Bay Light", description: "LED High Bay Light Series" },
  "flood-light": { name: "Flood Light", description: "LED Flood Light Series" },
  "street-light": { name: "Street Light", description: "LED Street Light Series" },
};

async function main() {
  for (const [slug, en] of Object.entries(translations)) {
    const cat = await prisma.category.findUnique({ where: { slug } });
    if (!cat) continue;
    const content = cat.content as Record<string, Record<string, string>>;
    content.en = en;
    await prisma.category.update({ where: { slug }, data: { content } });
    console.log(`Fixed: ${slug} -> ${en.name}`);
  }
}

main().then(() => prisma.$disconnect());
