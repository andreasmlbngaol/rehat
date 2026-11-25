import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { errors } from "@/lib/api/errors";
import { parseBody, parseParam, readJson } from "@/lib/api/validation";
import { uuidSchema } from "@/lib/validation/common";
import { updateCounselorSchema } from "@/lib/validation/counselor";
import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { toAdminCounselorDto } from "@/lib/dto/catalog";

export const PATCH = apiRoute<{ id: string }>(
  { auth: "required", roles: ["admin"] },
  async ({ request, params }) => {
    const id = parseParam(uuidSchema, params.id);
    const input = parseBody(updateCounselorSchema, await readJson(request));

    const existing = await prisma.profile.findFirst({
      where: { id, role: "counselor" },
      select: { id: true },
    });

    if (!existing) {
      throw errors.notFound("Konselor tidak ditemukan.");
    }

    let serviceIds: string[] | undefined;
    if (input.serviceIds) {
      serviceIds = [...new Set(input.serviceIds)];
      const services = await prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: { id: true },
      });
      if (services.length !== serviceIds.length) {
        throw errors.validation({
          serviceIds: ["Ada layanan yang tidak ditemukan."],
        });
      }
    }

    if (input.isActive !== undefined) {
      const supabase = createSupabaseAdminClient();
      await supabase.auth.admin.updateUserById(id, {
        ban_duration: input.isActive ? "none" : "876000h",
      });
    }

    await prisma.$transaction(async (tx) => {
      if (input.fullName !== undefined || input.isActive !== undefined) {
        await tx.profile.update({
          where: { id },
          data: {
            ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
            ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          },
        });
      }

      if (input.specialization !== undefined || input.bio !== undefined) {
        await tx.counselorProfile.update({
          where: { counselorId: id },
          data: {
            ...(input.specialization !== undefined
              ? { specialization: input.specialization }
              : {}),
            ...(input.bio !== undefined ? { bio: input.bio } : {}),
          },
        });
      }

      if (serviceIds) {
        await tx.counselorService.deleteMany({ where: { counselorId: id } });
        await tx.counselorService.createMany({
          data: serviceIds.map((serviceId) => ({ counselorId: id, serviceId })),
        });
      }
    });

    const counselor = await prisma.profile.findUnique({
      where: { id },
      include: {
        counselorProfile: true,
        counselorServices: { include: { service: true } },
      },
    });

    if (!counselor) {
      throw errors.notFound("Konselor tidak ditemukan.");
    }

    return ok(toAdminCounselorDto(counselor), "Data konselor berhasil diperbarui.");
  },
);
