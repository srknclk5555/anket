import { Hono } from "hono";
import { CustomListService } from "../services/custom-list.service.js";
import { adminOnly } from "../middleware/rbac.js";
import {
  createCustomListSchema,
  updateCustomListSchema,
  bulkAddCustomListItemsSchema,
} from "@gorunmeyen-lig/shared";

const customListRoutes = new Hono();

// Tüm route'lar admin yetkisi gerektirir
customListRoutes.use("/*", adminOnly);

// GET /api/admin/custom-lists
customListRoutes.get("/", async (c) => {
  const lists = await CustomListService.getLists();
  return c.json({ lists });
});

// GET /api/admin/custom-lists/:id
customListRoutes.get("/:id", async (c) => {
  const list = await CustomListService.getList(c.req.param("id"));
  if (!list) return c.json({ error: "Liste bulunamadı" }, 404);
  return c.json({ list });
});

// POST /api/admin/custom-lists
customListRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = createCustomListSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Geçersiz veri", details: parsed.error.errors }, 400);

  const list = await CustomListService.createList(parsed.data);
  return c.json({ list }, 201);
});

// PATCH /api/admin/custom-lists/:id
customListRoutes.patch("/:id", async (c) => {
  const body = await c.req.json();
  const parsed = updateCustomListSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Geçersiz veri", details: parsed.error.errors }, 400);

  const list = await CustomListService.updateList(c.req.param("id"), parsed.data);
  return c.json({ list });
});

// DELETE /api/admin/custom-lists/:id
customListRoutes.delete("/:id", async (c) => {
  await CustomListService.deleteList(c.req.param("id"));
  return c.json({ success: true });
});

// POST /api/admin/custom-lists/:id/bulk-items
customListRoutes.post("/:id/bulk-items", async (c) => {
  const body = await c.req.json();
  const parsed = bulkAddCustomListItemsSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Geçersiz veri", details: parsed.error.errors }, 400);

  const list = await CustomListService.bulkAddItems(c.req.param("id"), parsed.data);
  return c.json({ list });
});

// DELETE /api/admin/custom-lists/:id/items/:itemId
customListRoutes.delete("/:id/items/:itemId", async (c) => {
  await CustomListService.deleteItem(c.req.param("itemId"));
  return c.json({ success: true });
});

export default customListRoutes;
