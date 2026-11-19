import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { errors } from "@/lib/api/errors";
import { parseQuery } from "@/lib/api/validation";
import { publicTimeSlotQuerySchema } from "@/lib/validation/time-slot";
import { prisma } from "@/lib/prisma";
import { toTimeSlotDto } from "@/lib/services/time-slot.service";

export const GET = apiRoute({ auth: "none" }, async ({ searchParams }) => {
  const query = parseQuery(publicTimeSlotQuerySchema, searchParams);

  const counselor = await prisma.profile.findFirst({
    where: { id: query.counselorId, role: "counselor", isActive: true },
    select: { id: true },
  });

  if (!counselor) {
    throw errors.notFound("Konselor tidak ditemukan.");
  }

  let durationMinutes: number | undefined;

  if (query.serviceId) {
    const service = await prisma.service.findFirst({
      where: {
        id: query.serviceId,
        isActive: true,
        counselors: { some: { counselorId: query.counselorId } },
      },
      select: { durationMinutes: true },
    });

    if (!service) {
      throw errors.notFound("Layanan tidak tersedia untuk konselor ini.");
    }

    durationMinutes = service.durationMinutes;
  }

  const now = new Date();
  const dayStart = query.date
    ? new Date(`${query.date}T00:00:00+07:00`)
    : undefined;
  const dayEnd = query.date
    ? new Date(`${query.date}T23:59:59.999+07:00`)
    : undefined;

  const slots = await prisma.timeSlot.findMany({
    where: {
      counselorId: query.counselorId,
      status: "available",
      startTime: {
        gt: now,
        ...(dayStart && dayEnd ? { gte: dayStart, lte: dayEnd } : {}),
      },
    },
    orderBy: { startTime: "asc" },
    take: 200,
  });

  const usable = durationMinutes
    ? slots.filter(
        (slot) =>
          slot.endTime.getTime() - slot.startTime.getTime() >=
          durationMinutes * 60_000,
      )
    : slots;

  return ok(usable.map(toTimeSlotDto));
});
