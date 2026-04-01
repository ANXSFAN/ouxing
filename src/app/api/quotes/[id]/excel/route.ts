import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import path from "path";
import { readFile } from "fs/promises";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(_request.url);
  const lang = (searchParams.get("lang") || "zh") as "zh" | "en";

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" }, take: 2 },
              category: true,
            },
          },
        },
      },
      createdBy: { select: { name: true } },
    },
  });

  if (!quote) return NextResponse.json({ error: "报价单不存在" }, { status: 404 });

  const isZh = lang === "zh";
  const altLang = isZh ? "en" : "zh";
  const loc = (content: unknown, field: "name" | "description") => {
    const c = content as Record<string, Record<string, string>> | null;
    return c?.[lang]?.[field] || c?.[altLang]?.[field] || "";
  };

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(isZh ? "报价表" : "Quotation", {
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true },
  });

  // ── Column widths (matching reference) ──
  ws.columns = [
    { key: "A", width: 36.4 },  // Picture 1
    { key: "B", width: 36.4 },  // Picture 2
    { key: "C", width: 12 },    // Power
    { key: "D", width: 27 },    // Specification
    { key: "E", width: 15 },    // Voltage
    { key: "F", width: 12.5 },  // Lumen
    { key: "G", width: 12 },    // CCT / Color
    { key: "H", width: 12 },    // Chip
    { key: "I", width: 11.5 },  // CRI
    { key: "J", width: 13.5 },  // Power Factor
    { key: "K", width: 13.5 },  // Beam Angle
    { key: "L", width: 12.5 },  // Material
    { key: "M", width: 13 },    // Product Size
    { key: "N", width: 12.5 },  // IP
    { key: "O", width: 13 },    // Price
    { key: "P", width: 21.5 },  // Remark
  ];

  const borderThin: Partial<ExcelJS.Borders> = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  const headerFont: Partial<ExcelJS.Font> = {
    bold: true, size: 14, name: "Arial",
  };

  const dataFont: Partial<ExcelJS.Font> = {
    size: 12, name: "Arial",
  };

  const centerAlign: Partial<ExcelJS.Alignment> = {
    horizontal: "center", vertical: "middle", wrapText: true,
  };

  // ── Row 1: Title ──
  ws.mergeCells("A1:P1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "欧达星产品报价表";
  titleCell.font = { size: 28, name: "宋体" };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
  ws.getRow(1).height = 50;

  // ── Row 2-3: Headers (two-row header) ──
  const headers: [string, string][] = [
    ["图片", "Picture"],           // A
    ["图片", "Picture"],           // B
    ["功率", "Power"],             // C
    ["", ""],                       // D — header only in row 3
    ["电压", "Voltage"],           // E
    ["流明", "Lumen"],             // F
    ["色温", "Color"],             // G
    ["芯片", "Chip"],              // H
    ["CRI", "CRI"],                // I
    ["功率因数", "Power Factor"],  // J
    ["光束角", "Beam Angle"],      // K
    ["材质", "Material"],          // L
    ["产品尺寸\n(mm)", "Product Size\n(mm)"], // M
    ["IP", "IP"],                  // N
    ["含税价RMB", "Unit Price(RMB)"], // O
    ["备注", "Remark"],            // P
  ];

  // D column row 3 header
  const dHeader: [string, string] = ["规格", "Specification"];

  // Merge header cells across rows 2-3 (all except D)
  const mergeCols = ["A","B","C","E","F","G","H","I","J","K","L","M","N","O","P"];
  mergeCols.forEach((col) => {
    ws.mergeCells(`${col}2:${col}3`);
  });

  ws.getRow(2).height = 32;
  ws.getRow(3).height = 32;

  // Set header values
  headers.forEach(([zh, en], i) => {
    const text = isZh ? zh : en;
    if (i === 3) {
      // D column: only row 3 has header
      const cell3 = ws.getCell(3, 4);
      cell3.value = isZh ? dHeader[0] : dHeader[1];
      cell3.font = headerFont;
      cell3.alignment = centerAlign;
      cell3.border = borderThin;
      cell3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
      // D row 2 empty but styled
      const cell2 = ws.getCell(2, 4);
      cell2.font = headerFont;
      cell2.alignment = centerAlign;
      cell2.border = borderThin;
      cell2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
      return;
    }
    const cell = ws.getCell(2, i + 1);
    cell.value = text;
    cell.font = headerFont;
    cell.alignment = centerAlign;
    cell.border = borderThin;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
  });

  // Style row 3 borders for merged cells
  for (let c = 1; c <= 16; c++) {
    const cell = ws.getCell(3, c);
    cell.border = borderThin;
    if (!cell.fill || (cell.fill as ExcelJS.FillPattern).pattern !== "solid") {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
    }
  }

  // ── Helper: load image and add to workbook ──
  async function addProductImage(
    imageUrl: string,
    col: number,
    row: number
  ): Promise<void> {
    try {
      const imagePath = imageUrl.replace("/api/files/", "");
      const fullPath = path.join(process.cwd(), "uploads", imagePath);
      const imageBuffer = await readFile(fullPath);
      const ext = path.extname(fullPath).toLowerCase().replace(".", "");
      const extension = ext === "jpg" ? "jpeg" : ext as "jpeg" | "png" | "gif";

      const imageId = wb.addImage({
        buffer: imageBuffer as unknown as ExcelJS.Buffer,
        extension,
      });

      ws.addImage(imageId, {
        tl: { col, row: row - 1 } as ExcelJS.Anchor,
        br: { col: col + 1, row } as ExcelJS.Anchor,
        editAs: "oneCell",
      });
    } catch {
      // Image not found, skip
    }
  }

  // ── Data rows ──
  const DATA_START_ROW = 4;
  let rowIdx = DATA_START_ROW;

  for (const item of quote.items) {
    const product = item.product;
    const specs = (product.specs as Record<string, string>) || {};
    const description = loc(product.content, "description") || item.specification || "";

    ws.getRow(rowIdx).height = 120;

    const values = [
      "",                              // A: Picture 1 (image inserted separately)
      "",                              // B: Picture 2 (image inserted separately)
      specs.power || "",               // C: Power
      description,                     // D: Specification / Description
      specs.voltage || "",             // E: Voltage
      specs.luminous_flux || specs.lumen || "",  // F: Lumen
      specs.cct || "",                 // G: CCT / Color
      specs.chip || "",                // H: Chip
      specs.cri || "",                 // I: CRI
      specs.power_factor || "",        // J: Power Factor
      specs.beam_angle || "",          // K: Beam Angle
      specs.material || "",            // L: Material
      specs.dimensions || specs.product_size || "",  // M: Product Size
      specs.ip_rating || "",           // N: IP
      Number(item.unitPrice),          // O: Unit Price
      item.notes || "",                // P: Remark
    ];

    values.forEach((v, i) => {
      const cell = ws.getCell(rowIdx, i + 1);
      cell.value = v;
      cell.font = dataFont;
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = borderThin;
    });

    // Insert product image 1 (column A)
    const image1Url = product.images?.[0]?.url;
    if (image1Url) {
      await addProductImage(image1Url, 0, rowIdx);
    }

    // Insert product image 2 (column B)
    const image2Url = product.images?.[1]?.url;
    if (image2Url) {
      await addProductImage(image2Url, 1, rowIdx);
    }

    rowIdx++;
  }

  // ── Footer row ──
  ws.mergeCells(`A${rowIdx}:P${rowIdx}`);
  const footerCell = ws.getCell(rowIdx, 1);
  footerCell.value = isZh ? "以上报价为含税出厂价" : "All prices above are factory prices including tax";
  footerCell.font = { bold: true, size: 12, name: "Arial" };
  footerCell.alignment = { horizontal: "center", vertical: "middle" };
  footerCell.border = borderThin;
  ws.getRow(rowIdx).height = 30;

  // ── Generate buffer ──
  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${quote.quoteNumber}-quotation.xlsx"`,
    },
  });
}
