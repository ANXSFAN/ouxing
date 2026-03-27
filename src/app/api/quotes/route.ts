import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { quoteCreateSchema } from "@/lib/validations/quote";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { format } from "date-fns";

async function generateQuoteNumber(): Promise<string> {
  const today = format(new Date(), "yyyyMMdd");
  const prefix = `QT-${today}-`;

  const lastQuote = await prisma.quote.findFirst({
    where: { quoteNumber: { startsWith: prefix } },
    orderBy: { quoteNumber: "desc" },
  });

  let seq = 1;
  if (lastQuote) {
    const lastSeq = parseInt(lastQuote.quoteNumber.split("-").pop() || "0");
    seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(3, "0")}`;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || String(ITEMS_PER_PAGE));
  const status = searchParams.get("status") || "";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      include: {
        items: true,
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.quote.count({ where }),
  ]);

  return NextResponse.json({
    quotes,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const body = await request.json();
  const result = quoteCreateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "验证失败", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { items, ...data } = result.data;
  const quoteNumber = await generateQuoteNumber();

  // Calculate totals
  const itemsWithTotals = items.map((item, index) => ({
    ...item,
    totalPrice: item.quantity * item.unitPrice,
    sortOrder: index,
  }));

  const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.totalPrice, 0);
  const total = subtotal - (data.discount || 0) + (data.tax || 0);

  const quote = await prisma.quote.create({
    data: {
      ...data,
      quoteNumber,
      subtotal,
      total,
      createdById: session.user.id,
      items: {
        create: itemsWithTotals,
      },
    },
    include: { items: true },
  });

  return NextResponse.json(quote, { status: 201 });
}
