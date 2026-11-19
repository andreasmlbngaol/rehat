import { afterEach, describe, expect, it, vi } from "vitest";
import { clientIp, consume } from "@/lib/api/rate-limit";

afterEach(() => {
  vi.useRealTimers();
});

describe("consume (fixed window)", () => {
  it("mengizinkan permintaan sampai batas", () => {
    const key = `test-${Math.random()}`;

    expect(consume(key, 2, 1_000).allowed).toBe(true);
    expect(consume(key, 2, 1_000).allowed).toBe(true);
    expect(consume(key, 2, 1_000).allowed).toBe(false);
  });

  it("mengembalikan retryAfterSeconds yang masuk akal", () => {
    const key = `test-${Math.random()}`;

    const first = consume(key, 1, 30_000);
    expect(first.retryAfterSeconds).toBe(30);

    const blocked = consume(key, 1, 30_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(30);
  });

  it("mereset hitungan setelah jendela berakhir", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const key = `test-${Math.random()}`;

    expect(consume(key, 1, 1_000).allowed).toBe(true);
    expect(consume(key, 1, 1_000).allowed).toBe(false);

    vi.advanceTimersByTime(1_001);

    expect(consume(key, 1, 1_000).allowed).toBe(true);
  });

  it("memisahkan bucket berdasarkan key", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;

    expect(consume(a, 1, 1_000).allowed).toBe(true);
    expect(consume(a, 1, 1_000).allowed).toBe(false);
    expect(consume(b, 1, 1_000).allowed).toBe(true);
  });
});

describe("clientIp", () => {
  it("mengambil IP pertama dari x-forwarded-for", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    });

    expect(clientIp(request)).toBe("203.0.113.5");
  });

  it("memakai x-real-ip bila x-forwarded-for tidak ada", () => {
    const request = new Request("http://localhost", {
      headers: { "x-real-ip": "198.51.100.7" },
    });

    expect(clientIp(request)).toBe("198.51.100.7");
  });

  it("fallback ke 'local'", () => {
    expect(clientIp(new Request("http://localhost"))).toBe("local");
  });
});
