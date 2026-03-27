import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { QuotePdfDocument } from "@/components/quotes/quote-pdf-template";
import { format } from "date-fns";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      createdBy: { select: { name: true } },
    },
  });

  if (!quote) {
    return NextResponse.json({ error: "报价单不存在" }, { status: 404 });
  }

  const pdfData = {
    quoteNumber: quote.quoteNumber,
    title: quote.title || "报价单",
    date: format(quote.createdAt, "yyyy-MM-dd"),
    validDays: quote.validDays,
    currency: quote.currency,
    customerName: quote.customerName,
    customerCompany: quote.customerCompany || "",
    customerEmail: quote.customerEmail || "",
    customerPhone: quote.customerPhone || "",
    customerAddress: quote.customerAddress || "",
    items: quote.items.map((item, index) => ({
      index: index + 1,
      productName: item.productName,
      productModel: item.productModel,
      specification: item.specification || "",
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
    subtotal: Number(quote.subtotal),
    discount: Number(quote.discount),
    tax: Number(quote.tax),
    total: Number(quote.total),
    notes: quote.notes || "",
    createdBy: quote.createdBy.name,
  };

  const buffer = await renderToBuffer(QuotePdfDocument({ data: pdfData }));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${quote.quoteNumber}.pdf"`,
    },
  });
}
