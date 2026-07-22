import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  const product = await prisma.product.findUnique({
    where: { id, ...(session ? {} : { isActive: true }) },
    include: {
      category: true,
      images: { where: { variantId: null }, orderBy: { sortOrder: "asc" } },
      documents: { orderBy: { createdAt: "desc" } },
      certificates: { orderBy: { createdAt: "desc" } },
      variants: {
        orderBy: { sortOrder: "asc" },
        include: { images: { orderBy: { sortOrder: "asc" } } },
      },
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

  const product = await prisma.$transaction(async (tx) => {
    const updatedProduct = await tx.product.update({
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

  // Update product-level images (variantId IS NULL). Variant-level images are
  // managed below alongside their variant — cascade deletes when a variant is removed.
  if (body.images !== undefined) {
    await tx.productImage.deleteMany({ where: { productId: id, variantId: null } });
    if (body.images?.length) {
      await tx.productImage.createMany({
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
    await tx.productDocument.deleteMany({ where: { productId: id } });
    if (body.documents?.length) {
      await tx.productDocument.createMany({
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

  // Preserve existing variant IDs so quote and inquiry references remain stable.
  if (body.variants !== undefined) {
    const retainedVariantIds: string[] = [];
    if (body.variants?.length) {
      for (let i = 0; i < body.variants.length; i++) {
        const v = body.variants[i] as {
          id?: string;
          sku: string; price?: number | null; specs?: Record<string, string> | null;
          sortOrder?: number; isActive?: boolean;
          images?: { url: string; fileName?: string }[];
        };
        const variantData = {
          sku: v.sku,
          price: v.price ?? null,
          specs: v.specs || {},
          sortOrder: v.sortOrder ?? i,
          isActive: v.isActive ?? true,
        };
        const variant = v.id
          ? await tx.productVariant.update({
              where: { id: v.id, productId: id },
              data: variantData,
            })
          : await tx.productVariant.create({
              data: {
            productId: id,
                ...variantData,
              },
            });
        retainedVariantIds.push(variant.id);
        await tx.productImage.deleteMany({ where: { productId: id, variantId: variant.id } });
        if (v.images?.length) {
          await tx.productImage.createMany({
            data: v.images.map((img, idx) => ({
              productId: id,
              variantId: variant.id,
              url: img.url,
              alt: img.fileName || "",
              sortOrder: idx,
              isPrimary: false,
            })),
          },
          );
        }
      }
    }
    await tx.productVariant.deleteMany({
      where: {
        productId: id,
        ...(retainedVariantIds.length ? { id: { notIn: retainedVariantIds } } : {}),
      },
    });
  }

  // Update certificates
  if (body.certificates !== undefined) {
    await tx.productCertificate.deleteMany({ where: { productId: id } });
    if (body.certificates?.length) {
      await tx.productCertificate.createMany({
        data: body.certificates.map(
          (cert: { url: string; fileName: string; fileSize: number; mimeType: string; name?: string; certType?: string }) => ({
            productId: id, name: cert.name || cert.fileName, certType: cert.certType || "其他",
            fileName: cert.fileName, filePath: cert.url, fileSize: cert.fileSize, mimeType: cert.mimeType,
          })
        ),
      });
    }
  }

    return updatedProduct;
  });

  return NextResponse.json(product);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const { id } = await params;
  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      const [quoteCount, inquiryCount] = await Promise.all([
        prisma.quoteItem.count({ where: { productId: id } }),
        prisma.inquiryProduct.count({ where: { productId: id } }),
      ]);
      const refs: string[] = [];
      if (quoteCount > 0) refs.push(`${quoteCount} 份报价单`);
      if (inquiryCount > 0) refs.push(`${inquiryCount} 条询价记录`);
      const msg = refs.length
        ? `该产品已被 ${refs.join("、")} 引用，无法删除。请先处理相关记录，或改为将产品下架。`
        : "该产品存在关联数据，无法删除。";
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    throw e;
  }
}
