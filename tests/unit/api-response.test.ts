import { describe, expect, it, vi } from "vitest";
import { fail, handleError, ok } from "@/lib/api/response";
import { errors } from "@/lib/api/errors";

const captureExceptionMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/monitoring/server", () => ({
  captureException: captureExceptionMock,
}));

describe("ok", () => {
  it("membungkus data dalam envelope sukses", async () => {
    const response = ok({ id: "1" }, "Berhasil");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: { id: "1" },
      message: "Berhasil",
      errors: null,
      code: null,
    });
  });

  it("mendukung status kustom", () => {
    expect(ok(null, "Diterima", 202).status).toBe(202);
  });

  it("message default null", async () => {
    const body = await ok(1).json();
    expect(body.message).toBeNull();
  });
});

describe("fail", () => {
  it("membungkus AppError dalam envelope gagal", async () => {
    const response = fail(errors.validation({ email: ["Salah"] }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toEqual({
      success: false,
      data: null,
      message: "Data yang dikirim tidak valid.",
      errors: { email: ["Salah"] },
      code: "VALIDATION_ERROR",
    });
  });
});

describe("handleError", () => {
  it("mengembalikan AppError apa adanya tanpa capture", async () => {
    captureExceptionMock.mockClear();

    const response = handleError(errors.notFound("Hilang"), {
      requestId: "req-1",
      path: "/api/test",
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.code).toBe("NOT_FOUND");
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("memetakan error tak dikenal ke 500 dan melaporkannya", async () => {
    captureExceptionMock.mockClear();

    const response = handleError(new Error("boom"), {
      requestId: "req-2",
      path: "/api/test",
      userId: "u1",
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.code).toBe("INTERNAL_ERROR");
    expect(body.message).toBe("Terjadi kesalahan pada server.");
    expect(captureExceptionMock).toHaveBeenCalledOnce();
    expect(captureExceptionMock.mock.calls[0]![1]).toMatchObject({
      requestId: "req-2",
      path: "/api/test",
      userId: "u1",
    });
  });
});
