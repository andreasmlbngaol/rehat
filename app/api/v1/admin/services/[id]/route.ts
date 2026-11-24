import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { errors } from "@/lib/api/errors";
import { parseBody, parseParam, readJson } from "@/lib/api/validation";
import { uuidSchema } from "@/lib/validation/common";
import { updateServiceSchema } from "@/lib/validation/service";
import { prisma } from "@/lib/prisma";
import { toServiceDto } from "@/lib/dto/catalog";

export const PATCH = apiRoute<{ id: string }>(
  { auth: "required", roles: ["admin"] },
  async ({ request, params }) => {
    const id = parseParam(uuidSchema, params.id);
    const input = parseBody(updateServiceSchema, await readJson(request));

    const existing = await prisma.service.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw errors.notFound("Layanan tidak ditemukan.");
    }

    const service = await prisma.$transaction(async (tx) => {
      await tx.service.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined
            ? { description: input.description }
            : {}),
          ...(input.durationMinutes !== undefined
            ? { durationMinutes: input.durationMinutes }
            : {}),
          ...(input.price !== undefined ? { price: input.price } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
      });

      if (input.methods) {
        await tx.serviceMethod.deleteMany({ where: { serviceId: id } });
        await tx.serviceMethod.createMany({
          data: input.methods.map((method) => ({ serviceId: id, method })),
        });
      }

      return tx.service.findUnique({
        where: { id },
        include: { methods: true },
      });
    });

    if (!service) {
      throw errors.notFound("Layanan tidak ditemukan.");
    }

    return ok(toServiceDto(service), "Layanan berhasil diperbarui.");
  },
);
