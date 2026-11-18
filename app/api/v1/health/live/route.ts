import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";

/**
 * Liveness: proses hidup. Dipakai uptime monitor agar tidak membebani DB.
 */
export const GET = apiRoute({}, async () => {
  return ok({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});
