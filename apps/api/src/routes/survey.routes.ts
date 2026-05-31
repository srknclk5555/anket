import { Hono } from "hono";
import { SurveyService } from "../services/survey.service.js";
import { ResponseService } from "../services/response.service.js";
import { authMiddleware } from "../middleware/auth.js";
import { surveySubmitRateLimit, submitRateLimit } from "../middleware/rateLimit.js";
import { timingCheck, honeypotCheck, getClientIp, getUserAgent } from "../middleware/security.js";
import { validateBody } from "../middleware/validate.js";
import { submitResponseSchema } from "@gorunmeyen-lig/shared";

const surveyRoutes = new Hono();

// GET /api/surveys — list published surveys
surveyRoutes.get("/", async (c) => {
  const surveys = await SurveyService.getPublishedSurveys();
  return c.json({ surveys });
});

// GET /api/surveys/:id — get survey with details
surveyRoutes.get("/:id", async (c) => {
  const surveyId = c.req.param("id");
  if (!surveyId) return c.json({ error: "Geçersiz anket ID" }, 400);
  const survey = await SurveyService.getSurveyWithDetails(surveyId);

  if (!survey) {
    return c.json({ error: "Anket bulunamadı" }, 404);
  }

  if (survey.status !== "published") {
    return c.json({ error: "Bu anket şu anda yayında değil" }, 403);
  }

  return c.json({ survey });
});

// GET /api/surveys/:id/my-response — check if user already responded
surveyRoutes.get("/:id/my-response", authMiddleware, async (c) => {
  const surveyId = c.req.param("id");
  if (!surveyId) return c.json({ error: "Geçersiz anket ID" }, 400);
  const user = c.get("user") as { id: string };
  const userId = user.id;
  const response = await ResponseService.getUserResponse(surveyId, userId);
  return c.json({ hasResponded: !!response, response });
});

// POST /api/surveys/:id/responses — submit response
surveyRoutes.post(
  "/:id/responses",
  authMiddleware,
  surveySubmitRateLimit,
  submitRateLimit,
  timingCheck,
  honeypotCheck,
  validateBody(submitResponseSchema),
  async (c) => {
    const surveyId = c.req.param("id");
    if (!surveyId) return c.json({ error: "Geçersiz anket ID" }, 400);
    const user = c.get("user") as { id: string };
    const userId = user.id;
    const body = c.get("parsedBody") as { turnstileToken: string; answers: unknown };

    // Check survey exists and is published
    const survey = await SurveyService.getSurveyWithDetails(surveyId);
    if (!survey) {
      return c.json({ error: "Anket bulunamadı" }, 404);
    }
    if (survey.status !== "published") {
      return c.json({ error: "Bu anket yayında değil" }, 403);
    }
    if (survey.closesAt && new Date() > survey.closesAt) {
      return c.json({ error: "Bu anketin süresi dolmuş" }, 403);
    }

    try {
      const response = await ResponseService.submitResponse({
        surveyId,
        userId,
        ipAddress: getClientIp(c),
        userAgent: getUserAgent(c),
        turnstileToken: body.turnstileToken,
        answers: Array.isArray(body.answers) ? body.answers : [],
      });

      return c.json({
        message: "Anket başarıyla tamamlandı. Katıldığınız için teşekkürler. Sonuçlar için takipte kalın.",
        responseId: response.id,
      }, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bir hata oluştu";
      if (message.includes("zaten katıldınız")) {
        return c.json({ error: message }, 409);
      }
      if (
        message.includes("Geçersiz soru ID") ||
        message.includes("Geçersiz seçenek ID") ||
        message.includes("Seçenek sorusu için") ||
        message.includes("soru tipi için") ||
        message.includes("erişim yetkiniz yok")
      ) {
        return c.json({ error: message }, 400);
      }
      throw err;
    }
  }
);

export default surveyRoutes;
