import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inquirySchema } from "@/lib/validations/inquiry";
import { ITEMS_PER_PAGE } from "@/lib/constants";

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
  if (status) {
    where.status = status;
  }

  const [inquiries, total] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      include: {
        products: { include: { product: { include: { images: { take: 1 } } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.inquiry.count({ where }),
  ]);

  return NextResponse.json({
    inquiries,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = inquirySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "验证失败", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { productIds, ...data } = result.data;

  try {
    const inquiry = await prisma.inquiry.create({
      data: {
        ...data,
        message: data.message || null,
        products: productIds?.length
          ? {
              create: productIds.map((p) => ({
                productId: p.productId,
                quantity: p.quantity ?? null,
                expectedPrice: p.expectedPrice ?? null,
              })),
            }
          : undefined,
      },
    });

    return NextResponse.json(inquiry, { status: 201 });
  } catch (error) {
    console.error("Failed to create inquiry:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建询价失败" },
      { status: 500 }
    );
  }
}
