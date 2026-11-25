import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

const { updateUserByIdMock } = vi.hoisted(() => ({
  updateUserByIdMock: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    auth: { admin: { updateUserById: updateUserByIdMock } },
  }),
}));

import {
  buildAdminUserWhere,
  getAdminStats,
  setUserActive,
} from "@/lib/services/admin.service";
import {
  ensureTestSchema,
  hasTestDatabase,
  resetDatabase,
} from "../helpers/db";
import {
  createBooking,
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

suite("admin.service (integration)", () => {
  beforeAll(async () => {
    await ensureTestSchema();
  });

  beforeEach(async () => {
    await resetDatabase();
    updateUserByIdMock.mockReset();
    updateUserByIdMock.mockResolvedValue({ data: {}, error: null });
  });

  describe("buildAdminUserWhere", () => {
    it("mengembalikan filter kosong tanpa query", () => {
      expect(buildAdminUserWhere({ page: 1, limit: 20 })).toEqual({});
    });

    it("memfilter berdasarkan peran dan status", () => {
      expect(
        buildAdminUserWhere({
          role: "counselor",
          isActive: false,
          page: 1,
          limit: 20,
        }),
      ).toEqual({ role: "counselor", isActive: false });
    });

    it("membuat pencarian nama/email case-insensitive", () => {
      expect(
        buildAdminUserWhere({ q: "ayu", page: 1, limit: 20 }),
      ).toEqual({
        OR: [
          { fullName: { contains: "ayu", mode: "insensitive" } },
          { email: { contains: "ayu", mode: "insensitive" } },
        ],
      });
    });
  });

  describe("getAdminStats", () => {
    it("menghitung ringkasan operasional", async () => {
      const activeService = await createService({ isActive: true });
      await createService({ isActive: false });
      const activeCounselor = await createCounselor({
        services: [activeService.id],
        isActive: true,
      });
      await createCounselor({
        services: [activeService.id],
        isActive: false,
      });
      const patient = await createProfile({ role: "patient" });
      await createProfile({ role: "patient" });

      const slot = await createSlot({
        counselorId: activeCounselor.id,
        startTime: wibDate(2, 9),
      });

      const confirmed = await createBooking({
        patientId: patient.id,
        counselorId: activeCounselor.id,
        serviceId: activeService.id,
        timeSlotId: slot.id,
        status: "confirmed",
      });
      const pending = await createBooking({
        patientId: patient.id,
        counselorId: activeCounselor.id,
        serviceId: activeService.id,
        timeSlotId: slot.id,
        status: "pending_payment",
      });
      await createBooking({
        patientId: patient.id,
        counselorId: activeCounselor.id,
        serviceId: activeService.id,
        timeSlotId: slot.id,
        status: "cancelled",
      });

      await createPayment({
        bookingId: confirmed.id,
        status: "success",
        grossAmount: 150000,
      });
      await createPayment({
        bookingId: confirmed.id,
        status: "success",
        grossAmount: 250000,
      });
      await createPayment({
        bookingId: pending.id,
        status: "pending",
      });

      const stats = await getAdminStats();

      expect(stats.services).toEqual({ total: 2, active: 1 });
      expect(stats.counselors).toEqual({ total: 2, active: 1 });
      expect(stats.patients.total).toBe(2);
      expect(stats.bookings).toMatchObject({
        total: 3,
        confirmed: 1,
        pendingPayment: 1,
        cancelled: 1,
      });
      expect(stats.payments).toMatchObject({
        total: 3,
        success: 2,
        pending: 1,
        revenue: 400000,
      });
      expect(stats.sessions.total).toBe(0);
      expect(stats.zoomMeetings.total).toBe(0);
    });
  });

  describe("setUserActive", () => {
    it("menolak menonaktifkan akun sendiri", async () => {
      const admin = await createProfile({ role: "admin" });

      const error = await expectAppError(
        setUserActive({
          id: admin.id,
          isActive: false,
          actorId: admin.id,
        }),
        "VALIDATION_ERROR",
      );

      expect(error.errors?.isActive).toBeDefined();
      expect(updateUserByIdMock).not.toHaveBeenCalled();
    });

    it("menolak pengguna yang tidak ada", async () => {
      await expectAppError(
        setUserActive({
          id: uid(),
          isActive: false,
          actorId: uid(),
        }),
        "NOT_FOUND",
      );
    });

    it("tidak memanggil Supabase bila status sama", async () => {
      const user = await createProfile({ isActive: true });

      await setUserActive({
        id: user.id,
        isActive: true,
        actorId: uid(),
      });

      expect(updateUserByIdMock).not.toHaveBeenCalled();
    });

    it("menonaktifkan akun dan memblokir Supabase Auth", async () => {
      const user = await createProfile({ isActive: true });

      await setUserActive({
        id: user.id,
        isActive: false,
        actorId: uid(),
      });

      expect(updateUserByIdMock).toHaveBeenCalledWith(user.id, {
        ban_duration: "876000h",
      });

      const stored = await prisma.profile.findUniqueOrThrow({
        where: { id: user.id },
      });
      expect(stored.isActive).toBe(false);
    });

    it("mengaktifkan kembali akun dan melepas ban", async () => {
      const user = await createProfile({ isActive: false });

      await setUserActive({
        id: user.id,
        isActive: true,
        actorId: uid(),
      });

      expect(updateUserByIdMock).toHaveBeenCalledWith(user.id, {
        ban_duration: "none",
      });

      const stored = await prisma.profile.findUniqueOrThrow({
        where: { id: user.id },
      });
      expect(stored.isActive).toBe(true);
    });

    it("mengembalikan EXTERNAL_SERVICE_ERROR bila Supabase gagal", async () => {
      const user = await createProfile({ isActive: true });
      updateUserByIdMock.mockResolvedValue({
        data: {},
        error: { message: "boom" },
      });

      await expectAppError(
        setUserActive({
          id: user.id,
          isActive: false,
          actorId: uid(),
        }),
        "EXTERNAL_SERVICE_ERROR",
      );

      const stored = await prisma.profile.findUniqueOrThrow({
        where: { id: user.id },
      });
      expect(stored.isActive).toBe(true);
    });
  });
});
