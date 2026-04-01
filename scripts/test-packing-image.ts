import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const lines: string[] = [];

  // Get a quote with items
  const quote = await prisma.quote.findFirst({
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!quote) { lines.push('No quotes found'); writeFileSync('test-packing-output.txt', lines.join('\n'), 'utf-8'); return; }

  lines.push(`Quote: ${quote.quoteNumber}, items: ${quote.items.length}`);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('test');

  ws.columns = [
    { key: 'A', width: 26 },
    { key: 'B', width: 14 },
  ];

  let rowIdx = 1;
  for (const item of quote.items) {
    const product = item.product;
    const imageUrl = product.images?.[0]?.url;
    lines.push(`Item: ${product.modelNumber}, imageUrl: ${imageUrl || 'none'}`);

    if (imageUrl) {
      try {
        const imagePath = imageUrl.replace('/api/files/', '');
        const fullPath = path.join(process.cwd(), 'uploads', imagePath);
        lines.push(`  fullPath: ${fullPath}, exists: ${existsSync(fullPath)}`);

        const imageBuffer = readFileSync(fullPath);
        lines.push(`  buffer size: ${imageBuffer.length}`);

        const ext = path.extname(fullPath).toLowerCase().replace('.', '');
        const extension = ext === 'jpg' ? 'jpeg' : ext as 'jpeg' | 'png' | 'gif';
        lines.push(`  extension: ${extension}`);

        const imageId = wb.addImage({
          buffer: imageBuffer as unknown as ExcelJS.Buffer,
          extension,
        });
        lines.push(`  imageId: ${imageId}`);

        ws.getRow(rowIdx).height = 80;
        ws.addImage(imageId, {
          tl: { col: 1, row: rowIdx - 1 } as ExcelJS.Anchor,
          br: { col: 2, row: rowIdx } as ExcelJS.Anchor,
          editAs: 'oneCell',
        });
        lines.push(`  Image added successfully`);
      } catch (e: any) {
        lines.push(`  ERROR: ${e.message}`);
      }
    }
    rowIdx++;
  }

  writeFileSync('test-packing-output.txt', lines.join('\n'), 'utf-8');
}

main().then(() => prisma.$disconnect()).catch(e => { writeFileSync('test-packing-output.txt', 'ERROR: ' + e.message, 'utf-8'); prisma.$disconnect(); });
