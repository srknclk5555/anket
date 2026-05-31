import { Hono } from "hono";
import { SurveyService } from "../services/survey.service.js";
import { ResponseService } from "../services/response.service.js";
import { AdminService } from "../services/admin.service.js";
import { AuthService } from "../services/auth.service.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminOnly, requireSurveyPermission } from "../middleware/rbac.js";
import { apiRateLimit } from "../middleware/rateLimit.js";
import { validateBody } from "../middleware/validate.js";
import { z } from "zod";
import { createSurveySchema, updateSurveySchema, updateSurveyStatusSchema, createQuestionSchema, updateQuestionSchema, reorderSchema, createOptionSchema, updateOptionSchema, createAssignmentSchema, updateAssignmentSchema } from "@gorunmeyen-lig/shared";
import { getClientIp } from "../middleware/security.js";
import customListRoutes from "./custom-list.routes.js";

const sectionPayloadSchema = z.object({
  title: z.string().min(1, "Bölüm başlığı zorunlu"),
  description: z.string().optional(),
});

type Env = {
  Variables: {
    user: any;
    parsedBody: any;
  }
};

const adminRoutes = new Hono<Env>();

// All admin routes require auth + admin role
adminRoutes.use("/*", authMiddleware, apiRateLimit);

adminRoutes.route("/custom-lists", customListRoutes);

// ═══════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════

// GET /api/admin/stats
adminRoutes.get("/stats", adminOnly, async (c) => {
  const stats = await AdminService.getOverviewStats();
  return c.json(stats);
});

// ═══════════════════════════════════════
// SURVEYS
// ═══════════════════════════════════════

// GET /api/admin/surveys
adminRoutes.get("/surveys", adminOnly, async (c) => {
  const status = c.req.query("status");
  const surveys = await SurveyService.getAllSurveys({ status });
  return c.json({ surveys });
});

// POST /api/admin/surveys
adminRoutes.post("/surveys", adminOnly, validateBody(createSurveySchema), async (c) => {
  const body = c.get("parsedBody") as { title: string; description?: string; status?: string; closesAt?: string };
  const user = c.get("user");
  const survey = await SurveyService.createSurvey({
    ...body,
    createdBy: user.id,
  });
  return c.json({ survey }, 201);
});

// GET /api/admin/surveys/:id
adminRoutes.get("/surveys/:id", adminOnly, async (c) => {
  const surveyId = c.req.param("id");
  if (!surveyId) return c.json({ error: "Geçersiz ID" }, 400);
  
  const survey = await SurveyService.getSurveyWithDetails(surveyId);
  if (!survey) return c.json({ error: "Anket bulunamadı" }, 404);
  
  return c.json({ survey });
});

// PATCH /api/admin/surveys/:id
adminRoutes.patch("/surveys/:id", adminOnly, validateBody(updateSurveySchema), async (c) => {
  const surveyId = c.req.param("id");
  if (!surveyId) return c.json({ error: "Geçersiz ID" }, 400);
  const body = c.get("parsedBody") as Record<string, unknown>;
  const survey = await SurveyService.updateSurvey(surveyId, body);
  if (!survey) return c.json({ error: "Anket bulunamadı" }, 404);
  return c.json({ survey });
});

// DELETE /api/admin/surveys/:id
adminRoutes.delete("/surveys/:id", adminOnly, async (c) => {
  const surveyId = c.req.param("id");
  if (!surveyId) return c.json({ error: "Geçersiz ID" }, 400);
  await SurveyService.deleteSurvey(surveyId);
  return c.json({ message: "Anket silindi" });
});

// PATCH /api/admin/surveys/:id/status
adminRoutes.patch("/surveys/:id/status", adminOnly, validateBody(updateSurveyStatusSchema), async (c) => {
  const surveyId = c.req.param("id");
  if (!surveyId) return c.json({ error: "Geçersiz ID" }, 400);
  const body = c.get("parsedBody") as { status: "draft" | "published" | "closed" };
  const survey = await SurveyService.updateSurveyStatus(surveyId, body.status);
  if (!survey) return c.json({ error: "Anket bulunamadı" }, 404);
  return c.json({ survey });
});

// ═══════════════════════════════════════
// SECTIONS
// ═══════════════════════════════════════

// GET /api/admin/surveys/:id/sections
adminRoutes.get("/surveys/:id/sections", adminOnly, async (c) => {
  const survey = await SurveyService.getSurveyWithDetails(c.req.param("id") || "");
  if (!survey) return c.json({ error: "Anket bulunamadı" }, 404);
  return c.json({ sections: survey.sections });
});

