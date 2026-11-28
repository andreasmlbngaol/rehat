import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseParam } from "@/lib/api/validation";
import { uuidSchema } from "@/lib/validation/common";
import {
  endSession,
  reconcileSessionStatus,
} from "@/lib/services/session.service";
import { toSessionDto } from "@/lib/dto/session";

export const POST = apiRoute<{ id: string }>(
  { auth: "required", roles: ["patient", "counselor"] },
  async ({ params, user }) => {
    const id = parseParam(uuidSchema, params.id);

    await reconcileSessionStatus(id);

    const session = await endSession(id, user!.id);

    return ok(
      toSessionDto(session, user!.role as "patient" | "counselor"),
      "Sesi telah diakhiri.",
    );
  },
);
