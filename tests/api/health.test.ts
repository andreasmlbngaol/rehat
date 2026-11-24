import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { queryRawMock } = vi.hoisted(() => ({ queryRawMock: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: { $queryRaw: queryRawMock },
}));
vi.mock("@/lib/logger", () => ({
  log: vi.fn(),
  logError: vi.fn(),
  logRequest: vi.fn(),
}));

import { GET as live } from "@/app/api/v1/health/live/route";
import { GET as ready } from "@/app/api/v1/health/ready/route";
import { GET as health } from "@/app/api/v1/health/route";

const context = { params: Promise.resolve({}) };

function request(path: string): NextRequest {
  return new NextRequest(`http://localhost${path}`);
}

beforeEach(() => {
  queryRawMock.mockReset();
});

describe("GET /api/v1/health/live", () => {
  it("mengembalikan status ok tanpa menyentuh database", async () => {
    const response = await live(request("/api/v1/health/live"), context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("ok");
    expect(typeof body.data.timestamp).toBe("string");
    expect(queryRawMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/v1/health/ready", () => {
  it("mengembalikan ready bila database dapat dijangkau", async () => {
    queryRawMock.mockResolvedValue([{ "?column?": 1 }]);

    const response = await ready(request("/api/v1/health/ready"), context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({
      status: "ready",
      database: "ok",
    });
    expect(typeof body.data.latencyMs).toBe("number");
    expect(queryRawMock).toHaveBeenCalledOnce();
  });

  it("mengembalikan 503 bila database gagal", async () => {
    queryRawMock.mockRejectedValue(new Error("connection refused"));

    const response = await ready(request("/api/v1/health/ready"), context);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      status: "not_ready",
      database: "error",
    });
    expect(body.message).toBe("Database tidak dapat dijangkau.");
  });
});

describe("GET /api/v1/health", () => {
  it("mengembalikan status integrasi", async () => {
    queryRawMock.mockResolvedValue([{ "?column?": 1 }]);

    const response = await health(request("/api/v1/health"), context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveProperty("integrations");
    expect(body.data.integrations).toMatchObject({
      supabase: expect.any(Boolean),
      midtrans: expect.any(Boolean),
      zoom: expect.any(Boolean),
      resend: expect.any(Boolean),
      r2: expect.any(Boolean),
    });
  });
});
