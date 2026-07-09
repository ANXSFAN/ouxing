import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site-config";
import ProductDetailClient from "./product-detail-client";

type ContentJson = Record<string, { name?: string; description?: string }>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { where: { variantId: null }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });
  if (!product) {
    return { title: "产品不存在" };
  }
  const content = product.content as ContentJson | null;
  const name = content?.zh?.name || content?.en?.name || product.modelNumber;
  const description =
    content?.zh?.description || content?.en?.description || siteConfig.description;
  return {
    title: name,
    description,
    openGraph: {
      title: `${name} — ${siteConfig.name}`,
      description,
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
    },
  };
}

export default function ProductDetailPage() {
  return <ProductDetailClient />;
}
