import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseParam } from "@/lib/api/validation";
import { uuidSchema } from "@/lib/validation/common";
import {
  getSessionForViewer,
  reconcileSessionStatus,
} from "@/lib/services/session.service";
import { toSessionDto } from "@/lib/dto/session";

export const GET = apiRoute<{ id: string }>(
  { auth: "required" },
  async ({ params, user }) => {
    const id = parseParam(uuidSchema, params.id);

    await reconcileSessionStatus(id);

    const { session, access } = await getSessionForViewer(id, user!);

    return ok(toSessionDto(session, access));
  },
);
