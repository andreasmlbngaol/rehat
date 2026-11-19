import "server-only";
import { randomBytes } from "node:crypto";
import { Prisma } from "@/lib/generated/prisma/client";
import type {
  BookingStatus,
  CounselingMethod,
  TimeSlotStatus,
} from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/api/errors";
import { addMinutes } from "@/lib/time";
import { serverEnv } from "@/lib/env";
import type { UserRole } from "@/lib/auth/roles";

export const bookingInclude = {
  patient: { select: { id: true, fullName: true, avatarKey: true } },
  counselor: { select: { id: true, fullName: true, avatarKey: true } },
  payments: { orderBy: { createdAt: "desc" as const }, take: 1 },
  session: true,
} satisfies Prisma.BookingInclude;

export type BookingRelations = Prisma.BookingGetPayload<{
  include: typeof bookingInclude;
}>;

type LockedSlot = {
  id: string;
  counselorId: string;
  startTime: Date;
  endTime: Date;
  status: TimeSlotStatus;
};

function generateBookingCode(): string {
  const wib = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const year = String(wib.getUTCFullYear()).slice(2);
  const month = String(wib.getUTCMonth() + 1).padStart(2, "0");
  const day = String(wib.getUTCDate()).padStart(2, "0");
  const suffix = randomBytes(4).toString("hex").toUpperCase();

  return `RHT-${year}${month}${day}-${suffix}`;
}

/**
 * Melepas slot yang tertahan akibat pembayaran kedaluwarsa.
 * Dipanggil sebelum operasi baca/tulis yang bergantung pada ketersediaan.
 */
export async function expireStaleBookings(): Promise<number> {
  const now = new Date();

  const stale = await prisma.booking.findMany({
    where: {
      status: "pending_payment",
      paymentExpiresAt: { lt: now },
    },
    select: { id: true, timeSlotId: true },
    orderBy: { paymentExpiresAt: "asc" },
    take: 50,
  });

  if (stale.length === 0) return 0;

  let expired = 0;

  await prisma.$transaction(async (tx) => {
    for (const booking of stale) {
      const updated = await tx.booking.updateMany({
        where: {
          id: booking.id,
          status: "pending_payment",
          paymentExpiresAt: { lt: now },
        },
        data: { status: "expired" },
      });

      if (updated.count === 0) continue;

      expired += 1;

      await tx.payment.updateMany({
        where: { bookingId: booking.id, status: "pending" },
        data: { status: "expired" },
      });

      await tx.timeSlot.updateMany({
        where: { id: booking.timeSlotId, status: "held" },
        data: { status: "available" },
      });
    }
  });

  return expired;
}

