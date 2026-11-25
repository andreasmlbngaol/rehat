import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import {
  createTimeSlot,
  deleteTimeSlot,
  toTimeSlotDto,
  updateTimeSlot,
} from "@/lib/services/time-slot.service";
import {
  ensureTestSchema,
  hasTestDatabase,
  resetDatabase,
} from "../helpers/db";
import {
  createBooking,
  createCounselor,
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

suite("time-slot.service (integration)", () => {
  beforeAll(async () => {
    await ensureTestSchema();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe("createTimeSlot", () => {
    it("membuat slot dengan durasi layanan", async () => {
      const service = await createService({ durationMinutes: 45 });
      const counselor = await createCounselor({ services: [service.id] });
      const start = wibDate(3, 9);

      const slot = await createTimeSlot({
        counselorId: counselor.id,
        createdBy: counselor.id,
        startTime: start,
        serviceId: service.id,
      });

      expect(slot.startTime.toISOString()).toBe(start.toISOString());
      expect(slot.endTime.toISOString()).toBe(
        new Date(start.getTime() + 45 * 60_000).toISOString(),
      );
      expect(slot.status).toBe("available");
    });

    it("membuat slot dengan durasi manual", async () => {
      const counselor = await createCounselor();
      const start = wibDate(3, 9);

      const slot = await createTimeSlot({
        counselorId: counselor.id,
        createdBy: counselor.id,
        startTime: start,
        durationMinutes: 30,
      });

      expect(slot.endTime.toISOString()).toBe(
        new Date(start.getTime() + 30 * 60_000).toISOString(),
      );
    });

    it("menolak waktu mulai di masa lalu", async () => {
      const counselor = await createCounselor();

      const error = await expectAppError(
        createTimeSlot({
          counselorId: counselor.id,
          createdBy: counselor.id,
          startTime: wibDate(-1, 9),
          durationMinutes: 60,
        }),
        "VALIDATION_ERROR",
      );

      expect(error.errors?.startTime).toBeDefined();
    });

    it("menolak bila layanan tidak ditangani konselor", async () => {
      const service = await createService();
      const counselor = await createCounselor();

      await expectAppError(
        createTimeSlot({
          counselorId: counselor.id,
          createdBy: counselor.id,
          startTime: wibDate(3, 9),
          serviceId: service.id,
        }),
        "VALIDATION_ERROR",
      );
    });

    it("menolak bila layanan dan durasi sama-sama kosong", async () => {
      const counselor = await createCounselor();

      await expectAppError(
        createTimeSlot({
          counselorId: counselor.id,
          createdBy: counselor.id,
          startTime: wibDate(3, 9),
        }),
        "VALIDATION_ERROR",
      );
    });

    it("menolak slot yang bertabrakan", async () => {
      const counselor = await createCounselor();
      const start = wibDate(3, 9);

      await createSlot({
        counselorId: counselor.id,
        startTime: start,
        durationMinutes: 60,
      });

      await expectAppError(
        createTimeSlot({
          counselorId: counselor.id,
          createdBy: counselor.id,
          startTime: new Date(start.getTime() + 30 * 60_000),
          durationMinutes: 60,
        }),
        "CONFLICT",
      );
    });

    it("menolak slot yang bertabrakan dengan sesi terkonfirmasi", async () => {
      const service = await createService();
      const counselor = await createCounselor({ services: [service.id] });
      const patient = await createProfile({ role: "patient" });
      const start = wibDate(3, 9);
      const existingSlot = await createSlot({
        counselorId: counselor.id,
        startTime: start,
        durationMinutes: 90,
        status: "booked",
      });

      await createBooking({
        patientId: patient.id,
        counselorId: counselor.id,
        serviceId: service.id,
        timeSlotId: existingSlot.id,
        status: "confirmed",
        scheduledStart: start,
      });

      await expectAppError(
        createTimeSlot({
          counselorId: counselor.id,
          createdBy: counselor.id,
          startTime: new Date(start.getTime() + 15 * 60_000),
          durationMinutes: 30,
        }),
        "CONFLICT",
      );
    });
  });

  describe("updateTimeSlot", () => {
    it("mengubah waktu mulai dan durasi", async () => {
      const counselor = await createCounselor();
      const slot = await createSlot({
        counselorId: counselor.id,
        startTime: wibDate(3, 9),
        durationMinutes: 60,
      });
      const newStart = wibDate(3, 13);

      const updated = await updateTimeSlot({
        id: slot.id,
        counselorId: counselor.id,
        startTime: newStart,
        durationMinutes: 90,
      });

      expect(updated.startTime.toISOString()).toBe(newStart.toISOString());
      expect(updated.endTime.toISOString()).toBe(
        new Date(newStart.getTime() + 90 * 60_000).toISOString(),
      );
    });

    it("menolak slot milik konselor lain", async () => {
      const owner = await createCounselor();
      const other = await createCounselor();
      const slot = await createSlot({ counselorId: owner.id });

      await expectAppError(
        updateTimeSlot({
          id: slot.id,
          counselorId: other.id,
          durationMinutes: 60,
        }),
        "FORBIDDEN",
      );
    });

    it("menolak slot yang sudah ditahan", async () => {
      const counselor = await createCounselor();
      const slot = await createSlot({
        counselorId: counselor.id,
        status: "held",
      });

      await expectAppError(
        updateTimeSlot({
          id: slot.id,
          counselorId: counselor.id,
          durationMinutes: 60,
        }),
        "CONFLICT",
      );
    });

    it("menolak slot yang sudah dipakai booking", async () => {
      const service = await createService();
      const counselor = await createCounselor({ services: [service.id] });
      const patient = await createProfile({ role: "patient" });
      const slot = await createSlot({ counselorId: counselor.id });

      await createBooking({
        patientId: patient.id,
        counselorId: counselor.id,
        serviceId: service.id,
        timeSlotId: slot.id,
      });

      await expectAppError(
        updateTimeSlot({
          id: slot.id,
          counselorId: counselor.id,
          durationMinutes: 60,
        }),
        "CONFLICT",
      );
    });

    it("menolak waktu mulai di masa lalu", async () => {
      const counselor = await createCounselor();
      const slot = await createSlot({ counselorId: counselor.id });

      await expectAppError(
        updateTimeSlot({
          id: slot.id,
          counselorId: counselor.id,
          startTime: wibDate(-1, 9),
        }),
        "VALIDATION_ERROR",
      );
    });

    it("menolak perubahan yang bertabrakan dengan slot lain", async () => {
      const counselor = await createCounselor();
      const start = wibDate(3, 9);

      await createSlot({
        counselorId: counselor.id,
        startTime: start,
        durationMinutes: 60,
      });
      const slot = await createSlot({
        counselorId: counselor.id,
        startTime: new Date(start.getTime() + 120 * 60_000),
        durationMinutes: 60,
      });

      await expectAppError(
        updateTimeSlot({
          id: slot.id,
          counselorId: counselor.id,
          startTime: new Date(start.getTime() + 30 * 60_000),
        }),
        "CONFLICT",
      );
    });

    it("menolak slot yang tidak ada", async () => {
      await expectAppError(
        updateTimeSlot({
          id: uid(),
          counselorId: uid(),
          durationMinutes: 60,
        }),
        "NOT_FOUND",
      );
    });
  });

  describe("deleteTimeSlot", () => {
    it("menghapus slot yang masih tersedia", async () => {
      const counselor = await createCounselor();
      const slot = await createSlot({ counselorId: counselor.id });

      await deleteTimeSlot({ id: slot.id, counselorId: counselor.id });

      expect(
        await prisma.timeSlot.findUnique({ where: { id: slot.id } }),
      ).toBeNull();
    });

    it("menolak slot milik konselor lain", async () => {
      const owner = await createCounselor();
      const other = await createCounselor();
      const slot = await createSlot({ counselorId: owner.id });

      await expectAppError(
        deleteTimeSlot({ id: slot.id, counselorId: other.id }),
        "FORBIDDEN",
      );
    });

    it("menolak slot yang sudah ditahan", async () => {
      const counselor = await createCounselor();
      const slot = await createSlot({
        counselorId: counselor.id,
        status: "held",
      });

      await expectAppError(
        deleteTimeSlot({ id: slot.id, counselorId: counselor.id }),
        "CONFLICT",
      );
    });

    it("mengizinkan admin menghapus tanpa counselorId", async () => {
      const counselor = await createCounselor();
      const slot = await createSlot({ counselorId: counselor.id });

      await deleteTimeSlot({ id: slot.id });

      expect(
        await prisma.timeSlot.findUnique({ where: { id: slot.id } }),
      ).toBeNull();
    });

    it("menolak slot yang tidak ada", async () => {
      await expectAppError(deleteTimeSlot({ id: uid() }), "NOT_FOUND");
    });
  });

  describe("toTimeSlotDto", () => {
    it("mengubah tanggal menjadi ISO string", async () => {
      const counselor = await createCounselor();
      const slot = await createSlot({ counselorId: counselor.id });
      const dto = toTimeSlotDto(slot);

      expect(dto.id).toBe(slot.id);
      expect(dto.startTime).toBe(slot.startTime.toISOString());
      expect(dto.endTime).toBe(slot.endTime.toISOString());
      expect(dto.status).toBe("available");
    });
  });
});
