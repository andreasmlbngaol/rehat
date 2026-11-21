import "server-only";
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/api/errors";
import { createZoomMeeting } from "@/lib/integrations/zoom";

/**
 * Membuat meeting Zoom untuk satu sesi. Idempoten: bila meeting sudah
 * berstatus `created`, tidak ada permintaan baru ke Zoom.
 */
export async function ensureZoomMeeting(sessionId: string): Promise<void> {
  const session = await prisma.counselingSession.findUnique({
    where: { id: sessionId },
    include: {
      booking: {
        include: { counselor: { select: { fullName: true } } },
      },
      zoomMeeting: true,
    },
  });

  if (!session) {
    throw errors.notFound("Sesi konseling tidak ditemukan.");
  }

  if (session.booking.method !== "zoom") {
    throw errors.validation({ _: ["Sesi ini bukan sesi Zoom."] });
  }

  if (session.zoomMeeting?.integrationStatus === "created") {
    return;
  }

  const meeting =
    session.zoomMeeting ??
    (await prisma.zoomMeeting.create({
      data: {
        sessionId,
        startTime: session.booking.scheduledStart,
        durationMinutes: Math.min(session.booking.durationMinutes, 40),
        integrationStatus: "pending",
      },
    }));

  await prisma.zoomMeeting.update({
    where: { id: meeting.id },
    data: { attemptCount: { increment: 1 } },
  });

  try {
    const created = await createZoomMeeting({
      topic: `Konseling REHAT — ${session.booking.serviceName}`,
      startTime: session.booking.scheduledStart,
      durationMinutes: meeting.durationMinutes,
      agenda: `Sesi konseling bersama ${session.booking.counselor.fullName}.`,
    });

    await prisma.zoomMeeting.update({
      where: { id: meeting.id },
      data: {
        zoomMeetingId: String(created.id),
        joinUrl: created.join_url,
        startUrl: created.start_url,
        integrationStatus: "created",
        lastError: null,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.slice(0, 1000)
        : "Kesalahan tidak diketahui.";

    await prisma.zoomMeeting.update({
      where: { id: meeting.id },
      data: { integrationStatus: "failed", lastError: message },
    });

    throw errors.external("Ruang Zoom gagal dibuat. Coba lagi nanti.");
  }
}
