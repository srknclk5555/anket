import { db } from "../db/index.js";
import { customLists, customListItems } from "../db/schema.js";
import { eq, asc } from "drizzle-orm";
import type { CreateCustomListInput, UpdateCustomListInput, BulkAddCustomListItemsInput } from "@gorunmeyen-lig/shared";

export class CustomListService {
  /**
   * Get all custom lists
   */
  static async getLists() {
    return db.query.customLists.findMany({
      orderBy: [asc(customLists.createdAt)],
    });
  }

  /**
   * Get a single list with its items
   */
  static async getList(id: string) {
    return db.query.customLists.findFirst({
      where: eq(customLists.id, id),
      with: {
        items: {
          orderBy: [asc(customListItems.orderIndex)],
        },
      },
    });
  }

  /**
   * Create a new custom list
   */
  static async createList(data: CreateCustomListInput) {
    const [list] = await db
      .insert(customLists)
      .values({
        name: data.name,
        description: data.description || null,
      })
      .returning();
    return list;
  }

  /**
   * Update an existing custom list
   */
  static async updateList(id: string, data: UpdateCustomListInput) {
    const updateData: Partial<typeof customLists.$inferInsert> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    updateData.updatedAt = new Date();

    const [list] = await db
      .update(customLists)
      .set(updateData)
      .where(eq(customLists.id, id))
      .returning();
    return list;
  }

  /**
   * Delete a custom list
   */
  static async deleteList(id: string) {
    const [list] = await db
      .delete(customLists)
      .where(eq(customLists.id, id))
      .returning();
    return list;
  }

  /**
   * Bulk add items to a list
   */
  static async bulkAddItems(listId: string, data: BulkAddCustomListItemsInput) {
    // get current max order index
    const existing = await db.query.customListItems.findMany({
      where: eq(customListItems.listId, listId),
      orderBy: [asc(customListItems.orderIndex)],
    });
    const maxOrderIndex = existing.length > 0 ? existing[existing.length - 1].orderIndex : -1;

    const newItems = data.items.map((value, index) => ({
      listId,
      value,
      orderIndex: maxOrderIndex + 1 + index,
    }));

    if (newItems.length > 0) {
      await db.insert(customListItems).values(newItems);
    }

    // Return the updated list with items
    return this.getList(listId);
  }

  /**
   * Delete an item from a list
   */
  static async deleteItem(itemId: string) {
    await db.delete(customListItems).where(eq(customListItems.id, itemId));
  }
}
