import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { ALLOWED_IMAGE_TYPES, ALLOWED_DOC_TYPES, MAX_IMAGE_SIZE, MAX_DOC_SIZE } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const type = formData.get("type") as string || "image";

  if (!file) {
    return NextResponse.json({ error: "未提供文件" }, { status: 400 });
  }

  // Validate file type and size
  const allowedTypes = type === "image" ? ALLOWED_IMAGE_TYPES : [...ALLOWED_DOC_TYPES, ...ALLOWED_IMAGE_TYPES];
  const maxSize = type === "image" ? MAX_IMAGE_SIZE : MAX_DOC_SIZE;

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "不支持的文件类型" }, { status: 400 });
  }

  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `文件大小超过限制(${maxSize / 1024 / 1024}MB)` },
      { status: 400 }
    );
  }

  // Generate unique filename
  const ext = path.extname(file.name);
  const sanitizedName = file.name
    .replace(ext, "")
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, "_")
    .slice(0, 50);
  const uniqueName = `${randomUUID().slice(0, 8)}-${sanitizedName}${ext}`;

  // Determine upload directory
  const typeDir = type === "image" ? "images" : type === "certificate" ? "certificates" : "documents";
  const uploadDir = path.join(process.cwd(), "uploads", typeDir);

  // Ensure directory exists
  await mkdir(uploadDir, { recursive: true });

  // Write file
  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(uploadDir, uniqueName);
  await writeFile(filePath, buffer);

  const url = `/api/files/${typeDir}/${uniqueName}`;

  return NextResponse.json({
    url,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  });
}
