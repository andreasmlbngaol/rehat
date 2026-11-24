import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { logMock } = vi.hoisted(() => ({ logMock: vi.fn() }));

vi.mock("@/lib/logger", () => ({
  log: logMock,
  logError: vi.fn(),
  logRequest: vi.fn(),
}));

import { POST } from "@/app/api/v1/client-errors/route";

const context = { params: Promise.resolve({}) };

function request(body: string, ip = "198.51.100.10"): NextRequest {
  return new NextRequest("http://localhost/api/v1/client-errors", {
    method: "POST",
    body,
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
  });
}

beforeEach(() => {
  logMock.mockClear();
});

describe("POST /api/v1/client-errors", () => {
  it("menerima laporan valid dan mengembalikan 202", async () => {
    const response = await POST(
      request(
        JSON.stringify({
          message: "TypeError: x is undefined",
          stack: "at foo (app.js:1)",
          digest: "abc123",
          url: "http://localhost/dashboard",
          context: { route: "/dashboard" },
        }),
        "198.51.100.11",
      ),
      context,
    );
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toMatchObject({
      success: true,
      data: null,
      message: "Laporan diterima.",
    });
    expect(logMock).toHaveBeenCalledWith(
      "error",
      "client_error",
      expect.objectContaining({
        message: "TypeError: x is undefined",
        digest: "abc123",
      }),
    );
  });

  it("menolak body tanpa message", async () => {
    const response = await POST(
      request(JSON.stringify({ stack: "x" }), "198.51.100.12"),
      context,
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.success).toBe(false);
    expect(body.errors).toHaveProperty("message");
  });

  it("menolak JSON yang tidak valid", async () => {
    const response = await POST(
      request("{bukan json", "198.51.100.13"),
      context,
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.errors._).toContain("Body harus berupa JSON yang valid.");
  });

  it("menolak pesan yang terlalu panjang", async () => {
    const response = await POST(
      request(
        JSON.stringify({ message: "x".repeat(2001) }),
        "198.51.100.14",
      ),
      context,
    );

    expect(response.status).toBe(422);
  });
});
