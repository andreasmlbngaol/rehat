import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseQuery } from "@/lib/api/validation";
import { adminSessionQuerySchema } from "@/lib/validation/admin";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  reconcileAllSessions,
  sessionInclude,
} from "@/lib/services/session.service";
import { toSessionDto } from "@/lib/dto/session";
import { paginated } from "@/lib/dto/pagination";

export const GET = apiRoute(
  { auth: "required", roles: ["admin"] },
  async ({ searchParams }) => {
    await reconcileAllSessions();

    const query = parseQuery(adminSessionQuerySchema, searchParams);

    const bookingWhere: Prisma.BookingWhereInput = {
      ...(query.method ? { method: query.method } : {}),
      ...(query.from || query.to
        ? {
            scheduledStart: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {}),
            },
          }
        : {}),
      ...(query.q
        ? {
            OR: [
              {
                bookingCode: {
                  contains: query.q,
                  mode: "insensitive" as const,
                },
              },
              {
                serviceName: {
                  contains: query.q,
                  mode: "insensitive" as const,
                },
              },
              {
                patient: {
                  fullName: {
                    contains: query.q,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                counselor: {
                  fullName: {
                    contains: query.q,
                    mode: "insensitive" as const,
                  },
                },
              },
            ],
          }
        : {}),
    };

    const where: Prisma.CounselingSessionWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(Object.keys(bookingWhere).length > 0 ? { booking: bookingWhere } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.counselingSession.findMany({
        where,
        include: sessionInclude,
        orderBy: { booking: { scheduledStart: "desc" } },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.counselingSession.count({ where }),
    ]);

    return ok(
      paginated(
        items.map((session) => toSessionDto(session, "admin")),
        total,
        query.page,
        query.limit,
      ),
    );
  },
);
