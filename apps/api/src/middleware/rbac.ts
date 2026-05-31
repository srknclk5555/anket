import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { surveyAssignments } from "../db/schema.js";

type RoleCheck = "admin" | "editor" | "viewer" | "user";

const ROLE_HIERARCHY: Record<RoleCheck, number> = {
  admin: 4,
  editor: 3,
  viewer: 2,
  user: 1,
};

/**
 * RBAC middleware — checks if the authenticated user has the required role
 * Must be used AFTER authMiddleware
 */
export function requireRole(minRole: RoleCheck) {
  return createMiddleware(async (c, next) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Oturum açmanız gerekiyor" }, 401);
    
    const userRoleStr = typeof user.role === "string" ? user.role.toLowerCase() : "user";
    const userLevel = ROLE_HIERARCHY[userRoleStr as RoleCheck] ?? 0;
    const minLevel = ROLE_HIERARCHY[minRole];

    if (userLevel < minLevel) {
      return c.json({ error: "Bu işlem için yetkiniz yok" }, 403);
    }

    await next();
  });
}

/**
 * Admin-only middleware — shortcut for requireRole("admin")
 */
export const adminOnly = requireRole("admin");

/**
 * Check survey-specific permissions
 * Used for editor/viewer roles that are assigned per-survey
 */
export function requireSurveyPermission(
  permission: "canEdit" | "canView" | "canExport"
) {
  return createMiddleware(async (c, next) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Oturum açmanız gerekiyor" }, 401);

    if ((user as { role?: string }).role === "admin") {
      await next();
      return;
    }

    const surveyId = c.req.param("id");
    if (!surveyId) {
      return c.json({ error: "Geçersiz anket ID" }, 400);
    }

    const userId = (user as { id?: string }).id;
    if (!userId) {
      return c.json({ error: "Geçersiz kullanıcı" }, 401);
    }

    const assignment = await db.query.surveyAssignments.findFirst({
      where: and(
        eq(surveyAssignments.surveyId, surveyId),
        eq(surveyAssignments.userId, userId)
      ),
    });

    if (!assignment || !assignment[permission]) {
      return c.json({ error: "Bu anket için yetkiniz yok" }, 403);
    }

    await next();
  });
}
