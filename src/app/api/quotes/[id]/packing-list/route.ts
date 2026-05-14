import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { format } from "date-fns";
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
              images: { where: { variantId: null }, orderBy: { sortOrder: "asc" }, take: 1 },
              category: true,
            },
          },
          variant: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
        },
      },
      createdBy: { select: { name: true } },
    },
  });

  if (!quote) return NextResponse.json({ error: "报价单不存在" }, { status: 404 });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("发货清单", {
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true },
  });

  // ── Column widths ──
  ws.columns = [
    { key: "A", width: 26 },   // Factory Model / SKU
    { key: "B", width: 14 },   // Picture
    { key: "C", width: 20 },   // Product name / Category
    { key: "D", width: 56 },   // Description
    { key: "E", width: 10 },   // Watt
    { key: "F", width: 12 },   // Color
    { key: "G", width: 12 },   // QTY/PCS
    { key: "H", width: 14 },   // QTY/CTN
    { key: "I", width: 10 },   // CTNS
    { key: "J", width: 9 },    // L
    { key: "K", width: 9 },    // W
    { key: "L", width: 9 },    // H
    { key: "M", width: 13 },   // Total CBM
    { key: "N", width: 10 },   // N.W
    { key: "O", width: 10 },   // G.W
    { key: "P", width: 12 },   // T.N.W
    { key: "Q", width: 12 },   // T.G.W
    { key: "R", width: 13 },   // Unit price
    { key: "S", width: 14 },   // Total
    { key: "T", width: 14 },   // 备注
  ];

  const borderThin: Partial<ExcelJS.Borders> = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  const headerFont: Partial<ExcelJS.Font> = {
    bold: true, size: 11, name: "Arial",
  };

  const dataFont: Partial<ExcelJS.Font> = {
    size: 11, name: "Arial",
  };

  const centerAlign: Partial<ExcelJS.Alignment> = {
    horizontal: "center", vertical: "middle", wrapText: true,
  };

  const isZh = lang === "zh";

  // ── Row 1: Title ──
  const dateStr = format(quote.createdAt, "yyyy/M/d");
  ws.mergeCells("A1:O1");
  const titleCell = ws.getCell("A1");
  titleCell.value = isZh
    ? `集装箱出货产品清单            出货日期: ${dateStr}`
    : `Container Shipment Product Invoice            Shipping Date: ${dateStr}`;
  titleCell.font = { bold: true, size: 16, name: "Arial" };
  titleCell.alignment = { vertical: "middle" };
  ws.getRow(1).height = 40;

  // ── Row 2: Quote number ──
  ws.mergeCells("A2:O2");
  const subCell = ws.getCell("A2");
  subCell.value = isZh
    ? `报价编号: ${quote.quoteNumber}    客户: ${quote.customerName}${quote.customerCompany ? " / " + quote.customerCompany : ""}`
    : `Quote No.: ${quote.quoteNumber}    Customer: ${quote.customerName}${quote.customerCompany ? " / " + quote.customerCompany : ""}`;
  subCell.font = { size: 12, name: "Arial" };
  subCell.alignment = { vertical: "middle" };
  ws.getRow(2).height = 30;

  // ── Row 3: Empty spacer ──
  ws.getRow(3).height = 6;

  // ── Row 4-5: Header ──
  const headers = [
    isZh ? "工厂型号" : "Factory Model",
    isZh ? "图片" : "Picture",
    isZh ? "品类" : "Product name",
    isZh ? "描述" : "Description",
    isZh ? "功率" : "Watt",
    isZh ? "颜色" : "Color",
    "QTY/PCS",
    isZh ? "QTY/CTN\n每箱数量" : "QTY/CTN",
    isZh ? "CTNS\n箱数" : "CTNS",
    isZh ? "包装尺寸 (CM)" : "Packing Size (CM)", "", "",
    "Total CBM",
    "N.W\nKG", "G.W\nKG", "T.N.W\nKG", "T.G.W\nKG",
    isZh ? "单价" : "Unit price",
    isZh ? "合计" : "Total",
    isZh ? "备注" : "Remark",
  ];

  const subHeaders = [
    "", "", "", "", "", "", "", "", "",
    "L", "W", "H", "",
    "", "", "", "",
    "RMB", "RMB", "",
  ];

  // Merge "Packing Size" across J4:L4
  ws.mergeCells("J4:L4");
  // Merge headers that span 2 rows
  const singleRowCols = ["A","B","C","D","E","F","G","H","I","M","N","O","P","Q","T"];
  singleRowCols.forEach((col) => {
    ws.mergeCells(`${col}4:${col}5`);
  });

  ws.getRow(4).height = 32;
  ws.getRow(5).height = 24;

  headers.forEach((h, i) => {
    const cell = ws.getCell(4, i + 1);
    cell.value = h;
    cell.font = headerFont;
    cell.alignment = centerAlign;
    cell.border = borderThin;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
  });

  subHeaders.forEach((h, i) => {
    const cell = ws.getCell(5, i + 1);
    if (h) cell.value = h;
    cell.font = { ...headerFont, size: 9 };
    cell.alignment = centerAlign;
    cell.border = borderThin;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
  });

  // ── Data rows ──
  const DATA_START_ROW = 6;
  let rowIdx = DATA_START_ROW;

  const altLang = lang === "zh" ? "en" : "zh";
  const loc = (content: unknown, field: "name" | "description") => {
    const c = content as Record<string, Record<string, string>> | null;
    return c?.[lang]?.[field] || c?.[altLang]?.[field] || "";
  };

  for (const item of quote.items) {
    const product = item.product;
    const variant = item.variant;
    const productSpecs = (product.specs as Record<string, string>) || {};
    const variantSpecs = (variant?.specs as Record<string, string> | undefined) || {};
    // Variant specs override product defaults (e.g. different carton size for some SKUs).
    const specs: Record<string, string> = { ...productSpecs, ...variantSpecs };
    const skuModel = variant?.sku || product.modelNumber;
    const description = loc(product.content, "description") || item.specification || "";
    const categoryName = product.category ? loc(product.category.content, "name") : "";

    const r = rowIdx;
    const qty = item.quantity;
    const unitPrice = Number(item.unitPrice);
    const qtyPerCarton = parseFloat(specs.qty_per_carton) || 1;
    const cL = parseFloat(specs.carton_length) || 0;
    const cW = parseFloat(specs.carton_width) || 0;
    const cH = parseFloat(specs.carton_height) || 0;
    const nw = parseFloat(specs.net_weight) || 0;
    const gw = parseFloat(specs.gross_weight) || 0;

    // Pre-calculate results for formula fallback display
    const ctns = Math.ceil(qty / qtyPerCarton);
    const cbm = ctns * cL * cW * cH / 1000000;
    const tNW = ctns * nw;
    const tGW = ctns * gw;
    const lineTotal = qty * unitPrice;

    const row = ws.getRow(r);
    row.height = 80;

    // Static value columns
    const values: [number, unknown][] = [
      [1, skuModel],
      [2, ""],
      [3, categoryName || item.productName],
      [4, description],
      [5, specs.power || ""],
      [6, specs.cct || ""],
      [7, qty],                  // G: QTY/PCS
      [8, qtyPerCarton],         // H: QTY/CTN
      [10, cL || ""],            // J: L
      [11, cW || ""],            // K: W
      [12, cH || ""],            // L: H
      [14, nw || ""],            // N: N.W
      [15, gw || ""],            // O: G.W
      [18, unitPrice],           // R: Unit Price
      [20, item.notes || ""],    // T: Remark
    ];

    values.forEach(([col, v]) => {
      const cell = ws.getCell(r, col as number);
      cell.value = v as ExcelJS.CellValue;
      cell.font = dataFont;
      cell.alignment = {
        horizontal: (col as number) >= 7 ? "center" : "left",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = borderThin;
    });

    // Formula columns — Excel will recalculate these dynamically
    const formulaCells: [number, string, number][] = [
      [9,  `IFERROR(CEILING(G${r}/H${r},1),0)`, ctns],                    // I: CTNS
      [13, `I${r}*J${r}*K${r}*L${r}/1000000`, +cbm.toFixed(4)],          // M: CBM
      [16, `I${r}*N${r}`, +tNW.toFixed(1)],                               // P: T.N.W
      [17, `I${r}*O${r}`, +tGW.toFixed(1)],                               // Q: T.G.W
      [19, `G${r}*R${r}`, +lineTotal.toFixed(2)],                         // S: Total
    ];

    formulaCells.forEach(([col, formula, result]) => {
      const cell = ws.getCell(r, col);
      cell.value = { formula, result } as ExcelJS.CellFormulaValue;
      cell.font = dataFont;
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = borderThin;
      // Number formats
      if (col === 13) cell.numFmt = "0.0000";
      else if (col === 16 || col === 17) cell.numFmt = "0.0";
      else if (col === 19) cell.numFmt = "0.00";
    });

    // Insert image: variant-specific first, then product default.
    const imageUrl = variant?.images?.[0]?.url || product.images?.[0]?.url;
    if (imageUrl) {
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
          tl: { col: 1, row: r - 1 } as ExcelJS.Anchor,
          br: { col: 2, row: r } as ExcelJS.Anchor,
          editAs: "oneCell",
        });
      } catch {
        // Image not found, skip
      }
    }

    rowIdx++;
  }

  // ── Summary row — uses SUM formulas so totals auto-update on row add/delete ──
  const lastDataRow = rowIdx - 1;
  const sumRow = ws.getRow(rowIdx);
  sumRow.height = 30;
  ws.getCell(rowIdx, 1).value = "TOTAL";

  const sumFormulas: [number, string, string?][] = [
    [7,  `SUM(G${DATA_START_ROW}:G${lastDataRow})`],               // QTY
    [9,  `SUM(I${DATA_START_ROW}:I${lastDataRow})`],               // CTNS
    [13, `SUM(M${DATA_START_ROW}:M${lastDataRow})`, "0.0000"],     // CBM
    [16, `SUM(P${DATA_START_ROW}:P${lastDataRow})`, "0.0"],        // T.N.W
    [17, `SUM(Q${DATA_START_ROW}:Q${lastDataRow})`, "0.0"],        // T.G.W
    [19, `SUM(S${DATA_START_ROW}:S${lastDataRow})`, "0.00"],       // Grand Total
  ];

  sumFormulas.forEach(([col, formula, numFmt]) => {
    const cell = ws.getCell(rowIdx, col as number);
    cell.value = { formula } as ExcelJS.CellFormulaValue;
    if (numFmt) cell.numFmt = numFmt as string;
  });

  for (let c = 1; c <= 20; c++) {
    const cell = ws.getCell(rowIdx, c);
    cell.font = { ...headerFont, size: 10 };
    cell.alignment = centerAlign;
    cell.border = borderThin;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE699" } };
  }

  // ── Generate buffer ──
  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${quote.quoteNumber}-packing-list.xlsx"`,
    },
  });
}
