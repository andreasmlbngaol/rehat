import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { listMessages, sendMessage } from "@/lib/services/chat.service";
import {
  ensureTestSchema,
  hasTestDatabase,
  resetDatabase,
} from "../helpers/db";
import {
  createBookingScenario,
  createMessage,
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

suite("chat.service (integration)", () => {
  beforeAll(async () => {
    await ensureTestSchema();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  async function activeScenario() {
    const start = new Date(Date.now() - 30 * 60_000);

    return createBookingScenario({
      status: "confirmed",
      scheduledStart: start,
      durationMinutes: 60,
      withSession: true,
      sessionStatus: "active",
    });
  }

  describe("sendMessage", () => {
    it("menyimpan pesan selama sesi berlangsung", async () => {
      const scenario = await activeScenario();

      const result = await sendMessage({
        sessionId: scenario.session!.id,
        userId: scenario.patient.id,
        content: "  Halo konselor  ",
        clientMessageId: uid(),
      });

      expect(result.duplicate).toBe(false);
      expect(result.message.content).toBe("Halo konselor");
      expect(result.message.senderId).toBe(scenario.patient.id);
      expect(result.message.sender.fullName).toBe(scenario.patient.fullName);
    });

    it("idempoten berdasarkan clientMessageId", async () => {
      const scenario = await activeScenario();
      const clientMessageId = uid();

      const first = await sendMessage({
        sessionId: scenario.session!.id,
        userId: scenario.patient.id,
        content: "Pertama",
        clientMessageId,
      });

      const second = await sendMessage({
        sessionId: scenario.session!.id,
        userId: scenario.patient.id,
        content: "Kedua",
        clientMessageId,
      });

      expect(second.duplicate).toBe(true);
      expect(second.message.id).toBe(first.message.id);
      expect(second.message.content).toBe("Pertama");

      expect(
        await prisma.chatMessage.count({
          where: { sessionId: scenario.session!.id },
        }),
      ).toBe(1);
    });

    it("mengizinkan konselor membalas", async () => {
      const scenario = await activeScenario();

      const result = await sendMessage({
        sessionId: scenario.session!.id,
        userId: scenario.counselor.id,
        content: "Halo, ada yang bisa dibantu?",
        clientMessageId: uid(),
      });

      expect(result.message.senderId).toBe(scenario.counselor.id);
    });

    it("menolak pesan kosong", async () => {
      const scenario = await activeScenario();

      const error = await expectAppError(
        sendMessage({
          sessionId: scenario.session!.id,
          userId: scenario.patient.id,
          content: "   ",
          clientMessageId: uid(),
        }),
        "VALIDATION_ERROR",
      );

      expect(error.errors?.content).toBeDefined();
    });

    it("menolak pesan lebih dari 2000 karakter", async () => {
      const scenario = await activeScenario();

      await expectAppError(
        sendMessage({
          sessionId: scenario.session!.id,
          userId: scenario.patient.id,
          content: "x".repeat(2001),
          clientMessageId: uid(),
        }),
        "VALIDATION_ERROR",
      );
    });

    it("menolak pesan sebelum sesi dimulai", async () => {
      const scenario = await createBookingScenario({
        status: "confirmed",
        scheduledStart: new Date(Date.now() + 60 * 60_000),
        withSession: true,
      });

      const error = await expectAppError(
        sendMessage({
          sessionId: scenario.session!.id,
          userId: scenario.patient.id,
          content: "Terlalu awal",
          clientMessageId: uid(),
        }),
        "SESSION_NOT_ACTIVE",
      );

      expect(error.message).toContain("belum dimulai");
    });

    it("menolak pesan setelah sesi berakhir", async () => {
      const scenario = await createBookingScenario({
        status: "confirmed",
        scheduledStart: new Date(Date.now() - 2 * 60 * 60_000),
        durationMinutes: 60,
        withSession: true,
        sessionStatus: "completed",
      });

      const error = await expectAppError(
        sendMessage({
          sessionId: scenario.session!.id,
          userId: scenario.patient.id,
          content: "Terlalu telat",
          clientMessageId: uid(),
        }),
        "SESSION_NOT_ACTIVE",
      );

      expect(error.message).toContain("sudah berakhir");
    });

    it("menolak pengguna yang bukan peserta sesi", async () => {
      const scenario = await activeScenario();
      const stranger = await createProfile({ role: "patient" });

      await expectAppError(
        sendMessage({
          sessionId: scenario.session!.id,
          userId: stranger.id,
          content: "Menyusup",
          clientMessageId: uid(),
        }),
        "FORBIDDEN",
      );
    });

    it("menolak sesi yang tidak ada", async () => {
      await expectAppError(
        sendMessage({
          sessionId: uid(),
          userId: uid(),
          content: "Halo",
          clientMessageId: uid(),
        }),
        "NOT_FOUND",
      );
    });
  });

  describe("listMessages", () => {
    it("mengembalikan pesan urut naik dengan cursor", async () => {
      const scenario = await activeScenario();
      const base = Date.now() - 10 * 60_000;
      const created = [];

      for (let index = 0; index < 5; index += 1) {
        created.push(
          await createMessage({
            sessionId: scenario.session!.id,
            senderId: scenario.patient.id,
            content: `Pesan ${index + 1}`,
            createdAt: new Date(base + index * 60_000),
          }),
        );
      }

      const first = await listMessages({
        sessionId: scenario.session!.id,
        userId: scenario.patient.id,
        limit: 2,
      });

      expect(first.items.map((item) => item.content)).toEqual([
        "Pesan 4",
        "Pesan 5",
      ]);
      expect(first.hasMore).toBe(true);
      expect(first.nextCursor).toBe(created[3]!.createdAt.toISOString());

      const second = await listMessages({
        sessionId: scenario.session!.id,
        userId: scenario.patient.id,
        before: new Date(first.nextCursor!),
        limit: 2,
      });

      expect(second.items.map((item) => item.content)).toEqual([
        "Pesan 2",
        "Pesan 3",
      ]);
      expect(second.hasMore).toBe(true);
    });

    it("mengembalikan semua pesan bila kurang dari limit", async () => {
      const scenario = await activeScenario();

      await createMessage({
        sessionId: scenario.session!.id,
        senderId: scenario.patient.id,
        content: "Satu-satunya",
      });

      const result = await listMessages({
        sessionId: scenario.session!.id,
        userId: scenario.patient.id,
        limit: 50,
      });

      expect(result.items).toHaveLength(1);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it("menolak pengguna yang bukan peserta", async () => {
      const scenario = await activeScenario();
      const stranger = await createProfile({ role: "patient" });

      await expectAppError(
        listMessages({
          sessionId: scenario.session!.id,
          userId: stranger.id,
          limit: 20,
        }),
        "FORBIDDEN",
      );
    });
  });
});
