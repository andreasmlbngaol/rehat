import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { errors } from "@/lib/api/errors";
import type { AuthUser } from "@/lib/auth/dal";

const { getUserMock } = vi.hoisted(() => ({ getUserMock: vi.fn() }));

vi.mock("@/lib/auth/dal", () => ({ getUser: getUserMock }));
vi.mock("@/lib/logger", () => ({
  log: vi.fn(),
  logError: vi.fn(),
  logRequest: vi.fn(),
}));

function request(
  path = "/api/v1/test",
  init: { method?: string; headers?: Record<string, string> } = {},
): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: init.method ?? "GET",
    headers: init.headers,
  });
}

function user(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "user-1",
    email: "user@example.com",
    role: "patient",
    isActive: true,
    emailConfirmed: true,
    fullName: "Pengguna Uji",
    avatarKey: null,
    ...overrides,
  };
}

const context = { params: Promise.resolve({}) };

beforeEach(() => {
  getUserMock.mockReset();
});

describe("apiRoute", () => {
  it("mengembalikan envelope sukses dan meneruskan x-request-id", async () => {
    const handler = apiRoute({}, async ({ user }) => {
      return Response.json({ success: true, data: { user: user?.id ?? null } });
    });

    const response = await handler(
      request("/api/v1/test", { headers: { "x-request-id": "req-123" } }),
      context,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("req-123");
    expect(body.data.user).toBeNull();
  });

  it("membuat x-request-id bila tidak dikirim klien", async () => {
    const handler = apiRoute({}, async () => Response.json({ success: true }));

    const response = await handler(request(), context);

    expect(response.headers.get("x-request-id")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("mengembalikan 401 bila autentikasi wajib tetapi tidak ada user", async () => {
    getUserMock.mockResolvedValue(null);

    const handler = apiRoute({ auth: "required" }, async () =>
      Response.json({ success: true }),
    );

    const response = await handler(request(), context);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      success: false,
      data: null,
      code: "UNAUTHENTICATED",
    });
  });

  it("mengizinkan akses opsional tanpa user", async () => {
    getUserMock.mockResolvedValue(null);

    const handler = apiRoute({ auth: "optional" }, async ({ user }) =>
      Response.json({ success: true, data: { user } }),
    );

    const response = await handler(request(), context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.user).toBeNull();
  });

  it("mengembalikan 403 bila peran tidak cocok", async () => {
    getUserMock.mockResolvedValue(user({ role: "patient" }));

    const handler = apiRoute({ auth: "required", roles: ["admin"] }, async () =>
      Response.json({ success: true }),
    );

    const response = await handler(request(), context);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.code).toBe("FORBIDDEN");
  });

  it("menolak user yang emailnya belum terverifikasi", async () => {
    getUserMock.mockResolvedValue(user({ emailConfirmed: false }));

    const handler = apiRoute({ auth: "required" }, async () =>
      Response.json({ success: true }),
    );

    const response = await handler(request(), context);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("menolak akun tidak aktif", async () => {
    getUserMock.mockResolvedValue(user({ isActive: false }));

    const handler = apiRoute({ auth: "required" }, async () =>
      Response.json({ success: true }),
    );

    const response = await handler(request(), context);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.code).toBe("ACCOUNT_INACTIVE");
  });

  it("menerapkan rate limit dan mengirim Retry-After", async () => {
    const handler = apiRoute(
      { rateLimit: { limit: 1, windowMs: 60_000 } },
      async () => Response.json({ success: true }),
    );

    const ip = { "x-forwarded-for": `203.0.113.${Math.floor(Math.random() * 250) + 1}` };
    const path = `/api/v1/rate-${Math.random()}`;

    const first = await handler(request(path, { headers: ip }), context);
    const second = await handler(request(path, { headers: ip }), context);
    const body = await second.json();

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    expect(second.headers.get("Retry-After")).toBeTruthy();
    expect(body.code).toBe("RATE_LIMITED");
  });

  it("memetakan AppError yang dilempar handler", async () => {
    const handler = apiRoute({}, async () => {
      throw errors.slotUnavailable();
    });

    const response = await handler(request(), context);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.code).toBe("SLOT_UNAVAILABLE");
  });

  it("memetakan error tak dikenal ke 500", async () => {
    const handler = apiRoute({}, async () => {
      throw new Error("boom");
    });

    const response = await handler(request(), context);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.code).toBe("INTERNAL_ERROR");
    expect(body.message).toBe("Terjadi kesalahan pada server.");
  });

  it("menunggu params async sebelum handler dijalankan", async () => {
    const handler = apiRoute<{ id: string }>({}, async ({ params }) =>
      Response.json({ success: true, data: params }),
    );

    const response = await handler(request(), {
      params: Promise.resolve({ id: "abc" }),
    });
    const body = await response.json();

    expect(body.data).toEqual({ id: "abc" });
  });
});
