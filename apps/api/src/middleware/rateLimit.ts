import type { Context, Next } from "hono";

interface RateLimitStore {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitStore>();

/**
 * Simple in-memory rate limiter
 * For production, use Upstash Redis via Cloudflare Workers
 */
export function rateLimit(options: {
  windowMs: number;
  maxRequests: number;
  keyFn?: (c: Context) => string;
}) {
  const { windowMs, maxRequests, keyFn } = options;

  return async (c: Context, next: Next) => {
    const key = keyFn
      ? keyFn(c)
      : c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";

    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      c.header("X-RateLimit-Limit", maxRequests.toString());
      c.header("X-RateLimit-Remaining", (maxRequests - 1).toString());
      c.header("X-RateLimit-Reset", new Date(now + windowMs).toISOString());
      await next();
      return;
    }

    if (entry.count >= maxRequests) {
      c.header("X-RateLimit-Limit", maxRequests.toString());
      c.header("X-RateLimit-Remaining", "0");
      c.header("X-RateLimit-Reset", new Date(entry.resetAt).toISOString());
      c.header("Retry-After", Math.ceil((entry.resetAt - now) / 1000).toString());
      return c.json({ error: "Çok fazla istek gönderdiniz. Lütfen bekleyin." }, 429);
    }

    entry.count++;
    c.header("X-RateLimit-Limit", maxRequests.toString());
    c.header("X-RateLimit-Remaining", (maxRequests - entry.count).toString());
    c.header("X-RateLimit-Reset", new Date(entry.resetAt).toISOString());

    await next();
  };
}

/**
 * Pre-configured rate limiters
 */
export const apiRateLimit = rateLimit({ windowMs: 60_000, maxRequests: 60 }); // 60 req/min

/**
 * Strict IP-based rate limiter for survey submissions
 * 1 submission per IP per minute to prevent spam/abuse
 */
export const surveySubmitRateLimit = rateLimit({
  windowMs: 60_000,
  maxRequests: 1,
  keyFn: (c) => c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown",
});

export const submitRateLimit = rateLimit({
  windowMs: 300_000,
  maxRequests: 3,
  keyFn: (c) => {
    const user = c.get("user") as { id?: string } | undefined;
    if (user?.id) {
      return `user:${user.id}`;
    }
    return c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
  },
}); // 3 submissions per 5 min
export const authRateLimit = rateLimit({ windowMs: 15_000, maxRequests: 5 }); // 5 auth attempts per 15 sec

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60_000);
