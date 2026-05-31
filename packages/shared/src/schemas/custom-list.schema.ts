import { z } from "zod";

export const createCustomListSchema = z.object({
  name: z.string().min(1, "Liste adı zorunludur").max(200, "Liste adı en fazla 200 karakter olabilir"),
  description: z.string().max(1000).optional().nullable(),
});

export const updateCustomListSchema = createCustomListSchema.partial();

export const createCustomListItemSchema = z.object({
  value: z.string().min(1, "Eleman değeri zorunludur").max(500),
});

export const bulkAddCustomListItemsSchema = z.object({
  items: z.array(z.string().min(1).max(500)).min(1, "En az bir eleman eklemelisiniz"),
});

export type CreateCustomListInput = z.infer<typeof createCustomListSchema>;
export type UpdateCustomListInput = z.infer<typeof updateCustomListSchema>;
export type CreateCustomListItemInput = z.infer<typeof createCustomListItemSchema>;
export type BulkAddCustomListItemsInput = z.infer<typeof bulkAddCustomListItemsSchema>;
