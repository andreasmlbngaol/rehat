import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseBody, parseQuery, readJson } from "@/lib/api/validation";
import {
  adminServiceQuerySchema,
  createServiceSchema,
} from "@/lib/validation/service";
import { prisma } from "@/lib/prisma";
import { toServiceDto } from "@/lib/dto/catalog";

export const GET = apiRoute(
  { auth: "required", roles: ["admin"] },
  async ({ searchParams }) => {
    const query = parseQuery(adminServiceQuerySchema, searchParams);

    const services = await prisma.service.findMany({
      where: {
        ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
        ...(query.method ? { methods: { some: { method: query.method } } } : {}),
        ...(query.q ? { name: { contains: query.q, mode: "insensitive" } } : {}),
      },
      include: { methods: true },
      orderBy: { createdAt: "desc" },
    });

    return ok(services.map(toServiceDto));
  },
);

export const POST = apiRoute(
  { auth: "required", roles: ["admin"] },
  async ({ request }) => {
    const input = parseBody(createServiceSchema, await readJson(request));

    const service = await prisma.service.create({
      data: {
        name: input.name,
        description: input.description,
        durationMinutes: input.durationMinutes,
        price: input.price,
        methods: {
          create: input.methods.map((method) => ({ method })),
        },
      },
      include: { methods: true },
    });

    return ok(toServiceDto(service), "Layanan berhasil dibuat.", 201);
  },
);
