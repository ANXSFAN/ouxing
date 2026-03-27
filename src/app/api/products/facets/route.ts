import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Returns distinct values for each filterable attribute key from active products' specs
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "";

  // Get all filterable attribute definitions
  const filterableAttrs = await prisma.attributeDefinition.findMany({
    where: { isFilterable: true },
    include: { options: { orderBy: { value: "asc" } } },
    orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
  });

  // Get all active products (optionally filtered by category) to extract spec values
  const where: Record<string, unknown> = { isActive: true };
  if (category) where.categoryId = category;

  const products = await prisma.product.findMany({
    where,
    select: { specs: true },
  });

  // Build facets: for each filterable attr, collect distinct values from products
  const facets = filterableAttrs.map((attr) => {
    const valuesFromProducts = new Set<string>();
    for (const p of products) {
      const specs = p.specs as Record<string, string> | null;
      if (specs && specs[attr.key]) {
        valuesFromProducts.add(specs[attr.key]);
      }
    }

    // If attr has predefined options, use those (filtered to ones that exist in products)
    // If no predefined options, use values found in products
    let values: { value: string; color: string | null }[];
    if (attr.options.length > 0) {
      values = attr.options
        .filter((opt) => valuesFromProducts.has(opt.value))
        .map((opt) => ({ value: opt.value, color: opt.color }));
    } else {
      values = Array.from(valuesFromProducts)
        .sort()
        .map((v) => ({ value: v, color: null }));
    }

    return {
      key: attr.key,
      name: attr.name as Record<string, string>,
      unit: attr.unit,
      type: attr.type,
      values,
    };
  }).filter((f) => f.values.length > 0); // Only return facets that have values

  return NextResponse.json(facets);
}
