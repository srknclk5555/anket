import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";
import { getAuth } from "./lib/auth.config.js";
import { handleAuthMe } from "./routes/auth.routes.js";
import surveyRoutes from "./routes/survey.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { authRateLimit } from "./middleware/rateLimit.js";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => {
      const fallbackOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
      const allowedUrls = [
        process.env.FRONTEND_URL,
        process.env.CALLBACK_URL,
        process.env.BETTER_AUTH_URL,
      ].filter(Boolean);

      if (!origin) {
        return fallbackOrigin;
      }

      return allowedUrls.includes(origin) ? origin : fallbackOrigin;
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);

const authRateLimitPaths = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/callback",
  "/api/auth/callback/google",
  "/api/auth/logout",
];

app.use("/api/auth/*", async (c, next) => {
  const path = c.req.path;
  if (path === "/api/auth/me") {
    return await next();
  }

  if (authRateLimitPaths.some((allowed) => path.startsWith(allowed))) {
    return authRateLimit(c, next);
  }

  return await next();
});

app.use("*", secureHeaders({
  crossOriginOpenerPolicy: "same-origin-allow-popups",
}));

app.use("/api/*", async (c, next) => {
  const contentLength = c.req.header("content-length");
  if (contentLength && parseInt(contentLength) > 100 * 1024) {
    return c.json({ error: "İstek gövdesi çok büyük (maks 100KB)" }, 413);
  }
  await next();
});

app.use("/api/*", timeout(10_000));

app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/auth/me", handleAuthMe);

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  const auth = getAuth(c.req.raw);
  return auth.handler(c.req.raw);
});

app.route("/api/surveys", surveyRoutes);
app.route("/api/admin", adminRoutes);

app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Sunucu hatası oluştu", details: err.message, stack: err.stack }, 500);
});

app.notFound((c) => {
  return c.json({ error: "Endpoint bulunamadı" }, 404);
});

export default app;
