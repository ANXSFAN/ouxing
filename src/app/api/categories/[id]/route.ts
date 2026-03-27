import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const category = await prisma.category.findUnique({
    where: { id },
    include: { parent: true, children: true },
  });
  if (!category) return NextResponse.json({ error: "分类不存在" }, { status: 404 });
  return NextResponse.json(category);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  if (body.slug) {
    const existing = await prisma.category.findFirst({
      where: { slug: body.slug, NOT: { id } },
    });
    if (existing) return NextResponse.json({ error: "Slug已存在" }, { status: 400 });
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      slug: body.slug,
      content: body.content,
      parentId: body.parentId === "" ? null : body.parentId,
      sortOrder: body.sortOrder,
      isActive: body.isActive,
    },
  });
  return NextResponse.json(category);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const { id } = await params;
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    return NextResponse.json({ error: `该分类下有 ${productCount} 个产品，无法删除` }, { status: 400 });
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
