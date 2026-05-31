import type { Context, Next } from "hono";
import { z, ZodSchema } from "zod";

/**
 * Zod validation middleware — validates request body against a Zod schema
 */
export function validateBody(schema: ZodSchema) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const result = schema.safeParse(body);

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        return c.json({ error: "Doğrulama hatası", details: errors }, 400);
      }

      // Sanitize validated input to reduce stored XSS payload risk
      const sanitizedData = sanitizeObject(result.data as Record<string, unknown>);
      c.set("parsedBody", sanitizedData);
      await next();
    } catch {
      return c.json({ error: "Geçersiz istek gövdesi" }, 400);
    }
  };
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQuery(schema: ZodSchema) {
  return async (c: Context, next: Next) => {
    const query = c.req.query();
    const result = schema.safeParse(query);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return c.json({ error: "Doğrulama hatası", details: errors }, 400);
    }

    c.set("parsedQuery", result.data);
    await next();
  };
}

/**
 * Sanitize string input — strip HTML tags and trim whitespace
 * Remove control characters and dangerous entities
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
    .replace(/&(nbsp|amp|quot|apos|lt|gt);/gi, "") // Strip HTML entities
    .trim();
}

/**
 * Recursively sanitize all string fields in an object
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string" ? sanitizeString(item) :
        typeof item === "object" && item !== null ? sanitizeObject(item as Record<string, unknown>) : item
      );
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}
