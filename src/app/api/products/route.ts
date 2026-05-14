import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PRODUCTS_PER_PAGE } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || String(PRODUCTS_PER_PAGE));
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const featured = searchParams.get("featured");
  const all = searchParams.get("all");

  const where: Record<string, unknown> = {};
  if (!all) where.isActive = true;
  if (category) where.categoryId = category;
  if (featured === "true") where.isFeatured = true;

  // Search in content JSON or modelNumber
  if (search) {
    where.OR = [
      { modelNumber: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  // Specs filtering: spec.key=value (e.g. spec.cct=4000K)
  const specFilters: { path: string[]; equals: string }[] = [];
  searchParams.forEach((value, key) => {
    if (key.startsWith("spec.")) {
      const specKey = key.slice(5);
      specFilters.push({ path: [specKey], equals: value });
    }
  });
  if (specFilters.length > 0) {
    where.AND = specFilters.map((f) => ({
      specs: { path: f.path, equals: f.equals },
    }));
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        images: { where: { variantId: null }, orderBy: { sortOrder: "asc" }, take: 1 },
        variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    products,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const body = await request.json();

  if (!body.slug || !body.modelNumber || !body.content) {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      slug: body.slug,
      modelNumber: body.modelNumber,
      content: body.content,
      price: body.price ?? null,
      specs: body.specs || null,
      isActive: body.isActive ?? true,
      isFeatured: body.isFeatured ?? false,
      categoryId: body.categoryId || null,
    },
  });

  // Handle product-level images (variantId IS NULL)
  if (body.images?.length) {
    await prisma.productImage.createMany({
      data: body.images.map(
        (img: { url: string; fileName?: string }, index: number) => ({
          productId: product.id, url: img.url, alt: img.fileName || "",
          sortOrder: index, isPrimary: index === 0,
        })
      ),
    });
  }

  // Handle documents
  if (body.documents?.length) {
    await prisma.productDocument.createMany({
      data: body.documents.map(
        (doc: { url: string; fileName: string; fileSize: number; mimeType: string; name?: string; docType?: string }) => ({
          productId: product.id, name: doc.name || doc.fileName, fileName: doc.fileName,
          filePath: doc.url, fileSize: doc.fileSize, mimeType: doc.mimeType,
          docType: (doc.docType as "DATASHEET" | "SPEC_SHEET" | "MANUAL" | "IES_FILE" | "OTHER") || "DATASHEET",
        })
      ),
    });
  }

  // Handle variants (and their own images, if any)
  if (body.variants?.length) {
    for (let i = 0; i < body.variants.length; i++) {
      const v = body.variants[i] as {
        sku: string; price?: number | null; specs?: Record<string, string> | null;
        sortOrder?: number; isActive?: boolean;
        images?: { url: string; fileName?: string }[];
      };
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: v.sku,
          price: v.price ?? null,
          specs: v.specs || {},
          sortOrder: v.sortOrder ?? i,
          isActive: v.isActive ?? true,
        },
      });
      if (v.images?.length) {
        await prisma.productImage.createMany({
          data: v.images.map((img, idx) => ({
            productId: product.id,
            variantId: variant.id,
            url: img.url,
            alt: img.fileName || "",
            sortOrder: idx,
            isPrimary: false,
          })),
        });
      }
    }
  }

  // Handle certificates
  if (body.certificates?.length) {
    await prisma.productCertificate.createMany({
      data: body.certificates.map(
        (cert: { url: string; fileName: string; fileSize: number; mimeType: string; name?: string; certType?: string }) => ({
          productId: product.id, name: cert.name || cert.fileName, certType: cert.certType || "其他",
          fileName: cert.fileName, filePath: cert.url, fileSize: cert.fileSize, mimeType: cert.mimeType,
        })
      ),
    });
  }

  return NextResponse.json(product, { status: 201 });
}
