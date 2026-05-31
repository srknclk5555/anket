import { z } from "zod";

export const submitAnswerSchema = z.object({
  questionId: z.string().uuid("Geçersiz soru ID"),
  optionId: z.string().uuid("Geçersiz seçenek ID").optional(),
  textValue: z.string().max(1000, "Metin 1000 karakterden fazla olamaz").optional(),
  numberValue: z.number().int("Sayı tam sayı olmalı").finite().optional(),
  rankValue: z.number().int().min(0).optional(),
  isOtherText: z.boolean().default(false),
});

export const submitResponseSchema = z
  .object({
    turnstileToken: z.string().min(1, "Güvenlik doğrulaması gerekli"),
    answers: z
      .array(submitAnswerSchema)
      .min(1, "En az bir cevap gerekli")
      .max(50, "En fazla 50 cevap gönderilebilir"),
    honeypot: z.string().max(0).optional(),
    formOpenedAt: z.number().int().optional(),
  })
  .strict()
  .transform((data) => ({
    ...data,
    answers: data.answers.filter(
      (a) => a.questionId && typeof a.questionId === "string"
    ),
  }));

export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
