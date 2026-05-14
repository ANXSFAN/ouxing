import { z } from "zod";

export const quoteItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable().optional(),
  productName: z.string().min(1),
  productModel: z.string().min(1),
  specification: z.string().optional(),
  quantity: z.coerce.number().int().positive("数量必须大于0"),
  unitPrice: z.coerce.number().min(0, "单价不能为负数"),
  notes: z.string().optional(),
});

export const quoteCreateSchema = z.object({
  customerName: z.string().min(1, "客户姓名不能为空"),
  customerEmail: z.string().optional(),
  customerCompany: z.string().optional(),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  title: z.string().optional(),
  notes: z.string().optional(),
  validDays: z.coerce.number().int().positive().default(30),
  currency: z.string().default("CNY"),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  items: z.array(quoteItemSchema).min(1, "至少添加一个产品"),
  inquiryId: z.string().optional(),
});

export const quoteUpdateSchema = quoteCreateSchema.partial().extend({
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"]).optional(),
});

export type QuoteItemInput = z.infer<typeof quoteItemSchema>;
export type QuoteCreateInput = z.infer<typeof quoteCreateSchema>;
export type QuoteUpdateInput = z.infer<typeof quoteUpdateSchema>;
