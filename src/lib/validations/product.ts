import { z } from "zod";

export const productCreateSchema = z.object({
  name: z.string().min(1, "产品名称不能为空"),
  modelNumber: z.string().min(1, "型号不能为空"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "价格不能为负数").optional().nullable(),
  categoryId: z.string().min(1, "请选择产品分类"),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  wattage: z.string().optional(),
  colorTemperature: z.string().optional(),
  lumens: z.string().optional(),
  cri: z.string().optional(),
  beamAngle: z.string().optional(),
  ipRating: z.string().optional(),
  voltage: z.string().optional(),
  dimensions: z.string().optional(),
  weight: z.string().optional(),
  material: z.string().optional(),
  lifespan: z.string().optional(),
  warranty: z.string().optional(),
  extraSpecs: z
    .array(z.object({ key: z.string(), value: z.string() }))
    .optional(),
});

export const productUpdateSchema = productCreateSchema.partial();

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
