import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { errors } from "@/lib/api/errors";
import { parseParam } from "@/lib/api/validation";
import { uuidSchema } from "@/lib/validation/common";
import { prisma } from "@/lib/prisma";
import { toPublicCounselorDto } from "@/lib/dto/catalog";

export const GET = apiRoute<{ id: string }>({ auth: "none" }, async ({ params }) => {
  const id = parseParam(uuidSchema, params.id);

  const counselor = await prisma.profile.findFirst({
    where: {
      id,
      role: "counselor",
      isActive: true,
      counselorProfile: { isNot: null },
    },
    include: {
      counselorProfile: true,
      counselorServices: { include: { service: true } },
    },
  });

  if (!counselor) {
    throw errors.notFound("Konselor tidak ditemukan.");
  }

  return ok(toPublicCounselorDto(counselor));
});
