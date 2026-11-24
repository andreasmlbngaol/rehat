import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { expireStaleBookingsMock } = vi.hoisted(() => ({
  expireStaleBookingsMock: vi.fn(),
}));

vi.mock("@/lib/services/booking.service", () => ({
  expireStaleBookings: expireStaleBookingsMock,
}));
vi.mock("@/lib/logger", () => ({
  log: vi.fn(),
  logError: vi.fn(),
  logRequest: vi.fn(),
}));

import { GET } from "@/app/api/cron/expire-bookings/route";

const context = { params: Promise.resolve({}) };
const SECRET = "cron-test-secret";

function request(authorization?: string): NextRequest {
  return new NextRequest("http://localhost/api/cron/expire-bookings", {
    headers: authorization ? { authorization } : undefined,
  });
}

beforeEach(() => {
  process.env.CRON_SECRET = SECRET;
  expireStaleBookingsMock.mockReset();
  expireStaleBookingsMock.mockResolvedValue(0);
});

afterEach(() => {
  delete process.env.CRON_SECRET;
});

describe("GET /api/cron/expire-bookings", () => {
  it("menolak permintaan tanpa token", async () => {
    const response = await GET(request(), context);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.code).toBe("UNAUTHENTICATED");
    expect(expireStaleBookingsMock).not.toHaveBeenCalled();
  });

  it("menolak token yang salah", async () => {
    const response = await GET(request("Bearer token-lain"), context);

    expect(response.status).toBe(401);
    expect(expireStaleBookingsMock).not.toHaveBeenCalled();
  });

  it("menjalankan expiry dengan token yang benar", async () => {
    expireStaleBookingsMock.mockResolvedValue(3);

    const response = await GET(request(`Bearer ${SECRET}`), context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      data: { expired: 3 },
    });
    expect(body.message).toContain("3");
    expect(expireStaleBookingsMock).toHaveBeenCalledOnce();
  });

  it("mengembalikan pesan khusus bila tidak ada yang kedaluwarsa", async () => {
    const response = await GET(request(`Bearer ${SECRET}`), context);
    const body = await response.json();

    expect(body.data.expired).toBe(0);
    expect(body.message).toBe("Tidak ada pemesanan kedaluwarsa.");
  });

  it("gagal 500 bila CRON_SECRET belum dikonfigurasi", async () => {
    delete process.env.CRON_SECRET;

    const response = await GET(request("Bearer apa-saja"), context);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.code).toBe("INTERNAL_ERROR");
  });
});
