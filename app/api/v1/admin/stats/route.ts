import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { getAdminStats } from "@/lib/services/admin.service";

export const GET = apiRoute(
  { auth: "required", roles: ["admin"] },
  async () => {
    const stats = await getAdminStats();
    return ok(stats);
  },
);
