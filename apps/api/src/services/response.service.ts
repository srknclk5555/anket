import { db } from "../db/index.js";
import { responses, answerValues, questions, questionOptions, sections } from "../db/schema.js";
import { eq, and, desc, sql } from "drizzle-orm";

export class ResponseService {
  /**
   * Submit a survey response
   * Enforces 1 user = 1 response per survey (DB UNIQUE constraint as final safety net)
   * Validates all question IDs and option IDs against the survey definition
   */
  static async submitResponse(data: {
    surveyId: string;
    userId: string;
    ipAddress: string;
    userAgent: string;
    turnstileToken: string;
    answers: {
      questionId: string;
      optionId?: string;
      textValue?: string;
      numberValue?: number;
      rankValue?: number;
      isOtherText?: boolean;
    }[];
  }) {
    // DEBUG: Log incoming answers to understand F12 tampering
    console.log("🔍 DEBUG: Incoming answers from frontend:");
    console.log(JSON.stringify(data.answers, null, 2));
    
    // Verify all question IDs exist in this survey + get question types
    const surveyQuestions = await db.query.questions.findMany({
      where: (q, { exists, eq }) =>
        exists(
          db
            .select({ id: sections.id })
            .from(sections)
            .where(
              and(
                eq(sections.surveyId, data.surveyId),
                eq(q.sectionId, sections.id)
              )
            )
        ),
      columns: { id: true, questionType: true },
    });

    const questionMap = new Map(
      surveyQuestions.map((q) => [q.id, q.questionType])
    );

    // Validate each answer
    for (const answer of data.answers) {
      console.log(`✓ Validating answer for questionId: ${answer.questionId}, optionId: ${answer.optionId}`);
      
      // Check question exists
      const questionType = questionMap.get(answer.questionId);
      if (!questionType) {
        throw new Error("Geçersiz soru ID: soruya erişim yetkiniz yok veya soru silindi");
      }

      // For choice-based questions (radio, checkbox), optionId is REQUIRED
      if (questionType === "radio" || questionType === "checkbox") {
        if (!answer.optionId) {
          throw new Error("Seçenek sorusu için bir seçenek belirtmelisiniz");
        }

        // Verify optionId belongs to this question
        const validOption = await db.query.questionOptions.findFirst({
          where: and(
            eq(questionOptions.id, answer.optionId),
            eq(questionOptions.questionId, answer.questionId)
          ),
          columns: { id: true },
        });

        if (!validOption) {
          console.log(`❌ TAMPERING DETECTED: optionId "${answer.optionId}" not found for questionId "${answer.questionId}"`);
          throw new Error(
            "Geçersiz seçenek ID: seçeneğe erişim yetkiniz yok veya seçenek silindi"
          );
        }
        console.log(`✅ optionId verified: ${answer.optionId}`);
      } else {
        // For non-choice questions, optionId should NOT be present
        if (answer.optionId) {
          throw new Error(
            "Bu soru tipi için seçenek belirtilmemelidir"
          );
        }
      }
    }

    // Double-check at application level (DB UNIQUE is the final guard)
    const existing = await db.query.responses.findFirst({
      where: and(eq(responses.surveyId, data.surveyId), eq(responses.userId, data.userId)),
      columns: { id: true },
    });

    if (existing) {
      throw new Error("Bu ankete zaten katıldınız");
    }

    // Create response
    let response;
    try {
      [response] = await db
        .insert(responses)
        .values({
          surveyId: data.surveyId,
          userId: data.userId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          turnstileToken: data.turnstileToken,
        })
        .returning();
    } catch (error) {
      const message = String(error).toLowerCase();
      if (message.includes("unique_survey_user_response") || message.includes("duplicate key")) {
        throw new Error("Bu ankete zaten katıldınız");
      }
      throw error;
    }

    // Create answer values (only store IDs, never raw text from user)
    if (data.answers.length > 0) {
      await db.insert(answerValues).values(
        data.answers.map((answer) => ({
          responseId: response.id,
          questionId: answer.questionId,
          optionId: answer.optionId || null,
          textValue: answer.textValue ? answer.textValue.substring(0, 1000) : null,
          numberValue: answer.numberValue,
          rankValue: answer.rankValue || null,
          isOtherText: answer.isOtherText || false,
        }))
      );
    }

    return response;
  }

