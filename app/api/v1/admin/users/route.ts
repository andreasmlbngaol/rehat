import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseQuery } from "@/lib/api/validation";
import { adminUserQuerySchema } from "@/lib/validation/admin";
import { prisma } from "@/lib/prisma";
import { buildAdminUserWhere } from "@/lib/services/admin.service";
import { toAdminUserDto } from "@/lib/dto/user";
import { paginated } from "@/lib/dto/pagination";

export const GET = apiRoute(
  { auth: "required", roles: ["admin"] },
  async ({ searchParams }) => {
    const query = parseQuery(adminUserQuerySchema, searchParams);
    const where = buildAdminUserWhere(query);

    const [items, total] = await prisma.$transaction([
      prisma.profile.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.profile.count({ where }),
    ]);

    return ok(
      paginated(items.map(toAdminUserDto), total, query.page, query.limit),
    );
  },
);
