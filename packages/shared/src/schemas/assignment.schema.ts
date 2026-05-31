import { z } from "zod";

export const createAssignmentSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["editor", "viewer"]),
  canEdit: z.boolean().default(false),
  canView: z.boolean().default(true),
  canExport: z.boolean().default(false),
});

export const updateAssignmentSchema = z.object({
  role: z.enum(["editor", "viewer"]).optional(),
  canEdit: z.boolean().optional(),
  canView: z.boolean().optional(),
  canExport: z.boolean().optional(),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
