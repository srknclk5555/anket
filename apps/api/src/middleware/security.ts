import type { Context, Next } from "hono";

/**
 * Timing check middleware — rejects form submissions that are too fast (bot indicator)
 * Requires "formOpenedAt" timestamp in the request body
 */
export const timingCheck = async (c: Context, next: Next) => {
  if (c.req.method !== "POST") {
    await next();
    return;
  }

  try {
    const body = await c.req.raw.clone().json();
    const formOpenedAt = body.formOpenedAt;

    if (formOpenedAt) {
      const elapsed = Date.now() - formOpenedAt;
      const MIN_FORM_TIME = 2000; // 2 seconds minimum

      if (elapsed < MIN_FORM_TIME) {
        return c.json({ error: "Form çok hızlı gönderildi" }, 400);
      }
    }
  } catch {
    // If we can't parse the body, just continue
  }

  await next();
};

/**
 * Honeypot check — rejects submissions that have the honeypot field filled
 * Bots typically fill all form fields including hidden ones
 */
export const honeypotCheck = async (c: Context, next: Next) => {
  if (c.req.method !== "POST") {
    await next();
    return;
  }

  try {
    const body = await c.req.raw.clone().json();

    if (body.honeypot && body.honeypot.length > 0) {
      return c.json({ error: "Geçersiz istek" }, 400);
    }
  } catch {
    // If we can't parse the body, just continue
  }

  await next();
};

/**
 * IP extraction helper — gets the real IP from Cloudflare headers
 */
export function getClientIp(c: Context): string {
  return (
    c.req.header("cf-connecting-ip") ||
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown"
  );
}

/**
 * User agent extraction
 */
export function getUserAgent(c: Context): string {
  return c.req.header("user-agent")?.substring(0, 500) || "unknown";
}