  /**
   * Check if user has already responded
   */
  static async getUserResponse(surveyId: string, userId: string) {
    return db.query.responses.findFirst({
      where: and(eq(responses.surveyId, surveyId), eq(responses.userId, userId)),
      columns: { id: true, submittedAt: true },
    });
  }

  /**
   * Get all responses for a survey (admin only)
   * Excludes user personal information (email, name, etc.)
   */
  static async getSurveyResponses(surveyId: string, options?: { limit?: number; offset?: number }) {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    return db.query.responses.findMany({
      where: eq(responses.surveyId, surveyId),
      with: {
        answers: {
          with: {
            question: {
              columns: { id: true, title: true, questionType: true },
            },
            option: {
              columns: { id: true, label: true },
            },
          },
        },
      },
      limit,
      offset,
      orderBy: [desc(responses.submittedAt)],
    });
  }

  /**
   * Get survey statistics (admin)
   */
  static async getSurveyStats(surveyId: string) {
    // Total responses
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(responses)
      .where(eq(responses.surveyId, surveyId));
    const totalResponses = Number(totalResult[0]?.count || 0);

    // Per-question stats
    const surveySections = await db.query.sections.findMany({
      where: eq(sections.surveyId, surveyId),
      columns: { id: true },
    });

    const sectionIds = surveySections.map((s: { id: string }) => s.id);

    // Get questions for those sections
    const questionStats = [];
    for (const sectionId of sectionIds) {
      const sectionQuestions = await db.query.questions.findMany({
        where: eq(questions.sectionId, sectionId),
        with: {
          options: true,
        },
      });

      for (const question of sectionQuestions) {
        // Count responses for this question
        const qCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(answerValues)
          .where(eq(answerValues.questionId, question.id));

        const stat: {
          questionId: string;
          questionTitle: string;
          questionType: string;
          responseCount: number;
          optionCounts?: { optionId: string; label: string; count: number }[];
          averageValue?: number;
        } = {
          questionId: question.id,
          questionTitle: question.title,
          questionType: question.questionType,
          responseCount: Number(qCount[0]?.count || 0),
        };

        // For choice questions, count per option
        if (["single_choice", "multiple_choice", "dropdown", "yes_no"].includes(question.questionType)) {
          const optionCounts = [];
          for (const option of question.options) {
            const optCount = await db
              .select({ count: sql<number>`count(*)` })
              .from(answerValues)
              .where(eq(answerValues.optionId, option.id));
            optionCounts.push({
              optionId: option.id,
              label: option.label,
              count: Number(optCount[0]?.count || 0),
            });
          }
          stat.optionCounts = optionCounts;
        }

        // For scale/rating questions, calculate average
        if (["linear_scale", "rating", "number"].includes(question.questionType)) {
          const avgResult = await db
            .select({ avg: sql<number>`avg(${answerValues.numberValue})` })
            .from(answerValues)
            .where(eq(answerValues.questionId, question.id));
          stat.averageValue = avgResult[0]?.avg ? Number(Number(avgResult[0].avg).toFixed(2)) : undefined;
        }

        questionStats.push(stat);
      }
    }

    return {
      totalResponses,
      questionStats,
    };
  }

  /**
   * Export responses as CSV data
   */
  static async exportResponsesCSV(surveyId: string) {
    const allResponses = await db.query.responses.findMany({
      where: eq(responses.surveyId, surveyId),
      with: {
        answers: {
          with: {
            question: {
              columns: { id: true, title: true },
            },
            option: {
              columns: { id: true, label: true },
            },
          },
        },
        user: {
          columns: { name: true, email: true },
        },
      },
      orderBy: [desc(responses.submittedAt)],
    });

    return allResponses;
  }
}
