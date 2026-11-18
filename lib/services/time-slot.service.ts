import "server-only";
import { Prisma, type TimeSlot } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/api/errors";
import { addMinutes } from "@/lib/time";

type Db = Prisma.TransactionClient;

export function toTimeSlotDto(slot: TimeSlot) {
  return {
    id: slot.id,
    counselorId: slot.counselorId,
    startTime: slot.startTime.toISOString(),
    endTime: slot.endTime.toISOString(),
    status: slot.status,
    createdAt: slot.createdAt.toISOString(),
    updatedAt: slot.updatedAt.toISOString(),
  };
}

async function lockCounselor(tx: Db, counselorId: string): Promise<void> {
  // `void` tidak dikenali driver adapter; cast ke text agar hasilnya terbaca.
  await tx.$queryRaw`select pg_advisory_xact_lock(hashtext(${counselorId}))::text as locked`;
}

async function resolveDuration(
  tx: Db,
  input: { counselorId: string; serviceId?: string; durationMinutes?: number },
): Promise<number> {
  if (input.serviceId) {
    const service = await tx.service.findFirst({
      where: {
        id: input.serviceId,
        isActive: true,
        counselors: { some: { counselorId: input.counselorId } },
      },
      select: { durationMinutes: true },
    });

    if (!service) {
      throw errors.validation({
        serviceId: ["Layanan tidak aktif atau tidak ditangani konselor ini."],
      });
    }

    return service.durationMinutes;
  }

  if (!input.durationMinutes) {
    throw errors.validation({ durationMinutes: ["Durasi wajib diisi."] });
  }

  return input.durationMinutes;
}

async function assertNoOverlap(
  tx: Db,
  input: {
    counselorId: string;
    startTime: Date;
    endTime: Date;
    excludeSlotId?: string;
  },
): Promise<void> {
  const overlappingSlot = await tx.timeSlot.findFirst({
    where: {
      counselorId: input.counselorId,
      ...(input.excludeSlotId ? { id: { not: input.excludeSlotId } } : {}),
      startTime: { lt: input.endTime },
      endTime: { gt: input.startTime },
    },
    select: { id: true },
  });

  if (overlappingSlot) {
    throw errors.conflict(
      "Jadwal bertabrakan dengan slot jadwal lain milik konselor yang sama.",
    );
  }

  const overlappingSession = await tx.booking.findFirst({
    where: {
      counselorId: input.counselorId,
      status: "confirmed",
      scheduledStart: { lt: input.endTime },
      scheduledEnd: { gt: input.startTime },
    },
    select: { id: true },
  });

  if (overlappingSession) {
    throw errors.conflict(
      "Jadwal bertabrakan dengan sesi konseling yang sudah terkonfirmasi.",
    );
  }
}

export async function createTimeSlot(input: {
  counselorId: string;
  createdBy: string;
  startTime: Date;
  serviceId?: string;
  durationMinutes?: number;
}): Promise<TimeSlot> {
  if (input.startTime.getTime() <= Date.now()) {
    throw errors.validation({ startTime: ["Waktu mulai harus di masa depan."] });
  }

  return prisma.$transaction(async (tx) => {
    await lockCounselor(tx, input.counselorId);

    const duration = await resolveDuration(tx, input);
    const endTime = addMinutes(input.startTime, duration);

    await assertNoOverlap(tx, {
      counselorId: input.counselorId,
      startTime: input.startTime,
      endTime,
    });

    return tx.timeSlot.create({
      data: {
        counselorId: input.counselorId,
        createdBy: input.createdBy,
        startTime: input.startTime,
        endTime,
      },
    });
  });
}

export async function updateTimeSlot(input: {
  id: string;
  counselorId: string;
  startTime?: Date;
  serviceId?: string;
  durationMinutes?: number;
}): Promise<TimeSlot> {
  return prisma.$transaction(async (tx) => {
    await lockCounselor(tx, input.counselorId);

    const slot = await tx.timeSlot.findUnique({
      where: { id: input.id },
      include: { _count: { select: { bookings: true } } },
    });

    if (!slot) {
      throw errors.notFound("Slot jadwal tidak ditemukan.");
    }

    if (slot.counselorId !== input.counselorId) {
      throw errors.forbidden("Anda hanya dapat mengubah slot jadwal milik sendiri.");
    }

    if (slot.status !== "available" || slot._count.bookings > 0) {
      throw errors.conflict(
        "Slot jadwal yang sudah ditahan atau digunakan tidak dapat diubah.",
      );
    }

    const startTime = input.startTime ?? slot.startTime;

    if (startTime.getTime() <= Date.now()) {
      throw errors.validation({ startTime: ["Waktu mulai harus di masa depan."] });
    }

    const duration =
      input.serviceId || input.durationMinutes
        ? await resolveDuration(tx, {
            counselorId: input.counselorId,
            serviceId: input.serviceId,
            durationMinutes: input.durationMinutes,
          })
        : Math.round(
            (slot.endTime.getTime() - slot.startTime.getTime()) / 60_000,
          );

    const endTime = addMinutes(startTime, duration);

    await assertNoOverlap(tx, {
      counselorId: input.counselorId,
      startTime,
      endTime,
      excludeSlotId: slot.id,
    });

    return tx.timeSlot.update({
      where: { id: slot.id },
      data: { startTime, endTime },
    });
  });
}

export async function deleteTimeSlot(input: {
  id: string;
  counselorId?: string;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const slot = await tx.timeSlot.findUnique({
      where: { id: input.id },
      include: { _count: { select: { bookings: true } } },
    });

    if (!slot) {
      throw errors.notFound("Slot jadwal tidak ditemukan.");
    }

    if (input.counselorId && slot.counselorId !== input.counselorId) {
      throw errors.forbidden("Anda hanya dapat menghapus slot jadwal milik sendiri.");
    }

    if (slot.status !== "available" || slot._count.bookings > 0) {
      throw errors.conflict(
        "Slot jadwal yang sudah ditahan atau digunakan tidak dapat dihapus.",
      );
    }

    await tx.timeSlot.delete({ where: { id: slot.id } });
  });
}