// POST /api/admin/surveys/:id/sections
adminRoutes.post("/surveys/:id/sections", adminOnly, validateBody(sectionPayloadSchema), async (c) => {
  const surveyId = c.req.param("id");
  if (!surveyId) return c.json({ error: "Geçersiz ID" }, 400);
  const body = c.get("parsedBody") as { title: string; description?: string };
  const section = await SurveyService.addSection(surveyId, body.title, body.description);
  return c.json({ section }, 201);
});

// PATCH /api/admin/sections/:id
adminRoutes.patch("/sections/:id", adminOnly, validateBody(sectionPayloadSchema), async (c) => {
  const sectionId = c.req.param("id");
  if (!sectionId) return c.json({ error: "Geçersiz ID" }, 400);
  const body = c.get("parsedBody") as { title: string; description?: string };
  const section = await SurveyService.updateSection(sectionId, body);
  if (!section) return c.json({ error: "Bölüm bulunamadı" }, 404);
  return c.json({ section });
});

// DELETE /api/admin/sections/:id
adminRoutes.delete("/sections/:id", adminOnly, async (c) => {
  const sectionId = c.req.param("id");
  if (!sectionId) return c.json({ error: "Geçersiz ID" }, 400);
  await SurveyService.deleteSection(sectionId);
  return c.json({ message: "Bölüm silindi" });
});

// PUT /api/admin/surveys/:id/sections/reorder
adminRoutes.put("/surveys/:id/sections/reorder", adminOnly, async (c) => {
  const body = await c.req.json();
  const result = reorderSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: "Doğrulama hatası", details: result.error.errors }, 400);
  }
  await SurveyService.reorderSections(result.data.items);
  return c.json({ message: "Bölümler yeniden sıralandı" });
});

// ═══════════════════════════════════════
// QUESTIONS
// ═══════════════════════════════════════

// GET /api/admin/sections/:id/questions
adminRoutes.get("/sections/:id/questions", adminOnly, async (c) => {
  // Return questions for a section - fetched via survey details
  return c.json({ message: "Use GET /api/admin/surveys/:id for full details" });
});

// POST /api/admin/sections/:id/questions
adminRoutes.post("/sections/:id/questions", adminOnly, async (c) => {
  const sectionId = c.req.param("id");
  if (!sectionId) return c.json({ error: "Geçersiz ID" }, 400);
  const body = await c.req.json();
  const result = createQuestionSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: "Doğrulama hatası", details: result.error.errors }, 400);
  }
  const question = await SurveyService.addQuestion(sectionId, {
    ...result.data,
    customListId: result.data.customListId ?? undefined
  });
  return c.json({ question }, 201);
});

// PATCH /api/admin/questions/:id
adminRoutes.patch("/questions/:id", adminOnly, async (c) => {
  const questionId = c.req.param("id");
  if (!questionId) return c.json({ error: "Geçersiz ID" }, 400);
  const body = await c.req.json();
  const question = await SurveyService.updateQuestion(questionId, body);
  if (!question) return c.json({ error: "Soru bulunamadı" }, 404);
  return c.json({ question });
});

// DELETE /api/admin/questions/:id
adminRoutes.delete("/questions/:id", adminOnly, async (c) => {
  const questionId = c.req.param("id");
  if (!questionId) return c.json({ error: "Geçersiz ID" }, 400);
  await SurveyService.deleteQuestion(questionId);
  return c.json({ message: "Soru silindi" });
});

// PUT /api/admin/sections/:id/questions/reorder
adminRoutes.put("/sections/:id/questions/reorder", adminOnly, async (c) => {
  const body = await c.req.json();
  const result = reorderSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: "Doğrulama hatası", details: result.error.errors }, 400);
  }
  await SurveyService.reorderQuestions(result.data.items);
  return c.json({ message: "Sorular yeniden sıralandı" });
});

// ═══════════════════════════════════════
// OPTIONS
// ═══════════════════════════════════════

// POST /api/admin/questions/:id/options
adminRoutes.post("/questions/:id/options", adminOnly, validateBody(createOptionSchema), async (c) => {
  const questionId = c.req.param("id");
  if (!questionId) return c.json({ error: "Geçersiz ID" }, 400);
  const body = c.get("parsedBody") as { label: string; isOther: boolean };
  const option = await SurveyService.addOption(questionId, body.label, body.isOther);
  return c.json({ option }, 201);
});

// PATCH /api/admin/options/:id
adminRoutes.patch("/options/:id", adminOnly, validateBody(updateOptionSchema), async (c) => {
  const optionId = c.req.param("id");
  if (!optionId) return c.json({ error: "Geçersiz ID" }, 400);
  const body = c.get("parsedBody") as Record<string, unknown>;
  const option = await SurveyService.updateOption(optionId, body);
  if (!option) return c.json({ error: "Opsiyon bulunamadı" }, 404);
  return c.json({ option });
});

