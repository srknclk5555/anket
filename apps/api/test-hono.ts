import { Hono } from "hono";

const app = new Hono();
const adminRoutes = new Hono();

adminRoutes.use("/*", async (c, next) => {
  c.set("mw", true);
  console.log("Middleware executed!");
  await next();
});

adminRoutes.get("/surveys", (c) => {
  return c.json({ mw: c.get("mw") || false, msg: "Hello" });
});

app.route("/api/admin", adminRoutes);

async function test() {
  const res = await app.request("http://localhost/api/admin/surveys");
  const json = await res.json();
  console.log("Result:", json);
}

test();
