import type { Context } from "hono";
import { getAuth } from "../lib/auth.config.js";
import type { SessionUser } from "@gorunmeyen-lig/shared";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

/** Maps better-auth session to the app's SessionUser shape */
export async function handleAuthMe(c: Context) {
  const auth = getAuth(c.req.raw);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: "Oturum bulunamadı" }, 401);
  }

  const { user } = session;
  let isAdmin = Boolean((user as { isAdmin?: boolean }).isAdmin);
  let role = ((user as { role?: string }).role as SessionUser["role"]) ?? "user";

  // Auto-promote admin if email matches environment variable but they were already created
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (adminEmail && user.email.toLowerCase() === adminEmail && !isAdmin) {
    isAdmin = true;
    role = "admin";
    try {
      await db
        .update(users)
        .set({ isAdmin: true, role: "admin" })
        .where(eq(users.id, user.id));
    } catch (err) {
      console.error("Failed to auto-promote admin user:", err);
    }
  }

  const profile: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    avatarUrl: (user.image as string | null) ?? (user as { avatarUrl?: string }).avatarUrl ?? null,
    role,
    isAdmin,
  };

  return c.json(profile);
}
