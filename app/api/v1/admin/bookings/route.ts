import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseQuery } from "@/lib/api/validation";
import { adminBookingQuerySchema } from "@/lib/validation/admin";
import { prisma } from "@/lib/prisma";
import {
  bookingInclude,
  expireStaleBookings,
} from "@/lib/services/booking.service";
import { toBookingDto } from "@/lib/dto/booking";
import { paginated } from "@/lib/dto/pagination";

export const GET = apiRoute(
  { auth: "required", roles: ["admin"] },
  async ({ searchParams }) => {
    await expireStaleBookings();

    const query = parseQuery(adminBookingQuerySchema, searchParams);

    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.method ? { method: query.method } : {}),
      ...(query.q
        ? {
            OR: [
              { bookingCode: { contains: query.q, mode: "insensitive" as const } },
              { serviceName: { contains: query.q, mode: "insensitive" as const } },
              {
                patient: {
                  fullName: { contains: query.q, mode: "insensitive" as const },
                },
              },
              {
                counselor: {
                  fullName: { contains: query.q, mode: "insensitive" as const },
                },
              },
            ],
          }
        : {}),
      ...(query.from || query.to
        ? {
            scheduledStart: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.booking.findMany({
        where,
        include: bookingInclude,
        orderBy: { scheduledStart: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return ok(
      paginated(
        items.map((booking) => toBookingDto(booking, "admin")),
        total,
        query.page,
        query.limit,
      ),
    );
  },
);
