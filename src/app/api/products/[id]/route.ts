import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      documents: { orderBy: { createdAt: "desc" } },
      certificates: { orderBy: { createdAt: "desc" } },
      variants: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!product) return NextResponse.json({ error: "产品不存在" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const product = await prisma.product.update({
    where: { id },
    data: {
      slug: body.slug,
      modelNumber: body.modelNumber,
      content: body.content,
      price: body.price ?? null,
      specs: body.specs || null,
      isActive: body.isActive,
      isFeatured: body.isFeatured,
      categoryId: body.categoryId || null,
    },
  });

  // Update images
  if (body.images !== undefined) {
    await prisma.productImage.deleteMany({ where: { productId: id } });
    if (body.images?.length) {
      await prisma.productImage.createMany({
        data: body.images.map(
          (img: { url: string; fileName?: string }, index: number) => ({
            productId: id, url: img.url, alt: img.fileName || "",
            sortOrder: index, isPrimary: index === 0,
          })
        ),
      });
    }
  }

  // Update documents
  if (body.documents !== undefined) {
    await prisma.productDocument.deleteMany({ where: { productId: id } });
    if (body.documents?.length) {
      await prisma.productDocument.createMany({
        data: body.documents.map(
          (doc: { url: string; fileName: string; fileSize: number; mimeType: string; name?: string; docType?: string }) => ({
            productId: id, name: doc.name || doc.fileName, fileName: doc.fileName,
            filePath: doc.url, fileSize: doc.fileSize, mimeType: doc.mimeType,
            docType: (doc.docType as "DATASHEET" | "SPEC_SHEET" | "MANUAL" | "IES_FILE" | "OTHER") || "DATASHEET",
          })
        ),
      });
    }
  }

  // Update variants
  if (body.variants !== undefined) {
    await prisma.productVariant.deleteMany({ where: { productId: id } });
    if (body.variants?.length) {
      await prisma.productVariant.createMany({
        data: body.variants.map(
          (v: { sku: string; label: string; price?: number | null; attributes?: Record<string, string> | null; sortOrder?: number; isActive?: boolean }, index: number) => ({
            productId: id,
            sku: v.sku,
            label: v.label,
            price: v.price ?? null,
            attributes: v.attributes ?? undefined,
            sortOrder: v.sortOrder ?? index,
            isActive: v.isActive ?? true,
          })
        ),
      });
    }
  }

  // Update certificates
  if (body.certificates !== undefined) {
    await prisma.productCertificate.deleteMany({ where: { productId: id } });
    if (body.certificates?.length) {
      await prisma.productCertificate.createMany({
        data: body.certificates.map(
          (cert: { url: string; fileName: string; fileSize: number; mimeType: string; name?: string; certType?: string }) => ({
            productId: id, name: cert.name || cert.fileName, certType: cert.certType || "其他",
            fileName: cert.fileName, filePath: cert.url, fileSize: cert.fileSize, mimeType: cert.mimeType,
          })
        ),
      });
    }
  }

  return NextResponse.json(product);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
