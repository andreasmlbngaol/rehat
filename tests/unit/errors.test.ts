import { describe, expect, it } from "vitest";
import {
  AppError,
  ERROR_STATUS,
  errors,
  isAppError,
  type ErrorCode,
} from "@/lib/api/errors";

describe("ERROR_STATUS", () => {
  it("memetakan setiap kode ke status HTTP yang benar", () => {
    const expected: Record<ErrorCode, number> = {
      VALIDATION_ERROR: 422,
      UNAUTHENTICATED: 401,
      EMAIL_NOT_VERIFIED: 403,
      ACCOUNT_INACTIVE: 403,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      CONFLICT: 409,
      SLOT_UNAVAILABLE: 409,
      BOOKING_NOT_PAYABLE: 409,
      PAYMENT_ALREADY_SUCCESS: 409,
      SESSION_NOT_ACTIVE: 409,
      RATE_LIMITED: 429,
      EXTERNAL_SERVICE_ERROR: 502,
      INTERNAL_ERROR: 500,
    };

    expect(ERROR_STATUS).toEqual(expected);
  });
});

describe("AppError", () => {
  it("menyimpan code, status, dan field errors", () => {
    const error = new AppError("VALIDATION_ERROR", "Tidak valid", {
      errors: { email: ["Format salah"] },
    });

    expect(error.name).toBe("AppError");
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.status).toBe(422);
    expect(error.message).toBe("Tidak valid");
    expect(error.errors).toEqual({ email: ["Format salah"] });
  });

  it("errors bernilai null bila tidak diberikan", () => {
    expect(errors.notFound().errors).toBeNull();
  });

  it("meneruskan cause", () => {
    const cause = new Error("penyebab");
    const error = new AppError("INTERNAL_ERROR", "Gagal", { cause });
    expect(error.cause).toBe(cause);
  });
});

describe("errors factory", () => {
  it("membuat setiap kode dengan status yang sesuai", () => {
    expect(errors.validation({}).code).toBe("VALIDATION_ERROR");
    expect(errors.unauthenticated().status).toBe(401);
    expect(errors.emailNotVerified().status).toBe(403);
    expect(errors.accountInactive().status).toBe(403);
    expect(errors.forbidden().status).toBe(403);
    expect(errors.notFound().status).toBe(404);
    expect(errors.conflict().status).toBe(409);
    expect(errors.slotUnavailable().status).toBe(409);
    expect(errors.bookingNotPayable().status).toBe(409);
    expect(errors.paymentAlreadySuccess().status).toBe(409);
    expect(errors.sessionNotActive().status).toBe(409);
    expect(errors.rateLimited().status).toBe(429);
    expect(errors.external().status).toBe(502);
    expect(errors.internal().status).toBe(500);
  });

  it("memakai pesan kustom bila diberikan", () => {
    expect(errors.notFound("Booking hilang").message).toBe("Booking hilang");
  });

  it("menyertakan field errors pada validasi", () => {
    const error = errors.validation({ name: ["Wajib diisi"] });
    expect(error.errors).toEqual({ name: ["Wajib diisi"] });
  });
});

describe("isAppError", () => {
  it("true hanya untuk AppError", () => {
    expect(isAppError(errors.notFound())).toBe(true);
    expect(isAppError(new Error("biasa"))).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError({ code: "NOT_FOUND" })).toBe(false);
  });
});
