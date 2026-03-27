import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const attribute = await prisma.attributeDefinition.findUnique({
    where: { id },
    include: { options: { orderBy: { value: "asc" } } },
  });
  if (!attribute) return NextResponse.json({ error: "属性不存在" }, { status: 404 });
  return NextResponse.json(attribute);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  try {
    const attribute = await prisma.attributeDefinition.update({
      where: { id },
      data: {
        key: body.key,
        name: body.name,
        type: body.type,
        unit: body.unit || null,
        scope: body.scope,
        isHighlight: body.isHighlight ?? false,
        isFilterable: body.isFilterable ?? false,
      },
    });
    return NextResponse.json(attribute);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "更新失败";
    if (msg.includes("Unique")) return NextResponse.json({ error: "属性Key已存在" }, { status: 400 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const { id } = await params;
  await prisma.attributeDefinition.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
