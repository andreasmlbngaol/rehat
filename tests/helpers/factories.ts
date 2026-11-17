import { randomUUID } from "node:crypto";
import type {
  BookingStatus,
  CounselingMethod,
  PaymentStatus,
  SessionStatus,
  TimeSlotStatus,
  UserRole,
} from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export function uid(): string {
  return randomUUID();
}

/**
 * Tanggal di masa depan pada jam WIB tertentu.
 * `daysAhead` negatif menghasilkan tanggal lampau.
 */
export function wibDate(daysAhead: number, hour = 9, minute = 0): Date {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);

  return new Date(
    Date.UTC(
      wib.getUTCFullYear(),
      wib.getUTCMonth(),
      wib.getUTCDate() + daysAhead,
      hour - 7,
      minute,
      0,
      0,
    ),
  );
}

export async function createProfile(
  overrides: {
    id?: string;
    fullName?: string;
    email?: string;
    role?: UserRole;
    isActive?: boolean;
  } = {},
) {
  return prisma.profile.create({
    data: {
      id: overrides.id ?? uid(),
      fullName: overrides.fullName ?? "Pengguna Uji",
      email: overrides.email ?? `user-${uid()}@test.local`,
      role: overrides.role ?? "patient",
      isActive: overrides.isActive ?? true,
    },
  });
}

export async function createService(
  options: {
    name?: string;
    methods?: CounselingMethod[];
    durationMinutes?: number;
    price?: number;
    isActive?: boolean;
  } = {},
) {
  return prisma.service.create({
    data: {
      name: options.name ?? `Layanan ${uid().slice(0, 8)}`,
      description: "Layanan yang dibuat untuk pengujian otomatis.",
      durationMinutes: options.durationMinutes ?? 60,
      price: options.price ?? 150_000,
      isActive: options.isActive ?? true,
      methods: {
        create: (options.methods ?? ["chat", "zoom"]).map((method) => ({
          method,
        })),
      },
    },
    include: { methods: true },
  });
}

export async function createCounselor(
  options: { services?: string[]; isActive?: boolean } = {},
) {
  const profile = await createProfile({
    role: "counselor",
    fullName: "Konselor Uji",
    isActive: options.isActive ?? true,
  });

  await prisma.counselorProfile.create({
    data: {
      counselorId: profile.id,
      specialization: "Kecemasan dan Manajemen Stres",
      bio: "Profil konselor untuk pengujian.",
    },
  });

  if (options.services && options.services.length > 0) {
    await prisma.counselorService.createMany({
      data: options.services.map((serviceId) => ({
        counselorId: profile.id,
        serviceId,
      })),
    });
  }

  return profile;
}

export async function createSlot(
  options: {
    counselorId: string;
    createdBy?: string;
    startTime?: Date;
    durationMinutes?: number;
    status?: TimeSlotStatus;
  },
) {
  const startTime = options.startTime ?? wibDate(2, 9);
  const endTime = new Date(
    startTime.getTime() + (options.durationMinutes ?? 90) * 60_000,
  );

  return prisma.timeSlot.create({
    data: {
      counselorId: options.counselorId,
      createdBy: options.createdBy ?? options.counselorId,
      startTime,
      endTime,
      status: options.status ?? "available",
    },
  });
}

export async function createBooking(
  options: {
    patientId: string;
    counselorId: string;
    serviceId: string;
    timeSlotId: string;
    method?: CounselingMethod;
    status?: BookingStatus;
    scheduledStart?: Date;
    scheduledEnd?: Date;
    durationMinutes?: number;
    price?: number;
    paymentExpiresAt?: Date | null;
    idempotencyKey?: string;
  },
) {
  const scheduledStart = options.scheduledStart ?? wibDate(2, 9);
  const durationMinutes = options.durationMinutes ?? 60;
  const scheduledEnd =
    options.scheduledEnd ??
    new Date(scheduledStart.getTime() + durationMinutes * 60_000);

  return prisma.booking.create({
    data: {
      bookingCode: `RHT-TEST-${uid().slice(0, 8).toUpperCase()}`,
      patientId: options.patientId,
      counselorId: options.counselorId,
      serviceId: options.serviceId,
      timeSlotId: options.timeSlotId,
      method: options.method ?? "chat",
      status: options.status ?? "pending_payment",
      paymentExpiresAt:
        options.paymentExpiresAt === undefined
          ? new Date(Date.now() + 60 * 60 * 1000)
          : options.paymentExpiresAt,
      idempotencyKey: options.idempotencyKey ?? uid(),
      serviceName: "Layanan Uji",
      durationMinutes,
      price: options.price ?? 150_000,
      scheduledStart,
      scheduledEnd,
    },
  });
}

