import { db } from "../db/index.js";
import { adminActivityLog, users, surveyAssignments, surveys, responses } from "../db/schema.js";
import { eq, desc, sql } from "drizzle-orm";

export class AdminService {
  /**
   * Get overview stats for the dashboard
   */
  static async getOverviewStats() {
    const totalSurveysResult = await db.select({ count: sql<number>`count(*)` }).from(surveys);
    const publishedSurveysResult = await db.select({ count: sql<number>`count(*)` }).from(surveys).where(eq(surveys.status, "published"));
    const totalResponsesResult = await db.select({ count: sql<number>`count(*)` }).from(responses);
    const totalUsersResult = await db.select({ count: sql<number>`count(*)` }).from(users);

    return {
      totalSurveys: Number(totalSurveysResult[0]?.count || 0),
      publishedSurveys: Number(publishedSurveysResult[0]?.count || 0),
      totalResponses: Number(totalResponsesResult[0]?.count || 0),
      totalUsers: Number(totalUsersResult[0]?.count || 0),
    };
  }

  /**
   * Log an admin action
   */
  static async logAction(data: {
    userId: string;
    action: string;
    targetType: string;
    targetId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
  }) {
    const [log] = await db
      .insert(adminActivityLog)
      .values({
        userId: data.userId,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId || null,
        details: data.details || null,
        ipAddress: data.ipAddress || null,
      })
      .returning();
    return log;
  }

  /**
   * Get activity log (admin only)
   */
  static async getActivityLog(options?: { limit?: number; offset?: number }) {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    return db.query.adminActivityLog.findMany({
      with: {
        user: {
          columns: { name: true, email: true },
        },
      },
      limit,
      offset,
      orderBy: [desc(adminActivityLog.createdAt)],
    });
  }

  /**
   * Update user role
   */
  static async updateUserRole(userId: string, role: string) {
    const [updated] = await db
      .update(users)
      .set({ role: role as "admin" | "editor" | "viewer" | "user" })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  /**
   * Assign user to a survey with permissions
   */
  static async assignUserToSurvey(data: {
    surveyId: string;
    userId: string;
    role: "editor" | "viewer";
    canEdit: boolean;
    canView: boolean;
    canExport: boolean;
    assignedBy: string;
  }) {
    const [assignment] = await db
      .insert(surveyAssignments)
      .values({
        surveyId: data.surveyId,
        userId: data.userId,
        role: data.role,
        canEdit: data.canEdit,
        canView: data.canView,
        canExport: data.canExport,
        assignedBy: data.assignedBy,
      })
      .returning();
    return assignment;
  }

  /**
   * Update survey assignment permissions
   */
  static async updateAssignment(assignmentId: string, data: {
    role?: "editor" | "viewer";
    canEdit?: boolean;
    canView?: boolean;
    canExport?: boolean;
  }) {
    const [updated] = await db
      .update(surveyAssignments)
      .set(data)
      .where(eq(surveyAssignments.id, assignmentId))
      .returning();
    return updated;
  }

  /**
   * Remove survey assignment
   */
  static async removeAssignment(assignmentId: string) {
    await db.delete(surveyAssignments).where(eq(surveyAssignments.id, assignmentId));
  }

  /**
   * Get survey assignments for a specific survey
   */
  static async getSurveyAssignments(surveyId: string) {
    return db.query.surveyAssignments.findMany({
      where: eq(surveyAssignments.surveyId, surveyId),
      with: {
        user: {
          columns: { id: true, name: true, email: true },
        },
      },
    });
  }
}
