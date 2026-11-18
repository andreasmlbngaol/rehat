import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseQuery } from "@/lib/api/validation";
import { serviceQuerySchema } from "@/lib/validation/service";
import { prisma } from "@/lib/prisma";
import { toServiceDto } from "@/lib/dto/catalog";

export const GET = apiRoute({ auth: "none" }, async ({ searchParams }) => {
  const query = parseQuery(serviceQuerySchema, searchParams);

  const services = await prisma.service.findMany({
    where: {
      isActive: true,
      ...(query.method ? { methods: { some: { method: query.method } } } : {}),
      ...(query.q ? { name: { contains: query.q, mode: "insensitive" } } : {}),
    },
    include: { methods: true },
    orderBy: { name: "asc" },
  });

  return ok(services.map(toServiceDto));
});
