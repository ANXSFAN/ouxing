import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { writeFileSync, existsSync } from 'fs';
import path from 'path';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const lines: string[] = [];

  const products = await prisma.product.findMany({
    take: 5,
    include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
  });

  lines.push(`cwd: ${process.cwd()}`);
  lines.push(`uploads exists: ${existsSync(path.join(process.cwd(), 'uploads'))}`);
  lines.push('');

  for (const p of products) {
    const img = p.images[0];
    if (!img) {
      lines.push(`${p.modelNumber}: 无图片`);
      continue;
    }
    const url = img.url;
    const imagePath = url.replace('/api/files/', '');
    const fullPath = path.join(process.cwd(), 'uploads', imagePath);
    const exists = existsSync(fullPath);
    lines.push(`${p.modelNumber}: url=${url} -> path=${fullPath} -> exists=${exists}`);
  }

  writeFileSync('check-images-output.txt', lines.join('\n'), 'utf-8');
}

main().then(() => prisma.$disconnect()).catch(e => { writeFileSync('check-images-output.txt', 'ERROR: ' + e.message, 'utf-8'); prisma.$disconnect(); });
