import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { fetchStoredFile } from "@/lib/supabase-storage";
import {
  ProductDatasheetDocument,
  type DatasheetData,
  type DatasheetSpec,
  type DatasheetVariantRow,
} from "@/components/products/product-datasheet-template";

const SHIPPING_KEYS = new Set([
  "qty_per_carton",
  "carton_length",
  "carton_width",
  "carton_height",
  "net_weight",
  "gross_weight",
]);

type AttrDef = {
  key: string;
  name: Record<string, string>;
  unit: string | null;
  isHighlight: boolean;
};

function localized(content: unknown, lang: "zh" | "en", field: "name" | "description"): string {
  const c = content as Record<string, Record<string, string>> | null;
  const alt = lang === "zh" ? "en" : "zh";
  return c?.[lang]?.[field] || c?.[alt]?.[field] || "";
}

function attrLabel(def: AttrDef | undefined, fallbackKey: string, lang: "zh" | "en"): string {
  if (!def) return fallbackKey;
  const alt = lang === "zh" ? "en" : "zh";
  return def.name[lang] || def.name[alt] || fallbackKey;
}

function formatSpecValue(raw: string | string[] | undefined, unit: string | null): string {
  if (raw == null) return "";
  const text = Array.isArray(raw) ? raw.join(" / ") : String(raw);
  if (!text.trim()) return "";
  return unit ? `${text} ${unit}` : text;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const lang = (searchParams.get("lang") === "en" ? "en" : "zh") as "zh" | "en";

  const [product, attrs] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { where: { variantId: null }, orderBy: { sortOrder: "asc" }, take: 1 },
        certificates: { orderBy: { createdAt: "desc" } },
        variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.attributeDefinition.findMany(),
  ]);

  if (!product) {
    return NextResponse.json({ error: "产品不存在" }, { status: 404 });
  }

  const attrByKey = new Map<string, AttrDef>();
  for (const a of attrs as unknown as AttrDef[]) attrByKey.set(a.key, a);

  const productSpecs = (product.specs as Record<string, string | string[]> | null) || {};

  // ── Build spec sections ─────────────────────────────
  // Variant dimension keys (those that vary across variants) are shown only in
  // the variants table, not in the main spec sheet, to avoid duplication.
  const variantDimensionKeys = new Set<string>();
  if (product.variants.length > 0) {
    const seenValues = new Map<string, Set<string>>();
    for (const v of product.variants) {
      const vSpecs = (v.specs as Record<string, string>) || {};
      for (const [k, val] of Object.entries(vSpecs)) {
        if (!val || SHIPPING_KEYS.has(k)) continue;
        if (!seenValues.has(k)) seenValues.set(k, new Set());
        seenValues.get(k)!.add(String(val));
      }
    }
    for (const [k, values] of seenValues) {
      if (values.size > 1) variantDimensionKeys.add(k);
    }
  }

  const highlightSpecs: DatasheetSpec[] = [];
  const fullSpecs: DatasheetSpec[] = [];
  const shippingSpecs: DatasheetSpec[] = [];

  for (const [k, raw] of Object.entries(productSpecs)) {
    const def = attrByKey.get(k);
    const value = formatSpecValue(raw, def?.unit || null);
    if (!value) continue;
    const label = attrLabel(def, k, lang);
    if (SHIPPING_KEYS.has(k)) {
      shippingSpecs.push({ label, value });
    } else if (!variantDimensionKeys.has(k)) {
      fullSpecs.push({ label, value });
      if (def?.isHighlight) highlightSpecs.push({ label, value });
    }
  }

  // ── Variants table ──────────────────────────────────
  const variantHeaderKeys = Array.from(variantDimensionKeys);
  const variantHeaders = variantHeaderKeys.map((k) => attrLabel(attrByKey.get(k), k, lang));
  const variants: DatasheetVariantRow[] = product.variants.map((v) => {
    const vSpecs = (v.specs as Record<string, string>) || {};
    return {
      sku: v.sku,
      cells: variantHeaderKeys.map((k) => {
        const merged = vSpecs[k] ?? (productSpecs[k] as string | undefined);
        return formatSpecValue(merged, attrByKey.get(k)?.unit || null);
      }),
    };
  });

  // ── Primary image (used in the hero block) ──────────
  let imageBuffer: Buffer | null = null;
  let imageExtension: "jpg" | "png" | null = null;
  const imageUrl = product.images[0]?.url;
  if (imageUrl) {
    try {
      imageBuffer = await fetchStoredFile(imageUrl);
      const ext = imageUrl.toLowerCase().match(/\.([a-z]+)(?:\?|$)/)?.[1] || "jpg";
      imageExtension = ext === "png" ? "png" : "jpg";
    } catch {
      imageBuffer = null;
    }
  }

  const data: DatasheetData = {
    lang,
    modelNumber: product.modelNumber,
    productName: localized(product.content, lang, "name") || product.modelNumber,
    description: localized(product.content, lang, "description"),
    categoryName: product.category ? localized(product.category.content, lang, "name") : "",
    imageBuffer,
    imageExtension,
    highlightSpecs,
    fullSpecs,
    shippingSpecs,
    variantHeaders,
    variants,
    certificates: product.certificates.map((c) => ({ name: c.name, certType: c.certType })),
  };

  const buffer = await renderToBuffer(ProductDatasheetDocument({ data }));

  // Slugify the model for the filename so spaces/Chinese don't break headers.
  const safeModel = product.modelNumber.replace(/[^a-zA-Z0-9-_]/g, "_");
  const filename = `${safeModel}-datasheet-${lang}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
