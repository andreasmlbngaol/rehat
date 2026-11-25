import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import {
  createBooking as book,
  expireStaleBookings,
  findBookingForViewer,
} from "@/lib/services/booking.service";
import {
  ensureTestSchema,
  hasTestDatabase,
  resetDatabase,
} from "../helpers/db";
import {
  createBooking as insertBooking,
  createBookingScenario,
  createCounselor,
  createPayment,
  createProfile,
  createService,
  createSlot,
  uid,
  wibDate,
} from "../helpers/factories";

const suite = hasTestDatabase() ? describe : describe.skip;

async function expectAppError(
  promise: Promise<unknown>,
  code: string,
): Promise<AppError> {
  try {
    await promise;
    throw new Error(`Expected AppError ${code}`);
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe(code);
    return error as AppError;
  }
}

suite("booking.service (integration)", () => {
  beforeAll(async () => {
    await ensureTestSchema();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe("createBooking", () => {
    it("membuat booking pending_payment dan menahan slot", async () => {
      const service = await createService({ durationMinutes: 60 });
      const counselor = await createCounselor({ services: [service.id] });
      const patient = await createProfile({ role: "patient" });
      const start = wibDate(2, 9);
      const slot = await createSlot({
        counselorId: counselor.id,
        startTime: start,
        durationMinutes: 90,
      });

      const booking = await book({
        patientId: patient.id,
        timeSlotId: slot.id,
        serviceId: service.id,
        method: "chat",
        idempotencyKey: uid(),
      });

      expect(booking.status).toBe("pending_payment");
      expect(booking.patientId).toBe(patient.id);
      expect(booking.counselorId).toBe(counselor.id);
      expect(booking.method).toBe("chat");
      expect(Number(booking.price)).toBe(150000);
      expect(booking.durationMinutes).toBe(60);
      expect(booking.scheduledStart.toISOString()).toBe(start.toISOString());
      expect(booking.scheduledEnd.toISOString()).toBe(
        new Date(start.getTime() + 60 * 60_000).toISOString(),
      );
      expect(booking.paymentExpiresAt!.getTime()).toBeGreaterThan(Date.now());
      expect(booking.bookingCode).toMatch(/^RHT-\d{6}-[0-9A-F]{8}$/);

      const storedSlot = await prisma.timeSlot.findUniqueOrThrow({
        where: { id: slot.id },
      });
      expect(storedSlot.status).toBe("held");
    });

    it("idempoten untuk Idempotency-Key yang sama", async () => {
      const scenario = await createBookingScenario({ status: "expired" });
      const key = uid();

      const first = await book({
        patientId: scenario.patient.id,
        timeSlotId: scenario.slot.id,
        serviceId: scenario.service.id,
        method: "chat",
        idempotencyKey: key,
      });

      const second = await book({
        patientId: scenario.patient.id,
        timeSlotId: scenario.slot.id,
        serviceId: scenario.service.id,
        method: "chat",
        idempotencyKey: key,
      });

      expect(second.id).toBe(first.id);
      expect(
        await prisma.booking.count({ where: { idempotencyKey: key } }),
      ).toBe(1);
    });

    it("menolak Idempotency-Key yang dipakai pasien lain", async () => {
      const scenario = await createBookingScenario({ status: "expired" });
      const other = await createProfile({ role: "patient" });
      const key = uid();

      await book({
        patientId: scenario.patient.id,
        timeSlotId: scenario.slot.id,
        serviceId: scenario.service.id,
        method: "chat",
        idempotencyKey: key,
      });

      await expectAppError(
        book({
          patientId: other.id,
          timeSlotId: scenario.slot.id,
          serviceId: scenario.service.id,
          method: "chat",
          idempotencyKey: key,
        }),
        "CONFLICT",
      );
    });

    it("menolak slot yang sudah ditahan", async () => {
      const scenario = await createBookingScenario({ status: "expired" });
      const other = await createProfile({ role: "patient" });

      await book({
        patientId: scenario.patient.id,
        timeSlotId: scenario.slot.id,
        serviceId: scenario.service.id,
        method: "chat",
        idempotencyKey: uid(),
      });

      await expectAppError(
        book({
          patientId: other.id,
          timeSlotId: scenario.slot.id,
          serviceId: scenario.service.id,
          method: "chat",
          idempotencyKey: uid(),
        }),
        "SLOT_UNAVAILABLE",
      );
    });

    it("menolak slot yang sudah lewat", async () => {
      const service = await createService();
      const counselor = await createCounselor({ services: [service.id] });
      const patient = await createProfile({ role: "patient" });
      const slot = await createSlot({
        counselorId: counselor.id,
        startTime: wibDate(-1, 9),
      });

      const error = await expectAppError(
        book({
          patientId: patient.id,
          timeSlotId: slot.id,
          serviceId: service.id,
          method: "chat",
          idempotencyKey: uid(),
        }),
        "SLOT_UNAVAILABLE",
      );

      expect(error.message).toContain("lewat");
    });

    it("menolak layanan tidak aktif", async () => {
      const service = await createService({ isActive: false });
      const counselor = await createCounselor({ services: [service.id] });
      const patient = await createProfile({ role: "patient" });
      const slot = await createSlot({ counselorId: counselor.id });

      await expectAppError(
        book({
          patientId: patient.id,
          timeSlotId: slot.id,
          serviceId: service.id,
          method: "chat",
          idempotencyKey: uid(),
        }),
        "NOT_FOUND",
      );
    });

    it("menolak metode yang tidak tersedia pada layanan", async () => {
      const service = await createService({ methods: ["chat"] });
      const counselor = await createCounselor({ services: [service.id] });
      const patient = await createProfile({ role: "patient" });
      const slot = await createSlot({ counselorId: counselor.id });

      const error = await expectAppError(
        book({
          patientId: patient.id,
          timeSlotId: slot.id,
          serviceId: service.id,
          method: "zoom",
          idempotencyKey: uid(),
        }),
        "VALIDATION_ERROR",
      );

      expect(error.errors?.method).toBeDefined();
    });

    it("menolak konselor yang tidak menangani layanan", async () => {
      const service = await createService();
      const otherService = await createService();
      const counselor = await createCounselor({
        services: [otherService.id],
      });
      const patient = await createProfile({ role: "patient" });
      const slot = await createSlot({ counselorId: counselor.id });

      const error = await expectAppError(
        book({
          patientId: patient.id,
          timeSlotId: slot.id,
          serviceId: service.id,
          method: "chat",
          idempotencyKey: uid(),
        }),
        "VALIDATION_ERROR",
      );

      expect(error.errors?.serviceId).toBeDefined();
    });

    it("menolak durasi layanan yang melebihi slot", async () => {
      const service = await createService({ durationMinutes: 120 });
      const counselor = await createCounselor({ services: [service.id] });
      const patient = await createProfile({ role: "patient" });
      const slot = await createSlot({
        counselorId: counselor.id,
        durationMinutes: 60,
      });

      const error = await expectAppError(
        book({
          patientId: patient.id,
          timeSlotId: slot.id,
          serviceId: service.id,
          method: "chat",
          idempotencyKey: uid(),
        }),
        "VALIDATION_ERROR",
      );

      expect(error.errors?.timeSlotId).toBeDefined();
    });

    it("menolak overlap jadwal pasien", async () => {
      const service = await createService({ durationMinutes: 60 });
      const counselorA = await createCounselor({ services: [service.id] });
      const counselorB = await createCounselor({ services: [service.id] });
      const patient = await createProfile({ role: "patient" });
      const start = wibDate(2, 9);

      const existingSlot = await createSlot({
        counselorId: counselorA.id,
        startTime: start,
        durationMinutes: 90,
        status: "booked",
      });
      await insertBooking({
        patientId: patient.id,
        counselorId: counselorA.id,
        serviceId: service.id,
        timeSlotId: existingSlot.id,
        status: "confirmed",
        scheduledStart: start,
      });

      const overlappingSlot = await createSlot({
        counselorId: counselorB.id,
        startTime: new Date(start.getTime() + 30 * 60_000),
        durationMinutes: 90,
      });

      await expectAppError(
        book({
          patientId: patient.id,
          timeSlotId: overlappingSlot.id,
          serviceId: service.id,
          method: "chat",
          idempotencyKey: uid(),
        }),
        "CONFLICT",
      );
    });

    it("menolak overlap jadwal konselor", async () => {
      const service = await createService({ durationMinutes: 60 });
      const counselor = await createCounselor({ services: [service.id] });
      const patientA = await createProfile({ role: "patient" });
      const patientB = await createProfile({ role: "patient" });
      const start = wibDate(2, 9);

      const existingSlot = await createSlot({
        counselorId: counselor.id,
        startTime: start,
        durationMinutes: 90,
        status: "booked",
      });
      await insertBooking({
        patientId: patientA.id,
        counselorId: counselor.id,
        serviceId: service.id,
        timeSlotId: existingSlot.id,
        status: "confirmed",
        scheduledStart: start,
      });

      const overlappingSlot = await createSlot({
        counselorId: counselor.id,
        startTime: new Date(start.getTime() + 30 * 60_000),
        durationMinutes: 90,
      });

      await expectAppError(
        book({
          patientId: patientB.id,
          timeSlotId: overlappingSlot.id,
          serviceId: service.id,
          method: "chat",
          idempotencyKey: uid(),
        }),
        "CONFLICT",
      );
    });

    it("menolak overlap sesi Zoom lain", async () => {
      const service = await createService({ durationMinutes: 60 });
      const counselorA = await createCounselor({ services: [service.id] });
      const counselorB = await createCounselor({ services: [service.id] });
      const patientA = await createProfile({ role: "patient" });
      const patientB = await createProfile({ role: "patient" });
      const start = wibDate(2, 9);

      const existingSlot = await createSlot({
        counselorId: counselorA.id,
        startTime: start,
        durationMinutes: 90,
        status: "booked",
      });
      await insertBooking({
        patientId: patientA.id,
        counselorId: counselorA.id,
        serviceId: service.id,
        timeSlotId: existingSlot.id,
        method: "zoom",
        status: "confirmed",
        scheduledStart: start,
      });

      const overlappingSlot = await createSlot({
        counselorId: counselorB.id,
        startTime: new Date(start.getTime() + 30 * 60_000),
        durationMinutes: 90,
      });

      const error = await expectAppError(
        book({
          patientId: patientB.id,
          timeSlotId: overlappingSlot.id,
          serviceId: service.id,
          method: "zoom",
          idempotencyKey: uid(),
        }),
        "CONFLICT",
      );

      expect(error.message).toContain("Zoom");
    });
  });

  describe("expireStaleBookings", () => {
    it("mengubah booking kedaluwarsa, payment, dan melepas slot", async () => {
      const scenario = await createBookingScenario();

      await prisma.booking.update({
        where: { id: scenario.booking.id },
        data: { paymentExpiresAt: new Date(Date.now() - 60_000) },
      });
      const payment = await createPayment({
        bookingId: scenario.booking.id,
        status: "pending",
      });

      expect(await expireStaleBookings()).toBe(1);

      const booking = await prisma.booking.findUniqueOrThrow({
        where: { id: scenario.booking.id },
      });
      const storedPayment = await prisma.payment.findUniqueOrThrow({
        where: { id: payment.id },
      });
      const slot = await prisma.timeSlot.findUniqueOrThrow({
        where: { id: scenario.slot.id },
      });

      expect(booking.status).toBe("expired");
      expect(storedPayment.status).toBe("expired");
      expect(slot.status).toBe("available");
    });

    it("tidak mengubah booking yang belum kedaluwarsa", async () => {
      await createBookingScenario();
      expect(await expireStaleBookings()).toBe(0);
    });

    it("aman dipanggil berulang", async () => {
      const scenario = await createBookingScenario();

      await prisma.booking.update({
        where: { id: scenario.booking.id },
        data: { paymentExpiresAt: new Date(Date.now() - 60_000) },
      });

      expect(await expireStaleBookings()).toBe(1);
      expect(await expireStaleBookings()).toBe(0);
    });
  });

  describe("findBookingForViewer", () => {
    it("mengizinkan pasien, konselor, dan admin terkait", async () => {
      const scenario = await createBookingScenario();
      const admin = await createProfile({ role: "admin" });

      await expect(
        findBookingForViewer(scenario.booking.id, {
          id: scenario.patient.id,
          role: "patient",
        }),
      ).resolves.toMatchObject({ id: scenario.booking.id });

      await expect(
        findBookingForViewer(scenario.booking.id, {
          id: scenario.counselor.id,
          role: "counselor",
        }),
      ).resolves.toMatchObject({ id: scenario.booking.id });

      await expect(
        findBookingForViewer(scenario.booking.id, {
          id: admin.id,
          role: "admin",
        }),
      ).resolves.toMatchObject({ id: scenario.booking.id });
    });

    it("menolak pengguna lain dengan NOT_FOUND", async () => {
      const scenario = await createBookingScenario();
      const stranger = await createProfile({ role: "patient" });

      await expectAppError(
        findBookingForViewer(scenario.booking.id, {
          id: stranger.id,
          role: "patient",
        }),
        "NOT_FOUND",
      );
    });

    it("menolak booking yang tidak ada", async () => {
      await expectAppError(
        findBookingForViewer(uid(), { id: uid(), role: "admin" }),
        "NOT_FOUND",
      );
    });
  });
});
