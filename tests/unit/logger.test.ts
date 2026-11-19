import { afterEach, describe, expect, it, vi } from "vitest";
import { log, logError, logRequest } from "@/lib/logger";

afterEach(() => {
  vi.restoreAllMocks();
});

function capture(level: "log" | "warn" | "error") {
  return vi.spyOn(console, level).mockImplementation(() => {});
}

describe("log", () => {
  it("menulis JSON satu baris dengan timestamp, level, dan event", () => {
    const spy = capture("log");

    log("info", "test_event", { userId: "u1" });

    expect(spy).toHaveBeenCalledOnce();
    const entry = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(entry).toMatchObject({
      level: "info",
      event: "test_event",
      userId: "u1",
    });
    expect(typeof entry.ts).toBe("string");
  });

  it("meredaksi field sensitif", () => {
    const spy = capture("log");

    log("info", "auth", {
      authorization: "Bearer abc",
      cookie: "session=1",
      password: "rahasia",
      token: "tok",
      secret: "s",
      key: "k",
      signature: "sig",
      safe: "boleh",
    });

    const entry = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(entry.authorization).toBe("[redacted]");
    expect(entry.cookie).toBe("[redacted]");
    expect(entry.password).toBe("[redacted]");
    expect(entry.token).toBe("[redacted]");
    expect(entry.secret).toBe("[redacted]");
    expect(entry.key).toBe("[redacted]");
    expect(entry.signature).toBe("[redacted]");
    expect(entry.safe).toBe("boleh");
  });

  it("meredaksi tanpa memandang kapitalisasi kunci", () => {
    const spy = capture("log");

    log("info", "auth", { Authorization: "Bearer abc" });

    const entry = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(entry.Authorization).toBe("[redacted]");
  });

  it("memakai console.warn untuk level warn", () => {
    const spy = capture("warn");
    log("warn", "peringatan");
    expect(spy).toHaveBeenCalledOnce();
  });

  it("memakai console.error untuk level error", () => {
    const spy = capture("error");
    log("error", "gagal");
    expect(spy).toHaveBeenCalledOnce();
  });
});

describe("logRequest", () => {
  it("memakai level info untuk status < 500", () => {
    const spy = capture("log");

    logRequest({
      requestId: "req-1",
      method: "GET",
      path: "/api/v1/health",
      status: 200,
      durationMs: 12,
      userId: null,
      ip: "127.0.0.1",
    });

    const entry = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(entry).toMatchObject({
      event: "http_request",
      level: "info",
      status: 200,
    });
  });

  it("memakai level error untuk status >= 500", () => {
    const spy = capture("error");

    logRequest({
      requestId: "req-2",
      method: "POST",
      path: "/api/v1/bookings",
      status: 500,
      durationMs: 50,
    });

    const entry = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(entry.level).toBe("error");
  });
});

describe("logError", () => {
  it("menyertakan message dan stack dari Error", () => {
    const spy = capture("error");
    const error = new Error("boom");

    logError({ event: "unhandled", error, requestId: "req-3" });

    const entry = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(entry.message).toBe("boom");
    expect(entry.stack).toContain("boom");
    expect(entry.requestId).toBe("req-3");
  });

  it("menangani nilai non-Error", () => {
    const spy = capture("error");

    logError({ event: "unhandled", error: "string error" });

    const entry = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(entry.message).toBe("string error");
  });
});
