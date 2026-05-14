import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { fetchStoredFile } from "@/lib/supabase-storage";

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
              images: { where: { variantId: null }, orderBy: { sortOrder: "asc" }, take: 2 },
              category: true,
            },
          },
          variant: { include: { images: { orderBy: { sortOrder: "asc" }, take: 2 } } },
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
    { key: "G", width: 12 },    // Warranty
    { key: "H", width: 12 },    // CCT / Color
    { key: "I", width: 12 },    // Chip
    { key: "J", width: 11.5 },  // CRI
    { key: "K", width: 13.5 },  // Power Factor
    { key: "L", width: 13.5 },  // Beam Angle
    { key: "M", width: 12.5 },  // Material
    { key: "N", width: 13 },    // Product Size
    { key: "O", width: 12.5 },  // IP
    { key: "P", width: 13 },    // Price
    { key: "Q", width: 21.5 },  // Remark
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
  ws.mergeCells("A1:Q1");
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
    ["质保", "Warranty"],          // G
    ["色温", "Color"],             // H
    ["芯片", "Chip"],              // I
    ["CRI", "CRI"],                // J
    ["功率因数", "Power Factor"],  // K
    ["光束角", "Beam Angle"],      // L
    ["材质", "Material"],          // M
    ["产品尺寸\n(mm)", "Product Size\n(mm)"], // N
    ["IP", "IP"],                  // O
    ["含税价RMB", "Unit Price(RMB)"], // P
    ["备注", "Remark"],            // Q
  ];

  // D column row 3 header
  const dHeader: [string, string] = ["规格", "Specification"];

  // Merge header cells across rows 2-3 (all except D)
  const mergeCols = ["A","B","C","E","F","G","H","I","J","K","L","M","N","O","P","Q"];
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
  for (let c = 1; c <= 17; c++) {
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
      const imageBuffer = await fetchStoredFile(imageUrl);
      const extMatch = imageUrl.toLowerCase().match(/\.([a-z]+)(?:\?|$)/);
      const raw = extMatch?.[1] || "jpeg";
      const extension = (raw === "jpg" ? "jpeg" : raw) as "jpeg" | "png" | "gif";

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
    const variant = item.variant;
    const productSpecs = (product.specs as Record<string, string>) || {};
    const variantSpecs = (variant?.specs as Record<string, string> | undefined) || {};
    const specs: Record<string, string> = { ...productSpecs, ...variantSpecs };
    const description = loc(product.content, "description") || item.specification || "";
    const variantImages = variant?.images || [];
    const fallbackImages = product.images || [];

    ws.getRow(rowIdx).height = 120;

    const values = [
      "",                              // A: Picture 1 (image inserted separately)
      "",                              // B: Picture 2 (image inserted separately)
      specs.power || "",               // C: Power
      description,                     // D: Specification / Description
      specs.voltage || "",             // E: Voltage
      specs.luminous_flux || specs.lumen || "",  // F: Lumen
      specs.warranty || "",            // G: Warranty
      specs.cct || "",                 // H: CCT / Color
      specs.chip || "",                // I: Chip
      specs.cri || "",                 // J: CRI
      specs.power_factor || "",        // K: Power Factor
      specs.beam_angle || "",          // L: Beam Angle
      specs.material || "",            // M: Material
      specs.dimensions || specs.product_size || "",  // N: Product Size
      specs.ip_rating || "",           // O: IP
      Number(item.unitPrice),          // P: Unit Price
      item.notes || "",                // Q: Remark
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

    // Picture columns: prefer the variant's own gallery, fall back to the product's.
    const galleryImages = variantImages.length > 0 ? variantImages : fallbackImages;

    const image1Url = galleryImages[0]?.url;
    if (image1Url) {
      await addProductImage(image1Url, 0, rowIdx);
    }

    const image2Url = galleryImages[1]?.url;
    if (image2Url) {
      await addProductImage(image2Url, 1, rowIdx);
    }

    rowIdx++;
  }

  // ── Footer row ──
  ws.mergeCells(`A${rowIdx}:Q${rowIdx}`);
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
