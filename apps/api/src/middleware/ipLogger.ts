import { Context, Next } from "hono";

export const ipLogger = async (c: Context, next: Next) => {
  // x-forwarded-for ve cf-connecting-ip headerlarından IP al
  let ip =
    c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
    c.req.header("cf-connecting-ip") ||
    c.req.header("x-real-ip");

  const method = c.req.method;
  const path = c.req.path;

  // IP adresini, HTTP metodunu ve path'i console.log ile yaz
  console.log(`[IP LOG] IP: ${ip} | Method: ${method} | Path: ${path}`);

  await next();
};
