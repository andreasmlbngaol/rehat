import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/api/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  adminUserQuerySchema,
  adminUpdateUserSchema,
} from "@/lib/validation/admin";
import type { z } from "zod";

type CountGroup<T extends string> = { _count: { _all: number } } & Record<
  T,
  string
>;

function toCountMap<T extends string>(
  key: T,
  groups: CountGroup<T>[],
): Record<string, number> {
  return Object.fromEntries(
    groups.map((group) => [group[key], group._count._all]),
  );
}

/**
 * Ringkasan operasional untuk dashboard admin (FR-DSH-012).
 */
export async function getAdminStats() {
  const [
    totalServices,
    activeServices,
    totalCounselors,
    activeCounselors,
    totalPatients,
    bookingGroups,
    paymentGroups,
    revenue,
    sessionGroups,
    zoomGroups,
  ] = await Promise.all([
    prisma.service.count(),
    prisma.service.count({ where: { isActive: true } }),
    prisma.profile.count({ where: { role: "counselor" } }),
    prisma.profile.count({ where: { role: "counselor", isActive: true } }),
    prisma.profile.count({ where: { role: "patient" } }),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.payment.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.payment.aggregate({
      where: { status: "success" },
      _sum: { grossAmount: true },
    }),
    prisma.counselingSession.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.zoomMeeting.groupBy({
      by: ["integrationStatus"],
      _count: { _all: true },
    }),
  ]);

  const bookings = toCountMap("status", bookingGroups);
  const payments = toCountMap("status", paymentGroups);
  const sessions = toCountMap("status", sessionGroups);
  const zoom = toCountMap("integrationStatus", zoomGroups);

  const sum = (map: Record<string, number>) =>
    Object.values(map).reduce((total, value) => total + value, 0);

  return {
    services: { total: totalServices, active: activeServices },
    counselors: { total: totalCounselors, active: activeCounselors },
    patients: { total: totalPatients },
    bookings: {
      total: sum(bookings),
      pendingPayment: bookings.pending_payment ?? 0,
      confirmed: bookings.confirmed ?? 0,
      cancelled: bookings.cancelled ?? 0,
      expired: bookings.expired ?? 0,
    },
    payments: {
      total: sum(payments),
      pending: payments.pending ?? 0,
      success: payments.success ?? 0,
      failed: payments.failed ?? 0,
      cancelled: payments.cancelled ?? 0,
      expired: payments.expired ?? 0,
      revenue: Number(revenue._sum.grossAmount ?? 0),
    },
    sessions: {
      total: sum(sessions),
      scheduled: sessions.scheduled ?? 0,
      active: sessions.active ?? 0,
      completed: sessions.completed ?? 0,
    },
    zoomMeetings: {
      total: sum(zoom),
      pending: zoom.pending ?? 0,
      created: zoom.created ?? 0,
      failed: zoom.failed ?? 0,
    },
  };
}

export type AdminUserQuery = z.infer<typeof adminUserQuerySchema>;

export function buildAdminUserWhere(query: AdminUserQuery): Prisma.ProfileWhereInput {
  return {
    ...(query.role ? { role: query.role } : {}),
    ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    ...(query.q
      ? {
          OR: [
            { fullName: { contains: query.q, mode: "insensitive" } },
            { email: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

/**
 * Mengaktifkan/menonaktifkan akun. Blokir juga dilakukan di Supabase Auth
 * agar sesi yang ada tidak dapat diperpanjang (FR-ADM-007..011).
 */
export async function setUserActive(input: {
  id: string;
  isActive: boolean;
  actorId: string;
}) {
  if (input.id === input.actorId && !input.isActive) {
    throw errors.validation({
      isActive: ["Anda tidak dapat menonaktifkan akun sendiri."],
    });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: input.id },
    select: { id: true, isActive: true },
  });

  if (!profile) {
    throw errors.notFound("Pengguna tidak ditemukan.");
  }

  if (profile.isActive === input.isActive) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(input.id, {
    ban_duration: input.isActive ? "none" : "876000h",
  });

  if (error) {
    throw errors.external("Status akun gagal diperbarui. Coba lagi nanti.");
  }

  await prisma.profile.update({
    where: { id: input.id },
    data: { isActive: input.isActive },
  });
}

export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
