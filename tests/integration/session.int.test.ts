import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import {
  assertSessionParticipant,
  getSessionForViewer,
  reconcileSessionStatus,
  reconcileSessionsForUser,
} from "@/lib/services/session.service";
import {
  ensureTestSchema,
  hasTestDatabase,
  resetDatabase,
} from "../helpers/db";
import {
  createBookingScenario,
  createProfile,
  uid,
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

suite("session.service (integration)", () => {
  beforeAll(async () => {
    await ensureTestSchema();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe("reconcileSessionStatus", () => {
    it("mengubah sesi lampau menjadi completed dan mengisi endedAt", async () => {
      const start = new Date(Date.now() - 2 * 60 * 60_000);
      const scenario = await createBookingScenario({
        status: "confirmed",
        scheduledStart: start,
        durationMinutes: 60,
        withSession: true,
      });

      await reconcileSessionStatus(scenario.session!.id);

      const session = await prisma.counselingSession.findUniqueOrThrow({
        where: { id: scenario.session!.id },
      });

      expect(session.status).toBe("completed");
      expect(session.endedAt?.toISOString()).toBe(
        new Date(start.getTime() + 60 * 60_000).toISOString(),
      );
    });

    it("mengaktifkan sesi yang sedang berlangsung dan mengisi startedAt", async () => {
      const start = new Date(Date.now() - 10 * 60_000);
      const scenario = await createBookingScenario({
        status: "confirmed",
        scheduledStart: start,
        durationMinutes: 60,
        withSession: true,
      });

      await reconcileSessionStatus(scenario.session!.id);

      const session = await prisma.counselingSession.findUniqueOrThrow({
        where: { id: scenario.session!.id },
      });

      expect(session.status).toBe("active");
      expect(session.startedAt).not.toBeNull();
      expect(session.endedAt).toBeNull();
    });

    it("tidak mengubah sesi yang masih terjadwal", async () => {
      const scenario = await createBookingScenario({
        status: "confirmed",
        scheduledStart: new Date(Date.now() + 60 * 60_000),
        withSession: true,
      });

      await reconcileSessionStatus(scenario.session!.id);

      const session = await prisma.counselingSession.findUniqueOrThrow({
        where: { id: scenario.session!.id },
      });

      expect(session.status).toBe("scheduled");
      expect(session.startedAt).toBeNull();
    });

    it("tidak melempar untuk sesi yang tidak ada", async () => {
      await expect(reconcileSessionStatus(uid())).resolves.toBeUndefined();
    });
  });

  describe("reconcileSessionsForUser", () => {
    it("hanya memperbarui sesi milik pasien tersebut", async () => {
      const mine = await createBookingScenario({
        status: "confirmed",
        scheduledStart: new Date(Date.now() - 2 * 60 * 60_000),
        withSession: true,
      });
      const other = await createBookingScenario({
        status: "confirmed",
        scheduledStart: new Date(Date.now() - 2 * 60 * 60_000),
        withSession: true,
      });

      await reconcileSessionsForUser({
        id: mine.patient.id,
        role: "patient",
      });

      expect(
        (
          await prisma.counselingSession.findUniqueOrThrow({
            where: { id: mine.session!.id },
          })
        ).status,
      ).toBe("completed");

      expect(
        (
          await prisma.counselingSession.findUniqueOrThrow({
            where: { id: other.session!.id },
          })
        ).status,
      ).toBe("scheduled");
    });

    it("memperbarui sesi milik konselor", async () => {
      const scenario = await createBookingScenario({
        status: "confirmed",
        scheduledStart: new Date(Date.now() - 2 * 60 * 60_000),
        withSession: true,
      });

      await reconcileSessionsForUser({
        id: scenario.counselor.id,
        role: "counselor",
      });

      expect(
        (
          await prisma.counselingSession.findUniqueOrThrow({
            where: { id: scenario.session!.id },
          })
        ).status,
      ).toBe("completed");
    });

    it("tidak melakukan apa pun untuk admin", async () => {
      const scenario = await createBookingScenario({
        status: "confirmed",
        scheduledStart: new Date(Date.now() - 2 * 60 * 60_000),
        withSession: true,
      });

      await reconcileSessionsForUser({ id: uid(), role: "admin" });

      expect(
        (
          await prisma.counselingSession.findUniqueOrThrow({
            where: { id: scenario.session!.id },
          })
        ).status,
      ).toBe("scheduled");
    });
  });

  describe("getSessionForViewer", () => {
    it("menentukan hak akses pasien, konselor, dan admin", async () => {
      const scenario = await createBookingScenario({
        status: "confirmed",
        scheduledStart: new Date(Date.now() + 60 * 60_000),
        withSession: true,
      });
      const admin = await createProfile({ role: "admin" });

      await expect(
        getSessionForViewer(scenario.session!.id, {
          id: scenario.patient.id,
          role: "patient",
        }),
      ).resolves.toMatchObject({ access: "patient" });

      await expect(
        getSessionForViewer(scenario.session!.id, {
          id: scenario.counselor.id,
          role: "counselor",
        }),
      ).resolves.toMatchObject({ access: "counselor" });

      await expect(
        getSessionForViewer(scenario.session!.id, {
          id: admin.id,
          role: "admin",
        }),
      ).resolves.toMatchObject({ access: "admin" });
    });

    it("menyembunyikan sesi dari pengguna lain", async () => {
      const scenario = await createBookingScenario({
        status: "confirmed",
        scheduledStart: new Date(Date.now() + 60 * 60_000),
        withSession: true,
      });
      const stranger = await createProfile({ role: "patient" });

      await expectAppError(
        getSessionForViewer(scenario.session!.id, {
          id: stranger.id,
          role: "patient",
        }),
        "NOT_FOUND",
      );
    });

    it("menolak sesi yang tidak ada", async () => {
      await expectAppError(
        getSessionForViewer(uid(), { id: uid(), role: "admin" }),
        "NOT_FOUND",
      );
    });
  });

  describe("assertSessionParticipant", () => {
    it("mengembalikan sesi untuk peserta", async () => {
      const scenario = await createBookingScenario({
        status: "confirmed",
        scheduledStart: new Date(Date.now() + 60 * 60_000),
        withSession: true,
      });

      const session = await assertSessionParticipant(
        scenario.session!.id,
        scenario.patient.id,
      );

      expect(session.id).toBe(scenario.session!.id);
      expect(session.booking.patientId).toBe(scenario.patient.id);
    });

    it("menolak non-peserta dengan FORBIDDEN", async () => {
      const scenario = await createBookingScenario({
        status: "confirmed",
        scheduledStart: new Date(Date.now() + 60 * 60_000),
        withSession: true,
      });
      const stranger = await createProfile({ role: "counselor" });

      await expectAppError(
        assertSessionParticipant(scenario.session!.id, stranger.id),
        "FORBIDDEN",
      );
    });

    it("menolak sesi yang tidak ada", async () => {
      await expectAppError(assertSessionParticipant(uid(), uid()), "NOT_FOUND");
    });
  });
});
