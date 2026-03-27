import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const [productCount, categoryCount, pendingInquiries, totalInquiries, quoteCount, recentInquiries] =
    await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.category.count({ where: { isActive: true } }),
      prisma.inquiry.count({ where: { status: "PENDING" } }),
      prisma.inquiry.count(),
      prisma.quote.count(),
      prisma.inquiry.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { products: { include: { product: true } } },
      }),
    ]);

  return NextResponse.json({
    productCount,
    categoryCount,
    pendingInquiries,
    totalInquiries,
    quoteCount,
    recentInquiries,
  });
}
