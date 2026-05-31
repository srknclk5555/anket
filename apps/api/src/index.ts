import "dotenv/config";
import { serve } from "@hono/node-server";
import app from "./app.js";

const port = parseInt(process.env.API_PORT || "3001");
const hostname = "0.0.0.0";

serve({ fetch: app.fetch, port, hostname }, (info) => {
  console.log(`🚀 API Server running on http://0.0.0.0:${info.port}`);
  console.log(`📱 Telefondan şu adres ile gir: http://[BILGISAYAR_IP]:${info.port}`);
});
