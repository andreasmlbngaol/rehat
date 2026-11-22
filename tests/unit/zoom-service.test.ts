import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, createZoomMeetingMock } = vi.hoisted(() => ({
  prismaMock: {
    counselingSession: { findUnique: vi.fn() },
    zoomMeeting: { create: vi.fn(), update: vi.fn() },
  },
  createZoomMeetingMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/integrations/zoom", () => ({
  createZoomMeeting: createZoomMeetingMock,
}));

import { ensureZoomMeeting } from "@/lib/services/zoom.service";

const START = new Date("2026-11-09T10:00:00.000Z");

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: "session-1",
    booking: {
      method: "zoom",
      serviceName: "Konseling Individu",
      scheduledStart: START,
      durationMinutes: 60,
      counselor: { fullName: "Ayu Prameswari" },
    },
    zoomMeeting: null,
    ...overrides,
  };
}

function createdMeeting(id = "meeting-1", durationMinutes = 40) {
  return {
    id,
    durationMinutes,
    integrationStatus: "pending",
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.zoomMeeting.create.mockResolvedValue(createdMeeting("meeting-new"));
  prismaMock.zoomMeeting.update.mockResolvedValue({});
  createZoomMeetingMock.mockResolvedValue({
    id: 123,
    join_url: "https://zoom.test/j/123",
    start_url: "https://zoom.test/s/123",
    start_time: START.toISOString(),
    duration: 40,
  });
});

describe("ensureZoomMeeting", () => {
  it("menolak sesi yang tidak ada", async () => {
    prismaMock.counselingSession.findUnique.mockResolvedValue(null);

    await expect(ensureZoomMeeting("missing")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(createZoomMeetingMock).not.toHaveBeenCalled();
  });

  it("menolak sesi yang bukan metode Zoom", async () => {
    prismaMock.counselingSession.findUnique.mockResolvedValue(
      session({
        booking: {
          method: "in_person",
          serviceName: "Konseling Individu",
          scheduledStart: START,
          durationMinutes: 60,
          counselor: { fullName: "Ayu Prameswari" },
        },
      }),
    );

    await expect(ensureZoomMeeting("session-1")).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
    expect(createZoomMeetingMock).not.toHaveBeenCalled();
  });

  it("tidak memanggil Zoom bila meeting sudah berhasil dibuat", async () => {
    prismaMock.counselingSession.findUnique.mockResolvedValue(
      session({
        zoomMeeting: {
          id: "meeting-1",
          durationMinutes: 40,
          integrationStatus: "created",
        },
      }),
    );

    await expect(ensureZoomMeeting("session-1")).resolves.toBeUndefined();
    expect(createZoomMeetingMock).not.toHaveBeenCalled();
    expect(prismaMock.zoomMeeting.update).not.toHaveBeenCalled();
  });

  it("membuat meeting baru lalu menyimpan detail Zoom", async () => {
    prismaMock.counselingSession.findUnique.mockResolvedValue(session());

    await ensureZoomMeeting("session-1");

    expect(prismaMock.zoomMeeting.create).toHaveBeenCalledWith({
      data: {
        sessionId: "session-1",
        startTime: START,
        durationMinutes: 40,
        integrationStatus: "pending",
      },
    });

    expect(createZoomMeetingMock).toHaveBeenCalledWith({
      topic: "Konseling REHAT - Konseling Individu",
      startTime: START,
      durationMinutes: 40,
      agenda: "Sesi konseling bersama Ayu Prameswari.",
    });

    expect(prismaMock.zoomMeeting.update).toHaveBeenNthCalledWith(1, {
      where: { id: "meeting-new" },
      data: { attemptCount: { increment: 1 } },
    });

    expect(prismaMock.zoomMeeting.update).toHaveBeenNthCalledWith(2, {
      where: { id: "meeting-new" },
      data: {
        zoomMeetingId: "123",
        joinUrl: "https://zoom.test/j/123",
        startUrl: "https://zoom.test/s/123",
        integrationStatus: "created",
        lastError: null,
      },
    });
  });

  it("memakai ulang meeting pending dan menambah attemptCount", async () => {
    prismaMock.counselingSession.findUnique.mockResolvedValue(
      session({
        zoomMeeting: {
          id: "meeting-pending",
          durationMinutes: 30,
          integrationStatus: "failed",
        },
      }),
    );

    await ensureZoomMeeting("session-1");

    expect(prismaMock.zoomMeeting.create).not.toHaveBeenCalled();
    expect(createZoomMeetingMock).toHaveBeenCalledWith(
      expect.objectContaining({ durationMinutes: 30 }),
    );
    expect(prismaMock.zoomMeeting.update).toHaveBeenNthCalledWith(1, {
      where: { id: "meeting-pending" },
      data: { attemptCount: { increment: 1 } },
    });
  });

  it("menandai gagal dan memotong pesan error Zoom", async () => {
    prismaMock.counselingSession.findUnique.mockResolvedValue(session());
    createZoomMeetingMock.mockRejectedValue(new Error("x".repeat(2_000)));

    await expect(ensureZoomMeeting("session-1")).rejects.toMatchObject({
      code: "EXTERNAL_SERVICE_ERROR",
    });

    expect(prismaMock.zoomMeeting.update).toHaveBeenLastCalledWith({
      where: { id: "meeting-new" },
      data: {
        integrationStatus: "failed",
        lastError: "x".repeat(1_000),
      },
    });
  });

  it("memakai pesan cadangan saat error bukan Error", async () => {
    prismaMock.counselingSession.findUnique.mockResolvedValue(session());
    createZoomMeetingMock.mockRejectedValue("bukan error");

    await expect(ensureZoomMeeting("session-1")).rejects.toMatchObject({
      code: "EXTERNAL_SERVICE_ERROR",
    });

    expect(prismaMock.zoomMeeting.update).toHaveBeenLastCalledWith({
      where: { id: "meeting-new" },
      data: {
        integrationStatus: "failed",
        lastError: "Kesalahan tidak diketahui.",
      },
    });
  });
});
