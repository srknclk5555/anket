import { z } from "zod";

export const QUESTION_TYPES = [
  "short_text",
  "long_text",
  "single_choice",
  "multiple_choice",
  "dropdown",
  "searchable_dropdown",
  "searchable_list",
  "linear_scale",
  "rating",
  "yes_no",
  "date",
  "number",
  "ranking",
  "matrix",
] as const;

export const createQuestionSchema = z.object({
  questionType: z.enum(QUESTION_TYPES),
  title: z.string().min(1, "Soru başlığı zorunludur").max(500, "Soru başlığı en fazla 500 karakter"),
  description: z.string().max(1000).optional(),
  isRequired: z.boolean().default(true),
  scaleMin: z.number().int().min(0).max(10).optional(),
  scaleMax: z.number().int().min(2).max(10).optional(),
  scaleMinLabel: z.string().max(50).optional(),
  scaleMaxLabel: z.string().max(50).optional(),
  options: z
    .array(
      z.object({
        label: z.string().min(1).max(200),
        isOther: z.boolean().default(false),
      })
    )
    .optional(),
  customListId: z.string().uuid("Geçersiz liste ID").optional().nullable(),
});

export const updateQuestionSchema = createQuestionSchema.partial().extend({
  orderIndex: z.number().int().min(0).optional(),
});

export const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      orderIndex: z.number().int().min(0),
    })
  ),
});

export const createOptionSchema = z.object({
  label: z.string().min(1).max(200),
  isOther: z.boolean().default(false),
});

export const updateOptionSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  orderIndex: z.number().int().min(0).optional(),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type ReorderInput = z.infer<typeof reorderSchema>;
export type CreateOptionInput = z.infer<typeof createOptionSchema>;
export type UpdateOptionInput = z.infer<typeof updateOptionSchema>;
