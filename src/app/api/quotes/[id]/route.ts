import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      items: { orderBy: { sortOrder: "asc" }, include: { product: true } },
      createdBy: { select: { name: true } },
    },
  });

  if (!quote) {
    return NextResponse.json({ error: "报价单不存在" }, { status: 404 });
  }

  return NextResponse.json(quote);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  // If only updating status
  if (body.status && Object.keys(body).length === 1) {
    const quote = await prisma.quote.update({
      where: { id },
      data: { status: body.status },
    });
    return NextResponse.json(quote);
  }

  // Full update
  const { items, ...data } = body;

  if (items) {
    const itemsWithTotals = items.map(
      (
        item: { quantity: number; unitPrice: number; [key: string]: unknown },
        index: number
      ) => ({
        ...item,
        totalPrice: item.quantity * item.unitPrice,
        sortOrder: index,
      })
    );

    const subtotal = itemsWithTotals.reduce(
      (sum: number, item: { totalPrice: number }) => sum + item.totalPrice,
      0
    );
    const total = subtotal - (data.discount || 0) + (data.tax || 0);

    // Delete old items and recreate
    await prisma.quoteItem.deleteMany({ where: { quoteId: id } });

    const quote = await prisma.quote.update({
      where: { id },
      data: {
        ...data,
        subtotal,
        total,
        items: { create: itemsWithTotals },
      },
      include: { items: true },
    });

    return NextResponse.json(quote);
  }

  const quote = await prisma.quote.update({
    where: { id },
    data,
  });
  return NextResponse.json(quote);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.quote.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
