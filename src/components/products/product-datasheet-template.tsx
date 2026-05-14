import React from "react";
import path from "path";
import fs from "fs";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

// ── Font registration ──
// Noto Sans SC covers both CJK and Latin glyphs. Registering with the same
// family name for normal + bold gives us a single fontFamily we can use
// regardless of language, and avoids per-language font selection logic.
const FONT_DIR = path.join(process.cwd(), "public", "fonts");
const REG = path.join(FONT_DIR, "NotoSansSC-Regular.otf");
const BOLD = path.join(FONT_DIR, "NotoSansSC-Bold.otf");

let fontsRegistered = false;
function ensureFontsRegistered() {
  if (fontsRegistered) return;
  if (fs.existsSync(REG)) {
    Font.register({
      family: "NotoSansSC",
      fonts: [
        { src: REG, fontWeight: "normal" },
        ...(fs.existsSync(BOLD) ? [{ src: BOLD, fontWeight: "bold" } as const] : []),
      ],
    });
  }
  fontsRegistered = true;
}

// ── i18n ──
const I18N = {
  zh: {
    documentTitle: "产品规格书",
    documentTitleEn: "PRODUCT DATASHEET",
    model: "型号",
    category: "分类",
    highlights: "主要参数",
    specs: "技术参数",
    shipping: "包装运输",
    variants: "产品变体",
    sku: "SKU",
    price: "参考价",
    certs: "认证",
    description: "产品描述",
    generated: "本文档由系统自动生成",
    noImage: "暂无图片",
  },
  en: {
    documentTitle: "Product Datasheet",
    documentTitleEn: "PRODUCT DATASHEET",
    model: "Model",
    category: "Category",
    highlights: "Key Specifications",
    specs: "Specifications",
    shipping: "Packing & Shipping",
    variants: "Variants",
    sku: "SKU",
    price: "Reference Price",
    certs: "Certifications",
    description: "Description",
    generated: "Auto-generated document",
    noImage: "No image",
  },
} as const;

// ── Styles ──
const styles = StyleSheet.create({
  page: {
    padding: 36,
    paddingBottom: 56,
    fontSize: 9,
    fontFamily: "NotoSansSC",
    color: "#27272a",
    lineHeight: 1.4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
    paddingBottom: 12,
    marginBottom: 18,
  },
  companyName: { fontSize: 18, fontFamily: "NotoSansSC", fontWeight: "bold", color: "#0f172a" },
  companySub: { fontSize: 7, color: "#94a3b8", letterSpacing: 2, marginTop: 2 },
  docBadge: {
    backgroundColor: "#2563eb",
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 3,
    fontSize: 10,
    fontFamily: "NotoSansSC",
    fontWeight: "bold",
    letterSpacing: 1,
  },

  // Product header (image + name)
  productHeader: { flexDirection: "row", gap: 16, marginBottom: 18 },
  imageBox: {
    width: 180,
    height: 180,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  productImage: { width: "100%", height: "100%", objectFit: "contain" },
  noImageText: { fontSize: 8, color: "#cbd5e1" },
  productInfo: { flex: 1, paddingTop: 4 },
  productCategory: {
    fontSize: 8,
    color: "#2563eb",
    letterSpacing: 1.5,
    fontFamily: "NotoSansSC",
    fontWeight: "bold",
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontFamily: "NotoSansSC",
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 6,
    lineHeight: 1.3,
  },
  productModel: { fontSize: 10, color: "#64748b", marginBottom: 10 },
  productDesc: { fontSize: 8.5, color: "#475569", lineHeight: 1.5 },

  // Section
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "NotoSansSC",
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 6,
    paddingLeft: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#2563eb",
  },

  // Highlights grid (2 columns)
  highlightGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  highlightCell: {
    width: "49%",
    backgroundColor: "#f1f5f9",
    padding: 8,
    borderRadius: 3,
    marginBottom: 4,
  },
  highlightLabel: { fontSize: 7, color: "#64748b", letterSpacing: 0.5, marginBottom: 2 },
  highlightValue: { fontSize: 10, fontFamily: "NotoSansSC", fontWeight: "bold", color: "#0f172a" },

  // Spec table (2-col label/value)
  specTable: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 3, overflow: "hidden" },
  specRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  specRowLast: { borderBottomWidth: 0 },
  specLabel: {
    width: "35%",
    backgroundColor: "#f8fafc",
    padding: 6,
    fontSize: 8.5,
    color: "#64748b",
  },
  specValue: { width: "65%", padding: 6, fontSize: 8.5, color: "#0f172a" },

  // Variants table
  varTableHeader: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    padding: 6,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  varHeaderCell: { color: "#fff", fontSize: 8, fontFamily: "NotoSansSC", fontWeight: "bold" },
  varRow: {
    flexDirection: "row",
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  varRowAlt: { backgroundColor: "#f8fafc" },
  varCell: { fontSize: 8, color: "#27272a" },

  // Certifications
  certRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  certBadge: {
    backgroundColor: "#dcfce7",
    color: "#15803d",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: 8,
    fontFamily: "NotoSansSC",
    fontWeight: "bold",
  },

  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: "#94a3b8" },
});

