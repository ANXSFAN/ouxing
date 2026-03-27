import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const attributes = await prisma.attributeDefinition.findMany({
      include: { options: { orderBy: { value: "asc" } } },
      orderBy: [{ isPinned: "desc" }, { sortOrder: "asc" }, { key: "asc" }],
    });
    return NextResponse.json(attributes);
  } catch (error) {
    console.error("Failed to fetch attributes:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const body = await request.json();

  if (!body.key || !body.name || !body.type || !body.scope) {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }

  try {
    const attribute = await prisma.attributeDefinition.create({
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
    return NextResponse.json(attribute, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "创建失败";
    if (msg.includes("Unique")) return NextResponse.json({ error: "属性Key已存在" }, { status: 400 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
