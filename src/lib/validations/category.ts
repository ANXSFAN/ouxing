import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "分类名称不能为空"),
  slug: z.string().min(1, "Slug不能为空").regex(/^[a-z0-9-]+$/, "Slug只能包含小写字母、数字和连字符"),
  description: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export type CategoryInput = z.infer<typeof categorySchema>;
