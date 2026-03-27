import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: filePath } = await params;
  const fullPath = path.join(process.cwd(), "uploads", ...filePath);

  // Prevent path traversal
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fullPath.startsWith(uploadsDir)) {
    return NextResponse.json({ error: "禁止访问" }, { status: 403 });
  }

  try {
    await stat(fullPath);
    const buffer = await readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();

    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";
    const isImage = contentType.startsWith("image/");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        ...(isImage
          ? {}
          : { "Content-Disposition": `attachment; filename="${path.basename(fullPath)}"` }),
      },
    });
  } catch {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }
}
