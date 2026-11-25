import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { errors } from "@/lib/api/errors";
import { parseBody, parseParam, readJson } from "@/lib/api/validation";
import { uuidSchema } from "@/lib/validation/common";
import { adminUpdateUserSchema } from "@/lib/validation/admin";
import { prisma } from "@/lib/prisma";
import { setUserActive } from "@/lib/services/admin.service";
import { toAdminUserDto } from "@/lib/dto/user";

export const GET = apiRoute<{ id: string }>(
  { auth: "required", roles: ["admin"] },
  async ({ params }) => {
    const id = parseParam(uuidSchema, params.id);

    const profile = await prisma.profile.findUnique({
      where: { id },
      include: {
        counselorProfile: true,
        _count: {
          select: {
            bookingsAsPatient: true,
            bookingsAsCounselor: true,
          },
        },
      },
    });

    if (!profile) {
      throw errors.notFound("Pengguna tidak ditemukan.");
    }

    return ok({
      ...toAdminUserDto(profile),
      counselorProfile: profile.counselorProfile
        ? {
            specialization: profile.counselorProfile.specialization,
            bio: profile.counselorProfile.bio,
          }
        : null,
      stats: {
        bookingsAsPatient: profile._count.bookingsAsPatient,
        bookingsAsCounselor: profile._count.bookingsAsCounselor,
      },
    });
  },
);

export const PATCH = apiRoute<{ id: string }>(
  { auth: "required", roles: ["admin"] },
  async ({ request, params, user }) => {
    const id = parseParam(uuidSchema, params.id);
    const input = parseBody(adminUpdateUserSchema, await readJson(request));

    await setUserActive({
      id,
      isActive: input.isActive,
      actorId: user!.id,
    });

    const profile = await prisma.profile.findUnique({ where: { id } });

    if (!profile) {
      throw errors.notFound("Pengguna tidak ditemukan.");
    }

    return ok(
      toAdminUserDto(profile),
      input.isActive
        ? "Akun berhasil diaktifkan."
        : "Akun berhasil dinonaktifkan.",
    );
  },
);
