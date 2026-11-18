import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseQuery } from "@/lib/api/validation";
import { counselorQuerySchema } from "@/lib/validation/counselor";
import { prisma } from "@/lib/prisma";
import { toPublicCounselorDto } from "@/lib/dto/catalog";

export const GET = apiRoute({ auth: "none" }, async ({ searchParams }) => {
  const query = parseQuery(counselorQuerySchema, searchParams);

  const counselors = await prisma.profile.findMany({
    where: {
      role: "counselor",
      isActive: true,
      counselorProfile: { isNot: null },
      ...(query.serviceId
        ? { counselorServices: { some: { serviceId: query.serviceId } } }
        : {}),
    },
    include: {
      counselorProfile: true,
      counselorServices: { include: { service: true } },
    },
    orderBy: { fullName: "asc" },
  });

  return ok(counselors.map(toPublicCounselorDto));
});