// DELETE /api/admin/options/:id
adminRoutes.delete("/options/:id", adminOnly, async (c) => {
  const optionId = c.req.param("id");
  if (!optionId) return c.json({ error: "Geçersiz ID" }, 400);
  await SurveyService.deleteOption(optionId);
  return c.json({ message: "Opsiyon silindi" });
});

// ═══════════════════════════════════════
// RESPONSES & ANALYTICS
// ═══════════════════════════════════════

// GET /api/admin/surveys/:id/responses
adminRoutes.get("/surveys/:id/responses", adminOnly, requireSurveyPermission("canView"), async (c) => {
  const surveyId = c.req.param("id");
  if (!surveyId) return c.json({ error: "Geçersiz ID" }, 400);
  const limitParam = c.req.query("limit") || "50";
  const limit = limitParam === "all" ? 100_000 : parseInt(limitParam, 10) || 50;
  const offset = parseInt(c.req.query("offset") || "0");
  const responses = await ResponseService.getSurveyResponses(surveyId, { limit, offset });
  return c.json({ responses });
});

// GET /api/admin/surveys/:id/stats
adminRoutes.get("/surveys/:id/stats", adminOnly, async (c) => {
  const surveyId = c.req.param("id");
  if (!surveyId) return c.json({ error: "Geçersiz ID" }, 400);
  const stats = await ResponseService.getSurveyStats(surveyId);
  return c.json({ stats });
});

// GET /api/admin/surveys/:id/export/csv
adminRoutes.get("/surveys/:id/export/csv", adminOnly, requireSurveyPermission("canExport"), async (c) => {
  const surveyId = c.req.param("id");
  if (!surveyId) return c.json({ error: "Geçersiz ID" }, 400);
  const data = await ResponseService.exportResponsesCSV(surveyId);
  // Return as JSON for now — CSV conversion can be done client-side
  return c.json({ data });
});

// ═══════════════════════════════════════
// USERS & ASSIGNMENTS
// ═══════════════════════════════════════

// GET /api/admin/users
adminRoutes.get("/users", adminOnly, async (c) => {
  const users = await AuthService.getAllUsers();
  return c.json({ users });
});

// PATCH /api/admin/users/:id/role
adminRoutes.patch("/users/:id/role", adminOnly, async (c) => {
  const userId = c.req.param("id");
  if (!userId) return c.json({ error: "Geçersiz ID" }, 400);
  const body = await c.req.json();
  if (!body.role) return c.json({ error: "Rol zorunlu" }, 400);
  const user = await AdminService.updateUserRole(userId, body.role);
  if (!user) return c.json({ error: "Kullanıcı bulunamadı" }, 404);
  return c.json({ user });
});

// POST /api/admin/surveys/:id/assignments
adminRoutes.post("/surveys/:id/assignments", adminOnly, async (c) => {
  const surveyId = c.req.param("id");
  if (!surveyId) return c.json({ error: "Geçersiz ID" }, 400);
  const body = await c.req.json();
  const result = createAssignmentSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: "Doğrulama hatası", details: result.error.errors }, 400);
  }
  const user = c.get("user");
  const assignment = await AdminService.assignUserToSurvey({
    ...result.data,
    surveyId,
    assignedBy: user.id,
  });
  return c.json({ assignment }, 201);
});

// PATCH /api/admin/assignments/:id
adminRoutes.patch("/assignments/:id", adminOnly, async (c) => {
  const assignmentId = c.req.param("id");
  if (!assignmentId) return c.json({ error: "Geçersiz ID" }, 400);
  const body = await c.req.json();
  const result = updateAssignmentSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: "Doğrulama hatası", details: result.error.errors }, 400);
  }
  const assignment = await AdminService.updateAssignment(assignmentId, result.data);
  if (!assignment) return c.json({ error: "Yetki ataması bulunamadı" }, 404);
  return c.json({ assignment });
});

// DELETE /api/admin/assignments/:id
adminRoutes.delete("/assignments/:id", adminOnly, async (c) => {
  const assignmentId = c.req.param("id");
  if (!assignmentId) return c.json({ error: "Geçersiz ID" }, 400);
  await AdminService.removeAssignment(assignmentId);
  return c.json({ message: "Yetki ataması kaldırıldı" });
});

// ═══════════════════════════════════════
// ACTIVITY LOG
// ═══════════════════════════════════════

// GET /api/admin/activity-log
adminRoutes.get("/activity-log", adminOnly, async (c) => {
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");
  const logs = await AdminService.getActivityLog({ limit, offset });
  return c.json({ logs });
});

export default adminRoutes;
