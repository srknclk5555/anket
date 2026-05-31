import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";

interface Env {
  API_BASE_URL: string;
  FRONTEND_URL: string;
  TURNSTILE_SECRET_KEY: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS — only allow frontend domain
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const allowed = [c.env.FRONTEND_URL];
      return allowed.includes(origin) ? origin : "";
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);

// Security headers
app.use("*", secureHeaders());

// Request body size limit (100KB)
app.use("/api/*", async (c, next) => {
  const contentLength = c.req.header("content-length");
  if (contentLength && parseInt(contentLength) > 100 * 1024) {
    return c.json({ error: "İstek gövdesi çok büyük (maks 100KB)" }, 413);
  }
  await next();
});

// Turnstile verification for POST requests
app.use("/api/surveys/*/responses", async (c, next) => {
  if (c.req.method !== "POST") {
    await next();
    return;
  }

  try {
    const body = await c.req.raw.clone().json();
    const token = body.turnstileToken;

    if (!token) {
      return c.json({ error: "Güvenlik doğrulaması gerekli" }, 400);
    }

    const verifyResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: c.env.TURNSTILE_SECRET_KEY,
          response: token,
        }),
      }
    );

    const verifyResult = (await verifyResponse.json()) as { success: boolean };

    if (!verifyResult.success) {
      return c.json({ error: "Güvenlik doğrulaması başarısız" }, 403);
    }
  } catch {
    return c.json({ error: "Güvenlik doğrulaması işlenemedi" }, 400);
  }

  await next();
});

// Proxy all /api/* requests to Render backend
app.all("/api/*", async (c) => {
  const path = c.req.path;
  const targetUrl = `${c.env.API_BASE_URL}${path}`;

  const headers = new Headers(c.req.raw.headers);
  headers.set("X-Forwarded-For", c.req.header("x-real-ip") || c.req.header("cf-connecting-ip") || "");
  headers.set("X-Proxy-Secret", "gorunmeyen-lig-internal");

  const body = c.req.method !== "GET" && c.req.method !== "HEAD" ? await c.req.raw.arrayBuffer() : undefined;

  const response = await fetch(targetUrl, {
    method: c.req.method,
    headers,
    body,
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
});

export default app;
