import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import path from "path";
import { randomUUID } from "crypto";
import { ALLOWED_IMAGE_TYPES, ALLOWED_DOC_TYPES, MAX_IMAGE_SIZE, MAX_DOC_SIZE } from "@/lib/constants";
import { uploadToStorage, type StorageFolder } from "@/lib/supabase-storage";

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

  // Generate unique filename (kept ASCII to avoid URL-encoding surprises)
  const ext = path.extname(file.name);
  const sanitizedName = file.name
    .replace(ext, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 50) || "file";
  const uniqueName = `${randomUUID().slice(0, 8)}-${sanitizedName}${ext.toLowerCase()}`;

  const folder: StorageFolder =
    type === "image" ? "images" : type === "certificate" ? "certificates" : "documents";

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { url } = await uploadToStorage(buffer, folder, uniqueName, file.type);
    return NextResponse.json({
      url,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "上传失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