export async function createPayment(
  options: {
    bookingId: string;
    midtransOrderId?: string;
    status?: PaymentStatus;
    grossAmount?: number;
    snapToken?: string | null;
    expiresAt?: Date | null;
    paymentType?: string | null;
    midtransTransactionId?: string | null;
    transactionTime?: Date | null;
  },
) {
  return prisma.payment.create({
    data: {
      bookingId: options.bookingId,
      midtransOrderId:
        options.midtransOrderId ?? `ORDER-${uid().slice(0, 8).toUpperCase()}`,
      status: options.status ?? "pending",
      grossAmount: options.grossAmount ?? 150_000,
      snapToken:
        options.snapToken === undefined ? "snap-token-test" : options.snapToken,
      expiresAt:
        options.expiresAt === undefined
          ? new Date(Date.now() + 60 * 60 * 1000)
          : options.expiresAt,
      paymentType: options.paymentType ?? null,
      midtransTransactionId: options.midtransTransactionId ?? null,
      transactionTime: options.transactionTime ?? null,
    },
  });
}

export async function createSession(
  options: {
    bookingId: string;
    status?: SessionStatus;
    startedAt?: Date | null;
    endedAt?: Date | null;
  },
) {
  return prisma.counselingSession.create({
    data: {
      bookingId: options.bookingId,
      status: options.status ?? "scheduled",
      startedAt: options.startedAt ?? null,
      endedAt: options.endedAt ?? null,
    },
  });
}

export async function createMessage(options: {
  sessionId: string;
  senderId: string;
  content?: string;
  clientMessageId?: string;
  createdAt?: Date;
}) {
  return prisma.chatMessage.create({
    data: {
      sessionId: options.sessionId,
      senderId: options.senderId,
      content: options.content ?? "Halo, ini pesan uji.",
      clientMessageId: options.clientMessageId ?? uid(),
      ...(options.createdAt ? { createdAt: options.createdAt } : {}),
    },
  });
}

/**
 * Skenario lengkap: pasien, konselor, layanan, slot, booking, dan (opsional)
 * sesi. Mengembalikan semua entitas agar test dapat memakainya langsung.
 */
export async function createBookingScenario(
  options: {
    method?: CounselingMethod;
    status?: BookingStatus;
    scheduledStart?: Date;
    durationMinutes?: number;
    withSession?: boolean;
    sessionStatus?: SessionStatus;
  } = {},
) {
  const service = await createService({
    durationMinutes: options.durationMinutes ?? 60,
    methods: options.method ? [options.method] : ["chat", "zoom"],
  });
  const counselor = await createCounselor({ services: [service.id] });
  const patient = await createProfile({ role: "patient" });
  const start =
    options.scheduledStart ??
    wibDate(options.status === "confirmed" ? 1 : 2, 9);
  const slot = await createSlot({
    counselorId: counselor.id,
    startTime: start,
    durationMinutes: 90,
    status:
      options.status === "confirmed"
        ? "booked"
        : options.status === "pending_payment"
          ? "held"
          : "available",
  });
  const booking = await createBooking({
    patientId: patient.id,
    counselorId: counselor.id,
    serviceId: service.id,
    timeSlotId: slot.id,
    method: options.method ?? "chat",
    status: options.status ?? "pending_payment",
    scheduledStart: start,
    durationMinutes: options.durationMinutes ?? 60,
  });

  const session = options.withSession
    ? await createSession({
        bookingId: booking.id,
        status: options.sessionStatus ?? "scheduled",
      })
    : null;

  return { service, counselor, patient, slot, booking, session };
}
