import { z } from "zod";

export const createSurveySchema = z.object({
  title: z.string().min(1, "Başlık zorunludur").max(200, "Başlık en fazla 200 karakter"),
  description: z.string().max(2000, "Açıklama en fazla 2000 karakter").optional(),
  closesAt: z.string().datetime().optional(),
});

export const updateSurveySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  closesAt: z.string().datetime().nullable().optional(),
});

export const updateSurveyStatusSchema = z.object({
  status: z.enum(["draft", "published", "closed"]),
});

export type CreateSurveyInput = z.infer<typeof createSurveySchema>;
export type UpdateSurveyInput = z.infer<typeof updateSurveySchema>;
export type UpdateSurveyStatusInput = z.infer<typeof updateSurveyStatusSchema>;
