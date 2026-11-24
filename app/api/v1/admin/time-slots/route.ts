import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { errors } from "@/lib/api/errors";
import { parseBody, parseQuery, readJson } from "@/lib/api/validation";
import {
  adminCreateTimeSlotSchema,
  timeSlotListQuerySchema,
} from "@/lib/validation/time-slot";
import { prisma } from "@/lib/prisma";
import {
  createTimeSlot,
  toTimeSlotDto,
} from "@/lib/services/time-slot.service";
import { paginated } from "@/lib/dto/pagination";

export const GET = apiRoute(
  { auth: "required", roles: ["admin"] },
  async ({ searchParams }) => {
    const query = parseQuery(timeSlotListQuerySchema, searchParams);

    const where = {
      ...(query.counselorId ? { counselorId: query.counselorId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.from || query.to
        ? {
            startTime: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.timeSlot.findMany({
        where,
        orderBy: { startTime: "asc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.timeSlot.count({ where }),
    ]);

    return ok(paginated(items.map(toTimeSlotDto), total, query.page, query.limit));
  },
);

export const POST = apiRoute(
  { auth: "required", roles: ["admin"] },
  async ({ request, user }) => {
    const input = parseBody(adminCreateTimeSlotSchema, await readJson(request));

    const counselor = await prisma.profile.findFirst({
      where: { id: input.counselorId, role: "counselor", isActive: true },
      select: { id: true },
    });

    if (!counselor) {
      throw errors.notFound("Konselor tidak ditemukan atau tidak aktif.");
    }

    const slot = await createTimeSlot({
      counselorId: input.counselorId,
      createdBy: user!.id,
      startTime: input.startTime,
      serviceId: input.serviceId,
      durationMinutes: input.durationMinutes,
    });

    return ok(toTimeSlotDto(slot), "Slot jadwal berhasil dibuat.", 201);
  },
);
