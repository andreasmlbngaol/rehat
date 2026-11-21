import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { errors } from "@/lib/api/errors";
import { parseParam } from "@/lib/api/validation";
import { uuidSchema } from "@/lib/validation/common";
import { prisma } from "@/lib/prisma";
import { ensureZoomMeeting } from "@/lib/services/zoom.service";

export const POST = apiRoute<{ id: string }>(
  {
    auth: "required",
    roles: ["counselor"],
    rateLimit: { limit: 5, windowMs: 60_000 },
  },
  async ({ params, user }) => {
    const id = parseParam(uuidSchema, params.id);

    const session = await prisma.counselingSession.findUnique({
      where: { id },
      include: {
        booking: { select: { counselorId: true, method: true } },
      },
    });

    if (!session) {
      throw errors.notFound("Sesi konseling tidak ditemukan.");
    }

    if (session.booking.counselorId !== user!.id) {
      throw errors.forbidden("Anda tidak ditugaskan pada sesi ini.");
    }

    if (session.booking.method !== "zoom") {
      throw errors.validation({ _: ["Sesi ini bukan sesi Zoom."] });
    }

    await ensureZoomMeeting(session.id);

    const meeting = await prisma.zoomMeeting.findUnique({
      where: { sessionId: session.id },
    });

    return ok(
      {
        status: meeting?.integrationStatus ?? "pending",
        attemptCount: meeting?.attemptCount ?? 0,
        joinUrl: meeting?.joinUrl ?? null,
        startUrl: meeting?.startUrl ?? null,
      },
      "Ruang Zoom berhasil dibuat.",
    );
  },
);
