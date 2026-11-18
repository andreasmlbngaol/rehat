import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { errors } from "@/lib/api/errors";
import { parseParam } from "@/lib/api/validation";
import { uuidSchema } from "@/lib/validation/common";
import { prisma } from "@/lib/prisma";
import { toServiceDto } from "@/lib/dto/catalog";

export const GET = apiRoute<{ id: string }>({ auth: "none" }, async ({ params }) => {
  const id = parseParam(uuidSchema, params.id);

  const service = await prisma.service.findFirst({
    where: { id, isActive: true },
    include: { methods: true },
  });

  if (!service) {
    throw errors.notFound("Layanan tidak ditemukan.");
  }

  return ok(toServiceDto(service));
});
