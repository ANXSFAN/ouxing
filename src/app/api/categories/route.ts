import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { products: true } },
      parent: { select: { id: true, content: true } },
    },
  });
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const body = await request.json();
  if (!body.slug || !body.content) {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }

  const existing = await prisma.category.findUnique({ where: { slug: body.slug } });
  if (existing) return NextResponse.json({ error: "Slug已存在" }, { status: 400 });

  const category = await prisma.category.create({
    data: {
      slug: body.slug,
      content: body.content,
      parentId: body.parentId || null,
      sortOrder: body.sortOrder ?? 0,
      isActive: body.isActive ?? true,
    },
  });
  return NextResponse.json(category, { status: 201 });
}
