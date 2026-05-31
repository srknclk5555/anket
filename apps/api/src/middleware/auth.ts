import { createMiddleware } from "hono/factory";
import type { Context, Next } from "hono";
import { getAuth } from "../lib/auth.config.js";

/**
 * Auth middleware — validates session and attaches user to context
 */
export const authMiddleware = createMiddleware(async (c: Context, next: Next) => {
  const auth = getAuth(c.req.raw);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: "Oturum açmanız gerekiyor" }, 401);
  }

  c.set("user", session.user);
  c.set("session", session.session);

  await next();
});

/**
 * Optional auth — attaches user if logged in, but doesn't block
 */
export const optionalAuth = createMiddleware(async (c: Context, next: Next) => {
  const auth = getAuth(c.req.raw);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (session?.user) {
    c.set("user", session.user);
    c.set("session", session.session);
  }

  await next();
});

/**
 * Verify proxy secret — ensures request came from Cloudflare Workers
 */
export const proxyVerifyMiddleware = createMiddleware(async (c: Context, next: Next) => {
  const proxySecret = c.req.header("x-proxy-secret");

  if (proxySecret !== "gorunmeyen-lig-internal") {
    return c.json({ error: "Yetkisiz erişim" }, 403);
  }

  await next();
});
