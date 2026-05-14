import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inquiryUpdateSchema } from "@/lib/validations/inquiry";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      products: {
        include: {
          product: {
            include: {
              images: { where: { variantId: null }, take: 1 },
              category: true,
            },
          },
          variant: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
        },
      },
    },
  });

  if (!inquiry) {
    return NextResponse.json({ error: "询价不存在" }, { status: 404 });
  }

  return NextResponse.json(inquiry);
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
  const result = inquiryUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "验证失败", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const inquiry = await prisma.inquiry.update({
    where: { id },
    data: result.data,
  });

  return NextResponse.json(inquiry);
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
  await prisma.inquiry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
