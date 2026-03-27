import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#f59e0b",
    paddingBottom: 15,
  },
  headerLeft: {},
  companyName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#18181b",
    fontFamily: "Helvetica-Bold",
  },
  companySubtitle: {
    fontSize: 8,
    color: "#71717a",
    letterSpacing: 2,
    marginTop: 2,
  },
  headerRight: {
    textAlign: "right",
  },
  quoteTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#f59e0b",
    fontFamily: "Helvetica-Bold",
  },
  quoteNumber: {
    fontSize: 9,
    color: "#71717a",
    marginTop: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  infoBox: {
    width: "48%",
    backgroundColor: "#fafafa",
    borderRadius: 4,
    padding: 12,
  },
  infoLabel: {
    fontSize: 8,
    color: "#a1a1aa",
    fontWeight: "bold",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 6,
    fontFamily: "Helvetica-Bold",
  },
  infoText: {
    fontSize: 10,
    color: "#27272a",
    marginBottom: 2,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#18181b",
    borderRadius: 4,
    padding: 8,
  },
  tableHeaderText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
    padding: 8,
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  col1: { width: "5%" },
  col2: { width: "30%" },
  col3: { width: "20%" },
  col4: { width: "10%", textAlign: "center" },
  col5: { width: "15%", textAlign: "right" },
  col6: { width: "20%", textAlign: "right" },
  cellText: {
    fontSize: 9,
    color: "#27272a",
  },
  cellSmall: {
    fontSize: 8,
    color: "#71717a",
  },
  totalsSection: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  totalsBox: {
    width: 220,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 9,
    color: "#71717a",
  },
  totalValue: {
    fontSize: 9,
    color: "#27272a",
    fontFamily: "Helvetica-Bold",
  },
  totalFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: "#f59e0b",
  },
  totalFinalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#18181b",
    fontFamily: "Helvetica-Bold",
  },
  totalFinalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#f59e0b",
    fontFamily: "Helvetica-Bold",
  },
  notesSection: {
    backgroundColor: "#fafafa",
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#27272a",
    marginBottom: 6,
    fontFamily: "Helvetica-Bold",
  },
  notesText: {
    fontSize: 8,
    color: "#52525b",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: "#a1a1aa",
  },
});

interface QuotePdfData {
  quoteNumber: string;
  title: string;
  date: string;
  validDays: number;
  currency: string;
  customerName: string;
  customerCompany: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: {
    index: number;
    productName: string;
    productModel: string;
    specification: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes: string;
  createdBy: string;
}

function formatCurrency(value: number, currency: string): string {
  const symbol = currency === "CNY" ? "¥" : "$";
  return `${symbol}${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function QuotePdfDocument({ data }: { data: QuotePdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>SysLED</Text>
            <Text style={styles.companySubtitle}>LIGHTING SOLUTIONS</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.quoteTitle}>QUOTATION</Text>
            <Text style={styles.quoteNumber}>No. {data.quoteNumber}</Text>
            <Text style={styles.quoteNumber}>Date: {data.date}</Text>
            <Text style={styles.quoteNumber}>Valid: {data.validDays} days</Text>
          </View>
        </View>

        {/* Customer & Company Info */}
        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Customer / To</Text>
            <Text style={styles.infoText}>{data.customerName}</Text>
            {data.customerCompany ? <Text style={styles.infoText}>{data.customerCompany}</Text> : null}
            {data.customerEmail ? <Text style={styles.infoText}>{data.customerEmail}</Text> : null}
            {data.customerPhone ? <Text style={styles.infoText}>{data.customerPhone}</Text> : null}
            {data.customerAddress ? <Text style={styles.infoText}>{data.customerAddress}</Text> : null}
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>From / Supplier</Text>
            <Text style={styles.infoText}>SysLED Co., Ltd.</Text>
            <Text style={styles.infoText}>Bao&apos;an District, Shenzhen</Text>
            <Text style={styles.infoText}>Guangdong, China</Text>
            <Text style={styles.infoText}>info@sysled.com</Text>
            <Text style={styles.infoText}>+86 755-1234-5678</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.col1}><Text style={styles.tableHeaderText}>#</Text></View>
            <View style={styles.col2}><Text style={styles.tableHeaderText}>Product</Text></View>
            <View style={styles.col3}><Text style={styles.tableHeaderText}>Model</Text></View>
            <View style={styles.col4}><Text style={styles.tableHeaderText}>Qty</Text></View>
            <View style={styles.col5}><Text style={[styles.tableHeaderText, { textAlign: "right" }]}>Unit Price</Text></View>
            <View style={styles.col6}><Text style={[styles.tableHeaderText, { textAlign: "right" }]}>Amount</Text></View>
          </View>

          {data.items.map((item, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <View style={styles.col1}><Text style={styles.cellSmall}>{item.index}</Text></View>
              <View style={styles.col2}>
                <Text style={styles.cellText}>{item.productName}</Text>
                {item.specification ? <Text style={styles.cellSmall}>{item.specification}</Text> : null}
              </View>
              <View style={styles.col3}><Text style={styles.cellText}>{item.productModel}</Text></View>
              <View style={styles.col4}><Text style={[styles.cellText, { textAlign: "center" }]}>{item.quantity}</Text></View>
              <View style={styles.col5}><Text style={[styles.cellText, { textAlign: "right" }]}>{formatCurrency(item.unitPrice, data.currency)}</Text></View>
              <View style={styles.col6}><Text style={[styles.cellText, { textAlign: "right", fontFamily: "Helvetica-Bold" }]}>{formatCurrency(item.totalPrice, data.currency)}</Text></View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.subtotal, data.currency)}</Text>
            </View>
            {data.discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={[styles.totalValue, { color: "#ef4444" }]}>-{formatCurrency(data.discount, data.currency)}</Text>
              </View>
            )}
            {data.tax > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax</Text>
                <Text style={styles.totalValue}>{formatCurrency(data.tax, data.currency)}</Text>
              </View>
            )}
            <View style={styles.totalFinal}>
              <Text style={styles.totalFinalLabel}>Total</Text>
              <Text style={styles.totalFinalValue}>{formatCurrency(data.total, data.currency)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {data.notes ? (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Terms & Notes</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>SysLED Co., Ltd. | www.sysled.com</Text>
          <Text style={styles.footerText}>Generated by {data.createdBy}</Text>
        </View>
      </Page>
    </Document>
  );
}
