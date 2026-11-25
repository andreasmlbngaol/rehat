import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseBody, parseQuery, readJson } from "@/lib/api/validation";
import {
  counselorCreateTimeSlotSchema,
  timeSlotListQuerySchema,
} from "@/lib/validation/time-slot";
import { prisma } from "@/lib/prisma";
import {
  createTimeSlot,
  toTimeSlotDto,
} from "@/lib/services/time-slot.service";
import { paginated } from "@/lib/dto/pagination";

export const GET = apiRoute(
  { auth: "required", roles: ["counselor"] },
  async ({ searchParams, user }) => {
    const query = parseQuery(timeSlotListQuerySchema, searchParams);

    const where = {
      counselorId: user!.id,
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
  { auth: "required", roles: ["counselor"] },
  async ({ request, user }) => {
    const input = parseBody(
      counselorCreateTimeSlotSchema,
      await readJson(request),
    );

    const slot = await createTimeSlot({
      counselorId: user!.id,
      createdBy: user!.id,
      startTime: input.startTime,
      serviceId: input.serviceId,
      durationMinutes: input.durationMinutes,
    });

    return ok(toTimeSlotDto(slot), "Slot jadwal berhasil dibuat.", 201);
  },
);
