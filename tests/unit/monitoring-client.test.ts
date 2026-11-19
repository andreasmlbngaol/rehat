import { afterEach, describe, expect, it, vi } from "vitest";
import { reportClientError } from "@/lib/monitoring/client";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function errorWith(message: string, digest?: string): Error & { digest?: string } {
  const error = new Error(message) as Error & { digest?: string };
  if (digest) error.digest = digest;
  return error;
}

describe("reportClientError", () => {
  it("mengirim lewat sendBeacon bila tersedia", async () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    vi.stubGlobal("navigator", { sendBeacon });
    vi.stubGlobal("window", {
      location: { href: "https://rehat.test/dashboard/bookings" },
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    reportClientError(errorWith("render gagal", "digest-1"), { scope: "boundary" });

    expect(sendBeacon).toHaveBeenCalledOnce();
    const [url, blob] = sendBeacon.mock.calls[0]!;
    expect(url).toBe("/api/v1/client-errors");

    const payload = JSON.parse(await (blob as Blob).text());
    expect(payload).toMatchObject({
      message: "render gagal",
      digest: "digest-1",
      url: "https://rehat.test/dashboard/bookings",
      context: { scope: "boundary" },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("jatuh ke fetch dengan keepalive bila sendBeacon menolak", async () => {
    const sendBeacon = vi.fn().mockReturnValue(false);
    vi.stubGlobal("navigator", { sendBeacon });
    vi.stubGlobal("window", { location: { href: "https://rehat.test/" } });
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);

    reportClientError(errorWith("gagal"));

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/v1/client-errors");
    expect(init).toMatchObject({ method: "POST", keepalive: true });
    expect(JSON.parse(init.body as string)).toMatchObject({ message: "gagal" });
  });

  it("tetap mengirim lewat fetch saat navigator tidak punya sendBeacon", async () => {
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("window", { location: { href: "https://rehat.test/" } });
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);

    reportClientError(errorWith("tanpa beacon"));

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("memotong message dan stack agar payload tidak membengkak", async () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    vi.stubGlobal("navigator", { sendBeacon });
    vi.stubGlobal("window", { location: { href: "https://rehat.test/" } });

    const error = errorWith("x".repeat(2_500));
    error.stack = "y".repeat(12_000);

    reportClientError(error);

    const [, blob] = sendBeacon.mock.calls[0]!;
    const payload = JSON.parse(await (blob as Blob).text());
    expect(payload.message).toHaveLength(2_000);
    expect(payload.stack).toHaveLength(10_000);
  });

  it("tidak melempar bila fetch gagal", async () => {
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("window", { location: { href: "https://rehat.test/" } });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    expect(() => reportClientError(errorWith("offline"))).not.toThrow();
    await Promise.resolve();
  });
});
