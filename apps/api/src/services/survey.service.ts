import { db } from "../db/index.js";
import { surveys, sections, questions, questionOptions, responses, customListItems } from "../db/schema.js";
import { eq, and, desc, asc, sql } from "drizzle-orm";

export class SurveyService {
  /**
   * Get all published surveys (public)
   */
  static async getPublishedSurveys() {
    return db.query.surveys.findMany({
      where: eq(surveys.status, "published"),
      columns: {
        id: true,
        title: true,
        description: true,
        publishedAt: true,
        closesAt: true,
      },
      orderBy: [desc(surveys.publishedAt)],
    });
  }

  /**
   * Get survey with full details (sections, questions, options)
   */
  static async getSurveyWithDetails(surveyId: string) {
    const survey = await db.query.surveys.findFirst({
      where: eq(surveys.id, surveyId),
      with: {
        sections: {
          orderBy: [asc(sections.orderIndex)],
          with: {
            questions: {
              orderBy: [asc(questions.orderIndex)],
              with: {
                options: {
                  orderBy: [asc(questionOptions.orderIndex)],
                },
                customList: {
                  with: {
                    items: {
                      orderBy: [asc(customListItems.orderIndex)],
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!survey) return null;

    // Get response count
    const responseCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(responses)
      .where(eq(responses.surveyId, surveyId));

    return {
      ...survey,
      responseCount: Number(responseCount[0]?.count || 0),
    };
  }

  /**
   * Check if a user has already responded to a survey
   */
  static async hasUserResponded(surveyId: string, userId: string): Promise<boolean> {
    const existing = await db.query.responses.findFirst({
      where: and(eq(responses.surveyId, surveyId), eq(responses.userId, userId)),
      columns: { id: true },
    });
    return !!existing;
  }

  /**
   * Get all surveys (admin)
   */
  static async getAllSurveys(options?: { status?: string }) {
    const conditions = options?.status ? eq(surveys.status, options.status as "draft" | "published" | "closed") : undefined;

    return db.query.surveys.findMany({
      where: conditions,
      with: {
        sections: {
          columns: { id: true, title: true },
        },
      },
      orderBy: [desc(surveys.createdAt)],
    });
  }

  /**
   * Create a new survey
   */
  static async createSurvey(data: { title: string; description?: string; createdBy: string }) {
    const [survey] = await db
      .insert(surveys)
      .values({
        title: data.title,
        description: data.description || null,
        createdBy: data.createdBy,
      })
      .returning();

    // Create default section
    await db.insert(sections).values({
      surveyId: survey.id,
      title: "Bölüm 1",
      orderIndex: 0,
    });

    return survey;
  }

  /**
   * Update survey
   */
  static async updateSurvey(surveyId: string, data: { title?: string; description?: string; closesAt?: Date | null }) {
    const [updated] = await db
      .update(surveys)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(surveys.id, surveyId))
      .returning();
    return updated;
  }

  /**
   * Update survey status
   */
  static async updateSurveyStatus(surveyId: string, status: "draft" | "published" | "closed") {
    const updateData: Record<string, unknown> = { status, updatedAt: new Date() };
    if (status === "published") {
      updateData.publishedAt = new Date();
    }

    const [updated] = await db
      .update(surveys)
      .set(updateData)
      .where(eq(surveys.id, surveyId))
      .returning();
    return updated;
  }

  /**
   * Delete a survey and all related data
   */
  static async deleteSurvey(surveyId: string) {
    await db.delete(surveys).where(eq(surveys.id, surveyId));
  }

  /**
   * Add a section
   */
  static async addSection(surveyId: string, title: string, description?: string) {
    // Get max order index
    const existingSections = await db.query.sections.findMany({
      where: eq(sections.surveyId, surveyId),
      columns: { orderIndex: true },
    });
    const maxOrder = existingSections.length > 0 ? Math.max(...existingSections.map((s) => s.orderIndex)) : -1;

    const [section] = await db
      .insert(sections)
      .values({
        surveyId,
        title,
        description: description || null,
        orderIndex: maxOrder + 1,
      })
      .returning();
    return section;
  }

  /**
   * Update section
   */
  static async updateSection(sectionId: string, data: { title?: string; description?: string }) {
    const [updated] = await db
      .update(sections)
      .set(data)
      .where(eq(sections.id, sectionId))
      .returning();
    return updated;
  }

  /**
   * Delete section
   */
  static async deleteSection(sectionId: string) {
    await db.delete(sections).where(eq(sections.id, sectionId));
  }

  /**
   * Reorder sections (transactional swap)
   */
  static async reorderSections(items: { id: string; orderIndex: number }[]) {
    for (const item of items) {
      await db
        .update(sections)
        .set({ orderIndex: item.orderIndex })
        .where(eq(sections.id, item.id));
    }
  }

  /**
   * Add a question
   */
  static async addQuestion(sectionId: string, data: {
    questionType: string;
    title: string;
    description?: string;
    isRequired?: boolean;
    scaleMin?: number;
    scaleMax?: number;
    scaleMinLabel?: string;
    scaleMaxLabel?: string;
    customListId?: string;
    options?: { label: string; isOther?: boolean }[];
  }) {
    // Get max order index
    const existingQuestions = await db.query.questions.findMany({
      where: eq(questions.sectionId, sectionId),
      columns: { orderIndex: true },
    });
    const maxOrder = existingQuestions.length > 0 ? Math.max(...existingQuestions.map((q) => q.orderIndex)) : -1;

    const [question] = await db
      .insert(questions)
      .values({
        sectionId,
        questionType: data.questionType as "short_text",
        title: data.title,
        description: data.description || null,
        isRequired: data.isRequired ?? true,
        orderIndex: maxOrder + 1,
        scaleMin: data.scaleMin || null,
        scaleMax: data.scaleMax || null,
        scaleMinLabel: data.scaleMinLabel || null,
        scaleMaxLabel: data.scaleMaxLabel || null,
        customListId: data.customListId || null,
      })
      .returning();

    // Add options if provided
    if (data.options && data.options.length > 0) {
      await db.insert(questionOptions).values(
        data.options.map((opt, i) => ({
          questionId: question.id,
          label: opt.label,
          orderIndex: i,
          isOther: opt.isOther || false,
        }))
      );
    }

    return question;
  }

  /**
   * Update question
   */
  static async updateQuestion(questionId: string, data: Record<string, unknown>) {
    const [updated] = await db
      .update(questions)
      .set(data)
      .where(eq(questions.id, questionId))
      .returning();
    return updated;
  }

  /**
   * Delete question
   */
  static async deleteQuestion(questionId: string) {
    await db.delete(questions).where(eq(questions.id, questionId));
  }

  /**
   * Reorder questions (transactional swap)
   */
  static async reorderQuestions(items: { id: string; orderIndex: number }[]) {
    for (const item of items) {
      await db
        .update(questions)
        .set({ orderIndex: item.orderIndex })
        .where(eq(questions.id, item.id));
    }
  }

  /**
   * Add option to a question
   */
  static async addOption(questionId: string, label: string, isOther = false) {
    const existingOptions = await db.query.questionOptions.findMany({
      where: eq(questionOptions.questionId, questionId),
      columns: { orderIndex: true },
    });
    const maxOrder = existingOptions.length > 0 ? Math.max(...existingOptions.map((o) => o.orderIndex)) : -1;

    const [option] = await db
      .insert(questionOptions)
      .values({
        questionId,
        label,
        orderIndex: maxOrder + 1,
        isOther,
      })
      .returning();
    return option;
  }

  /**
   * Update option
   */
  static async updateOption(optionId: string, data: { label?: string; orderIndex?: number }) {
    const [updated] = await db
      .update(questionOptions)
      .set(data)
      .where(eq(questionOptions.id, optionId))
      .returning();
    return updated;
  }

  /**
   * Delete option
   */
  static async deleteOption(optionId: string) {
    await db.delete(questionOptions).where(eq(questionOptions.id, optionId));
  }
}
