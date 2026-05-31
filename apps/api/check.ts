import "dotenv/config";
import { db } from "./src/db/index.js";
import { users } from "./src/db/schema.js";

async function main() {
  const allUsers = await db.select().from(users);
  console.log("Users:", allUsers.map(u => ({ email: u.email, role: u.role, isAdmin: u.isAdmin })));
  process.exit(0);
}
main();
