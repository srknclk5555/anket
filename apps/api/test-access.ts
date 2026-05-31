import "dotenv/config";
import { localAuth } from "./src/lib/auth.config.js";
import app from "./src/app.js";

async function test() {
  // 1. Get session for user
  const headers = new Headers();
  // We need to simulate a login or just create a session directly via DB
  // Let's use app.request to test /api/admin/surveys without any cookie
  console.log("No auth request:");
  const res1 = await app.request("http://localhost/api/admin/surveys");
  console.log(res1.status, await res1.json());
}
test();
