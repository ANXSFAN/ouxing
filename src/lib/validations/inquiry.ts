import { z } from "zod";

export const inquirySchema = z.object({
  company: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().optional(),
  productIds: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.coerce.number().int().positive().optional(),
        expectedPrice: z.coerce.number().min(0).optional(),
      })
    )
    .optional(),
});

const nullableDate = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => {
    if (v == null || v === "") return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  });

export const inquiryUpdateSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "QUOTED", "CLOSED"]).optional(),
  adminNotes: z.string().optional(),
  orderedAt: nullableDate,
  readyAt: nullableDate,
  shippedAt: nullableDate,
});

export type InquiryInput = z.infer<typeof inquirySchema>;
export type InquiryUpdateInput = z.infer<typeof inquiryUpdateSchema>;
