import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

const ADMIN_ROLE = "admin" as const;

export class AuthService {
  private static getAdminEmail(): string {
    return process.env.ADMIN_EMAIL || "";
  }

  /**
   * Find or create a user from Google OAuth data
   * If the user's email matches ADMIN_EMAIL, set isAdmin = true
   */
  static async findOrCreateUser(googleData: {
    sub: string;
    email: string;
    name?: string;
    picture?: string;
  }) {
    const adminEmail = this.getAdminEmail();
    const existing = await db.query.users.findFirst({
      where: eq(users.googleId, googleData.sub),
    });

    if (existing) {
      await db
        .update(users)
        .set({ lastLogin: new Date() })
        .where(eq(users.id, existing.id));

      if (googleData.email === adminEmail && !existing.isAdmin) {
        await db
          .update(users)
          .set({ isAdmin: true, role: ADMIN_ROLE })
          .where(eq(users.id, existing.id));
        existing.isAdmin = true;
        existing.role = ADMIN_ROLE;
      }

      return existing;
    }

    const isAdmin = googleData.email === adminEmail;
    const [newUser] = await db
      .insert(users)
      .values({
        googleId: googleData.sub,
        email: googleData.email,
        name: googleData.name || null,
        avatarUrl: googleData.picture || null,
        isAdmin,
        role: isAdmin ? ADMIN_ROLE : "user",
      })
      .returning();

    return newUser;
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string) {
    return db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  /**
   * Check if user has admin privileges
   */
  static async isUserAdmin(userId: string): Promise<boolean> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { isAdmin: true, role: true },
    });
    return user?.isAdmin === true || user?.role === "admin";
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers(options?: { limit?: number; offset?: number }) {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    return db.query.users.findMany({
      limit,
      offset,
      columns: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        isAdmin: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });
  }
}
