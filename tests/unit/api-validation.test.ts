import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  parseBody,
  parseParam,
  parseQuery,
  readJson,
  toFieldErrors,
} from "@/lib/api/validation";
import { AppError } from "@/lib/api/errors";

describe("toFieldErrors", () => {
  it("mengelompokkan pesan berdasarkan path", () => {
    const schema = z.object({
      email: z.string().email("Email salah"),
      name: z.string().min(2, "Nama pendek"),
    });
    const result = schema.safeParse({ email: "x", name: "A" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toFieldErrors(result.error)).toEqual({
        email: ["Email salah"],
        name: ["Nama pendek"],
      });
    }
  });

  it("memakai '_' untuk issue tanpa path", () => {
    const schema = z.object({ a: z.number() }).refine(() => false, {
      message: "Gagal",
    });
    const result = schema.safeParse({ a: 1 });

    if (!result.success) {
      expect(toFieldErrors(result.error)).toEqual({ _: ["Gagal"] });
    }
  });

  it("menggabungkan beberapa pesan pada field yang sama", () => {
    const schema = z.string().min(5).max(2);
    const result = schema.safeParse("abc");

    if (!result.success) {
      const errors = toFieldErrors(result.error);
      expect(errors._?.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("parseBody", () => {
  const schema = z.object({ name: z.string().min(2) });

  it("mengembalikan data valid", () => {
    expect(parseBody(schema, { name: "Ayu" })).toEqual({ name: "Ayu" });
  });

  it("melempar AppError VALIDATION_ERROR untuk data tidak valid", () => {
    try {
      parseBody(schema, { name: "A" });
      expect.unreachable("harus melempar");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("VALIDATION_ERROR");
      expect((error as AppError).errors?.name).toBeDefined();
    }
  });
});

describe("parseQuery", () => {
  const schema = z.object({
    page: z.coerce.number().int().min(1).default(1),
  });

  it("mengubah URLSearchParams menjadi objek", () => {
    const params = new URLSearchParams("page=3");
    expect(parseQuery(schema, params)).toEqual({ page: 3 });
  });

  it("memakai pesan khusus parameter pencarian", () => {
    try {
      parseQuery(schema, new URLSearchParams("page=0"));
      expect.unreachable("harus melempar");
    } catch (error) {
      expect((error as AppError).message).toBe(
        "Parameter pencarian tidak valid.",
      );
    }
  });
});

describe("parseParam", () => {
  const schema = z.string().uuid();

  it("mengembalikan nilai valid", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(parseParam(schema, id)).toBe(id);
  });

  it("melempar field error dengan nama field kustom", () => {
    try {
      parseParam(schema, "x", "bookingId");
      expect.unreachable("harus melempar");
    } catch (error) {
      expect((error as AppError).errors).toEqual({
        bookingId: ["Format tidak valid."],
      });
    }
  });
});

describe("readJson", () => {
  it("membaca body JSON", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ ok: true }),
      headers: { "content-type": "application/json" },
    });

    await expect(readJson(request)).resolves.toEqual({ ok: true });
  });

  it("melempar AppError untuk body tidak valid", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: "{",
    });

    await expect(readJson(request)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });
});
