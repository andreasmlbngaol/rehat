import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseQuery } from "@/lib/api/validation";
import { adminPaymentQuerySchema } from "@/lib/validation/admin";
import { prisma } from "@/lib/prisma";
import { toAdminPaymentDto } from "@/lib/dto/payment";
import { paginated } from "@/lib/dto/pagination";

export const GET = apiRoute(
  { auth: "required", roles: ["admin"] },
  async ({ searchParams }) => {
    const query = parseQuery(adminPaymentQuerySchema, searchParams);

    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              {
                midtransOrderId: {
                  contains: query.q,
                  mode: "insensitive" as const,
                },
              },
              {
                booking: {
                  bookingCode: {
                    contains: query.q,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                booking: {
                  patient: {
                    fullName: {
                      contains: query.q,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
            ],
          }
        : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {}),
            },
          }
        : {}),
    };

    const include = {
      booking: {
        select: {
          id: true,
          bookingCode: true,
          serviceName: true,
          scheduledStart: true,
          patient: { select: { id: true, fullName: true } },
        },
      },
    } as const;

    const [items, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return ok(
      paginated(items.map(toAdminPaymentDto), total, query.page, query.limit),
    );
  },
);