// ── Types ──
export interface DatasheetSpec {
  label: string;
  value: string;
}

export interface DatasheetVariantRow {
  sku: string;
  price: string | null;
  cells: string[]; // ordered by `variantHeaders`
}

export interface DatasheetData {
  lang: "zh" | "en";
  modelNumber: string;
  productName: string;
  description: string;
  categoryName: string;
  /** Pre-fetched primary image. The route handler resolves Supabase storage URLs. */
  imageBuffer: Buffer | null;
  imageExtension: "jpg" | "png" | null;
  highlightSpecs: DatasheetSpec[];
  fullSpecs: DatasheetSpec[];
  shippingSpecs: DatasheetSpec[];
  variantHeaders: string[];
  variants: DatasheetVariantRow[];
  certificates: { name: string; certType: string }[];
}

function SpecTable({ rows }: { rows: DatasheetSpec[] }) {
  return (
    <View style={styles.specTable}>
      {rows.map((r, i) => (
        <View
          key={`${r.label}-${i}`}
          style={[styles.specRow, i === rows.length - 1 ? styles.specRowLast : {}]}
        >
          <Text style={styles.specLabel}>{r.label}</Text>
          <Text style={styles.specValue}>{r.value}</Text>
        </View>
      ))}
    </View>
  );
}

export function ProductDatasheetDocument({ data }: { data: DatasheetData }) {
  ensureFontsRegistered();
  const t = I18N[data.lang];

  // Variant table column widths: SKU + (optional price) + N spec columns
  const hasPriceCol = data.variants.some((v) => v.price);
  const specColCount = data.variantHeaders.length;
  const skuColPct = 22;
  const priceColPct = hasPriceCol ? 16 : 0;
  const specColPct = (100 - skuColPct - priceColPct) / Math.max(1, specColCount);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>OuXing</Text>
            <Text style={styles.companySub}>LIGHTING SOLUTIONS</Text>
          </View>
          <Text style={styles.docBadge}>{t.documentTitle}</Text>
        </View>

        {/* Product header */}
        <View style={styles.productHeader}>
          <View style={styles.imageBox}>
            {data.imageBuffer && data.imageExtension ? (
              <Image
                src={{ data: data.imageBuffer, format: data.imageExtension }}
                style={styles.productImage}
              />
            ) : (
              <Text style={styles.noImageText}>{t.noImage}</Text>
            )}
          </View>
          <View style={styles.productInfo}>
            {data.categoryName ? (
              <Text style={styles.productCategory}>{data.categoryName.toUpperCase()}</Text>
            ) : null}
            <Text style={styles.productName}>{data.productName}</Text>
            <Text style={styles.productModel}>
              {t.model}: {data.modelNumber}
            </Text>
            {data.description ? <Text style={styles.productDesc}>{data.description}</Text> : null}
          </View>
        </View>

        {/* Highlights */}
        {data.highlightSpecs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.highlights}</Text>
            <View style={styles.highlightGrid}>
              {data.highlightSpecs.map((s, i) => (
                <View key={`${s.label}-${i}`} style={styles.highlightCell}>
                  <Text style={styles.highlightLabel}>{s.label}</Text>
                  <Text style={styles.highlightValue}>{s.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Full specs */}
        {data.fullSpecs.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>{t.specs}</Text>
            <SpecTable rows={data.fullSpecs} />
          </View>
        )}

        {/* Variants */}
        {data.variants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.variants}</Text>
            <View>
              <View style={styles.varTableHeader}>
                <Text style={[styles.varHeaderCell, { width: `${skuColPct}%` }]}>{t.sku}</Text>
                {hasPriceCol && (
                  <Text style={[styles.varHeaderCell, { width: `${priceColPct}%` }]}>{t.price}</Text>
                )}
                {data.variantHeaders.map((h, i) => (
                  <Text key={`${h}-${i}`} style={[styles.varHeaderCell, { width: `${specColPct}%` }]}>
                    {h}
                  </Text>
                ))}
              </View>
              {data.variants.map((v, ri) => (
                <View
                  key={`${v.sku}-${ri}`}
                  style={[styles.varRow, ri % 2 === 1 ? styles.varRowAlt : {}]}
                  wrap={false}
                >
                  <Text style={[styles.varCell, { width: `${skuColPct}%`, fontFamily: "NotoSansSC", fontWeight: "bold" }]}>
                    {v.sku}
                  </Text>
                  {hasPriceCol && (
                    <Text style={[styles.varCell, { width: `${priceColPct}%` }]}>{v.price || "—"}</Text>
                  )}
                  {v.cells.map((c, ci) => (
                    <Text key={`${ci}-${c}`} style={[styles.varCell, { width: `${specColPct}%` }]}>
                      {c || "—"}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Shipping */}
        {data.shippingSpecs.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>{t.shipping}</Text>
            <SpecTable rows={data.shippingSpecs} />
          </View>
        )}

        {/* Certifications */}
        {data.certificates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.certs}</Text>
            <View style={styles.certRow}>
              {data.certificates.map((c, i) => (
                <Text key={`${c.certType}-${i}`} style={styles.certBadge}>
                  {c.certType}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>OuXing Co., Ltd. | www.ouxing.com</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${t.generated} · ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
