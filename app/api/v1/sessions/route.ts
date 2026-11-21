import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseQuery } from "@/lib/api/validation";
import { sessionListQuerySchema } from "@/lib/validation/chat";
import { prisma } from "@/lib/prisma";
import {
  reconcileSessionsForUser,
  sessionInclude,
} from "@/lib/services/session.service";
import { toSessionDto } from "@/lib/dto/session";
import { paginated } from "@/lib/dto/pagination";

export const GET = apiRoute(
  { auth: "required", roles: ["patient", "counselor"] },
  async ({ searchParams, user }) => {
    await reconcileSessionsForUser(user!);

    const query = parseQuery(sessionListQuerySchema, searchParams);

    const bookingFilter = {
      ...(user!.role === "patient"
        ? { patientId: user!.id }
        : { counselorId: user!.id }),
      ...(query.method ? { method: query.method } : {}),
      ...(query.from || query.to
        ? {
            scheduledStart: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {}),
            },
          }
        : {}),
    };

    const where = {
      booking: bookingFilter,
      ...(query.status ? { status: query.status } : {}),
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
        items.map((session) =>
          toSessionDto(
            session,
            user!.role as "patient" | "counselor",
          ),
        ),
        total,
        query.page,
        query.limit,
      ),
    );
  },
);
