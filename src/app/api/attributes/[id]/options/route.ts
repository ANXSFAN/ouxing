import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const { id } = await params;
  const { value, color } = await request.json();

  if (!value?.trim()) {
    return NextResponse.json({ error: "选项值不能为空" }, { status: 400 });
  }

  const option = await prisma.attributeOption.create({
    data: { attributeId: id, value: value.trim(), color: color || null },
  });
  return NextResponse.json(option, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const optionId = searchParams.get("optionId");
  if (!optionId) return NextResponse.json({ error: "缺少optionId" }, { status: 400 });

  await prisma.attributeOption.delete({ where: { id: optionId } });
  return NextResponse.json({ success: true });
}
