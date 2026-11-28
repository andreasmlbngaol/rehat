import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { errors } from "@/lib/api/errors";
import { parseBody, readJson } from "@/lib/api/validation";
import { createCounselorSchema } from "@/lib/validation/counselor";
import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { toAdminCounselorDto } from "@/lib/dto/catalog";

export const GET = apiRoute(
  { auth: "required", roles: ["admin"] },
  async () => {
    const counselors = await prisma.profile.findMany({
      where: { role: "counselor" },
      include: {
        counselorProfile: true,
        counselorServices: { include: { service: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(counselors.map(toAdminCounselorDto));
  },
);

export const POST = apiRoute(
  { auth: "required", roles: ["admin"] },
  async ({ request }) => {
    const input = parseBody(createCounselorSchema, await readJson(request));
    const serviceIds = [...new Set(input.serviceIds)];

    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true },
    });

    if (services.length !== serviceIds.length) {
      throw errors.validation({
        serviceIds: ["Ada layanan yang tidak ditemukan."],
      });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(
      input.email,
      {
        data: { full_name: input.fullName },
        // Admin API memakai alur implisit: token kembali di fragment URL,
        // jadi harus mendarat di halaman client yang bisa membacanya.
        redirectTo: `${request.nextUrl.origin}/auth/continue?next=/reset-password`,
      },
    );

    if (error || !data.user) {
      if (error?.code === "email_exists" || error?.code === "user_already_exists") {
        throw errors.conflict("Email sudah terdaftar.");
      }
      throw errors.external("Akun konselor gagal dibuat. Coba lagi nanti.");
    }

    const userId = data.user.id;

    try {
      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: { role: "counselor" },
      });

      await prisma.$transaction(async (tx) => {
        await tx.profile.upsert({
          where: { id: userId },
          update: {
            fullName: input.fullName,
            email: input.email,
            role: "counselor",
            isActive: true,
          },
          create: {
            id: userId,
            fullName: input.fullName,
            email: input.email,
            role: "counselor",
          },
        });

        await tx.counselorProfile.upsert({
          where: { counselorId: userId },
          update: {
            specialization: input.specialization,
            bio: input.bio ?? null,
          },
          create: {
            counselorId: userId,
            specialization: input.specialization,
            bio: input.bio ?? null,
          },
        });

        await tx.counselorService.deleteMany({ where: { counselorId: userId } });
        await tx.counselorService.createMany({
          data: serviceIds.map((serviceId) => ({ counselorId: userId, serviceId })),
        });
      });
    } catch (cause) {
      await supabase.auth.admin.deleteUser(userId).catch(() => undefined);
      throw cause;
    }

    const counselor = await prisma.profile.findUnique({
      where: { id: userId },
      include: {
        counselorProfile: true,
        counselorServices: { include: { service: true } },
      },
    });

    if (!counselor) {
      throw errors.notFound("Konselor tidak ditemukan setelah dibuat.");
    }

    return ok(
      toAdminCounselorDto(counselor),
      "Akun konselor berhasil dibuat dan email aktivasi telah dikirim.",
      201,
    );
  },
);
