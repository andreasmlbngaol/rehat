import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const START = new Date("2026-11-09T10:00:00.000Z");

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function loadModule() {
  return import("@/lib/integrations/zoom");
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("createZoomMeeting", () => {
  it("meminta token lalu membuat meeting dengan durasi maksimal 40 menit", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "token-1", expires_in: 3_600 }))
      .mockResolvedValueOnce(
        jsonResponse({
          id: 99,
          join_url: "https://zoom.test/j/99",
          start_url: "https://zoom.test/s/99",
          start_time: START.toISOString(),
          duration: 40,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { createZoomMeeting } = await loadModule();
    const result = await createZoomMeeting({
      topic: "Konseling",
      startTime: START,
      durationMinutes: 90,
      agenda: "Agenda",
    });

    expect(result).toMatchObject({ id: 99, duration: 40 });

    const [tokenUrl, tokenInit] = fetchMock.mock.calls[0]!;
    expect(tokenUrl).toContain("grant_type=account_credentials");
    expect(tokenUrl).toContain("account_id=test-zoom-account");
    expect(tokenInit.method).toBe("POST");
    expect(tokenInit.headers.Authorization).toMatch(/^Basic /);

    const [meetingUrl, meetingInit] = fetchMock.mock.calls[1]!;
    expect(meetingUrl).toBe("https://api.zoom.us/v2/users/me/meetings");
    expect(meetingInit.headers.Authorization).toBe("Bearer token-1");
    const body = JSON.parse(meetingInit.body as string);
    expect(body).toMatchObject({
      topic: "Konseling",
      type: 2,
      start_time: START.toISOString(),
      duration: 40,
      timezone: "UTC",
      agenda: "Agenda",
      settings: {
        join_before_host: true,
        waiting_room: false,
        approval_type: 2,
        audio: "both",
        auto_recording: "none",
        meeting_authentication: false,
      },
    });
  });

  it("memakai token yang masih berlaku untuk permintaan berikutnya", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "token-1", expires_in: 3_600 }))
      .mockImplementation(() =>
        Promise.resolve(
          jsonResponse({
            id: 1,
            join_url: "https://zoom.test/j/1",
            start_url: "https://zoom.test/s/1",
            start_time: START.toISOString(),
            duration: 40,
          }),
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { createZoomMeeting } = await loadModule();
    await createZoomMeeting({ topic: "A", startTime: START, durationMinutes: 40 });
    await createZoomMeeting({ topic: "B", startTime: START, durationMinutes: 40 });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const tokenCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes("zoom.us/oauth/token"),
    );
    expect(tokenCalls).toHaveLength(1);
  });

  it("melempar ZOOM_AUTH_FAILED bila token ditolak", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("invalid", { status: 401 })),
    );

    const { createZoomMeeting } = await loadModule();

    await expect(
      createZoomMeeting({ topic: "A", startTime: START, durationMinutes: 40 }),
    ).rejects.toThrow("ZOOM_AUTH_FAILED: 401");
  });

  it("melempar ZOOM_CREATE_FAILED beserta detail respons", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse({ access_token: "token-1", expires_in: 3_600 }))
        .mockResolvedValueOnce(new Response("quota habis", { status: 429 })),
    );

    const { createZoomMeeting } = await loadModule();

    await expect(
      createZoomMeeting({ topic: "A", startTime: START, durationMinutes: 40 }),
    ).rejects.toThrow("ZOOM_CREATE_FAILED: 429 quota habis");
  });

  it("memotong topic dan agenda sesuai batas Zoom", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "token-1", expires_in: 3_600 }))
      .mockResolvedValueOnce(
        jsonResponse({
          id: 1,
          join_url: "https://zoom.test/j/1",
          start_url: "https://zoom.test/s/1",
          start_time: START.toISOString(),
          duration: 40,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { createZoomMeeting } = await loadModule();
    await createZoomMeeting({
      topic: "t".repeat(300),
      startTime: START,
      durationMinutes: 40,
      agenda: "a".repeat(3_000),
    });

    const body = JSON.parse(fetchMock.mock.calls[1]![1].body as string);
    expect(body.topic).toHaveLength(200);
    expect(body.agenda).toHaveLength(2_000);
  });
});