export async function createBooking(input: {
  patientId: string;
  timeSlotId: string;
  serviceId: string;
  method: CounselingMethod;
  idempotencyKey: string;
}): Promise<BookingRelations> {
  await expireStaleBookings();

  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<LockedSlot[]>`
      select
        id,
        counselor_id as "counselorId",
        start_time as "startTime",
        end_time as "endTime",
        status
      from time_slots
      where id = ${input.timeSlotId}
      for update
    `;

    const slot = locked[0];

    if (!slot) {
      throw errors.notFound("Slot jadwal tidak ditemukan.");
    }

    const existing = await tx.booking.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: bookingInclude,
    });

    if (existing) {
      if (existing.patientId !== input.patientId) {
        throw errors.conflict("Idempotency-Key sudah digunakan.");
      }
      return existing;
    }

    if (slot.status !== "available") {
      throw errors.slotUnavailable();
    }

    if (slot.startTime.getTime() <= Date.now()) {
      throw errors.slotUnavailable("Jadwal yang dipilih sudah lewat.");
    }

    const service = await tx.service.findFirst({
      where: { id: input.serviceId, isActive: true },
      include: { methods: true },
    });

    if (!service) {
      throw errors.notFound("Layanan tidak ditemukan atau tidak aktif.");
    }

    if (!service.methods.some((item) => item.method === input.method)) {
      throw errors.validation({
        method: ["Metode konseling tidak tersedia untuk layanan ini."],
      });
    }

    const counselor = await tx.profile.findFirst({
      where: {
        id: slot.counselorId,
        role: "counselor",
        isActive: true,
        counselorServices: { some: { serviceId: input.serviceId } },
      },
      select: { id: true },
    });

    if (!counselor) {
      throw errors.validation({
        serviceId: ["Konselor tidak aktif atau tidak menangani layanan ini."],
      });
    }

    const slotMinutes = Math.floor(
      (slot.endTime.getTime() - slot.startTime.getTime()) / 60_000,
    );

    if (service.durationMinutes > slotMinutes) {
      throw errors.validation({
        timeSlotId: ["Durasi layanan melebihi rentang slot jadwal."],
      });
    }

    const scheduledStart = slot.startTime;
    const scheduledEnd = addMinutes(scheduledStart, service.durationMinutes);

    // Kunci advisory dengan urutan tetap untuk mencegah deadlock.
    await tx.$queryRaw`select pg_advisory_xact_lock(hashtext(${`counselor:${slot.counselorId}`}))::text as locked`;
    await tx.$queryRaw`select pg_advisory_xact_lock(hashtext(${`patient:${input.patientId}`}))::text as locked`;

    if (input.method === "zoom") {
      await tx.$queryRaw`select pg_advisory_xact_lock(hashtext('zoom:global'))::text as locked`;
    }

    const overlapBase = {
      status: { in: ["pending_payment", "confirmed"] as BookingStatus[] },
      scheduledStart: { lt: scheduledEnd },
      scheduledEnd: { gt: scheduledStart },
    };

    const [patientOverlap, counselorOverlap] = await Promise.all([
      tx.booking.findFirst({
        where: { ...overlapBase, patientId: input.patientId },
        select: { id: true },
      }),
      tx.booking.findFirst({
        where: { ...overlapBase, counselorId: slot.counselorId },
        select: { id: true },
      }),
    ]);

    if (patientOverlap) {
      throw errors.conflict(
        "Anda sudah memiliki sesi terkonfirmasi pada waktu tersebut.",
      );
    }

    if (counselorOverlap) {
      throw errors.conflict(
        "Konselor sudah memiliki sesi terkonfirmasi pada waktu tersebut.",
      );
    }

    if (input.method === "zoom") {
      const zoomOverlap = await tx.booking.findFirst({
        where: { ...overlapBase, method: "zoom" },
        select: { id: true },
      });

      if (zoomOverlap) {
        throw errors.conflict(
          "Sudah ada sesi Zoom lain pada waktu yang sama.",
        );
      }
    }

    const now = new Date();

    const booking = await tx.booking.create({
      data: {
        bookingCode: generateBookingCode(),
        patientId: input.patientId,
        counselorId: slot.counselorId,
        serviceId: service.id,
        timeSlotId: slot.id,
        method: input.method,
        status: "pending_payment",
        paymentExpiresAt: addMinutes(
          now,
          serverEnv().BOOKING_PAYMENT_TTL_MINUTES,
        ),
        idempotencyKey: input.idempotencyKey,
        serviceName: service.name,
        durationMinutes: service.durationMinutes,
        price: service.price,
        scheduledStart,
        scheduledEnd,
      },
      include: bookingInclude,
    });

    await tx.timeSlot.update({
      where: { id: slot.id },
      data: { status: "held" },
    });

    return booking;
  });
}

export async function findBookingForViewer(
  id: string,
  viewer: { id: string; role: UserRole },
): Promise<BookingRelations> {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: bookingInclude,
  });

  if (!booking) {
    throw errors.notFound("Pemesanan tidak ditemukan.");
  }

  if (viewer.role === "admin") return booking;
  if (viewer.role === "patient" && booking.patientId === viewer.id) return booking;
  if (viewer.role === "counselor" && booking.counselorId === viewer.id) {
    return booking;
  }

  throw errors.notFound("Pemesanan tidak ditemukan.");
}
