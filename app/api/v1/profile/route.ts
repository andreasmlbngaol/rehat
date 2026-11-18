import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { errors } from "@/lib/api/errors";
import { parseBody, readJson } from "@/lib/api/validation";
import { updateProfileSchema } from "@/lib/validation/profile";
import { prisma } from "@/lib/prisma";
import { toProfileDto } from "@/lib/dto/profile";

export const GET = apiRoute({ auth: "required" }, async ({ user }) => {
  const profile = await prisma.profile.findUnique({
    where: { id: user!.id },
    include: { counselorProfile: true },
  });

  if (!profile) {
    throw errors.notFound("Profil tidak ditemukan.");
  }

  return ok(toProfileDto(profile));
});

export const PATCH = apiRoute({ auth: "required" }, async ({ request, user }) => {
  const input = parseBody(updateProfileSchema, await readJson(request));

  await prisma.$transaction(async (tx) => {
    if (input.fullName !== undefined) {
      await tx.profile.update({
        where: { id: user!.id },
        data: { fullName: input.fullName },
      });
    }

    if (
      user!.role === "counselor" &&
      (input.specialization !== undefined || input.bio !== undefined)
    ) {
      await tx.counselorProfile.update({
        where: { counselorId: user!.id },
        data: {
          ...(input.specialization !== undefined
            ? { specialization: input.specialization }
            : {}),
          ...(input.bio !== undefined ? { bio: input.bio } : {}),
        },
      });
    }
  });

  const profile = await prisma.profile.findUnique({
    where: { id: user!.id },
    include: { counselorProfile: true },
  });

  if (!profile) {
    throw errors.notFound("Profil tidak ditemukan.");
  }

  return ok(toProfileDto(profile), "Profil berhasil diperbarui.");
});
