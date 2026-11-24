import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { errors } from "@/lib/api/errors";
import { parseParam } from "@/lib/api/validation";
import { uuidSchema } from "@/lib/validation/common";
import { prisma } from "@/lib/prisma";
import { ensureZoomMeeting } from "@/lib/services/zoom.service";
import { sessionInclude } from "@/lib/services/session.service";
import { toSessionDto } from "@/lib/dto/session";

export const POST = apiRoute<{ sessionId: string }>(
  { auth: "required", roles: ["admin"] },
  async ({ params }) => {
    const sessionId = parseParam(uuidSchema, params.sessionId, "sessionId");

    await ensureZoomMeeting(sessionId);

    const session = await prisma.counselingSession.findUnique({
      where: { id: sessionId },
      include: sessionInclude,
    });

    if (!session) {
      throw errors.notFound("Sesi konseling tidak ditemukan.");
    }

    return ok(
      toSessionDto(session, "admin"),
      "Ruang Zoom berhasil dibuat ulang.",
    );
  },
);
