import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  apiFetch,
  errorMessage,
  fieldError,
} from "@/lib/api/client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function success<T>(data: T): unknown {
  return { success: true, data, message: null, errors: null, code: null };
}

function failure(input: {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}): unknown {
  return {
    success: false,
    data: null,
    message: input.message,
    errors: input.errors ?? null,
    code: input.code ?? null,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("apiFetch", () => {
  it("mengembalikan data dari envelope sukses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(success({ id: "u1" })));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/api/v1/profile")).resolves.toEqual({ id: "u1" });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [path, init] = fetchMock.mock.calls[0]!;
    expect(path).toBe("/api/v1/profile");
    expect(init).toMatchObject({ credentials: "include", cache: "no-store" });
  });

  it("mengirim body JSON beserta Content-Type", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(success(null)));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/v1/bookings", { method: "POST", body: { slotId: "s1" } });

    const [, init] = fetchMock.mock.calls[0]!;
    const headers = init.headers as Headers;
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ slotId: "s1" }));
  });

  it("tidak menimpa Content-Type saat memakai FormData", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(success(null)));
    vi.stubGlobal("fetch", fetchMock);
    const formData = new FormData();
    formData.append("file", new Blob(["x"]), "avatar.png");

    await apiFetch("/api/v1/profile/avatar", { method: "PUT", formData });

    const [, init] = fetchMock.mock.calls[0]!;
    const headers = init.headers as Headers;
    expect(headers.has("Content-Type")).toBe(false);
    expect(init.body).toBe(formData);
  });

  it("melempar ApiError berisi status, kode, dan field errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          failure({
            message: "Data yang dikirim tidak valid.",
            code: "VALIDATION_ERROR",
            errors: { email: ["Email wajib diisi."] },
          }),
          422,
        ),
      ),
    );

    const error = await apiFetch("/api/v1/auth/signup", {
      method: "POST",
      body: {},
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      name: "ApiError",
      status: 422,
      code: "VALIDATION_ERROR",
      message: "Data yang dikirim tidak valid.",
      fieldErrors: { email: ["Email wajib diisi."] },
    });
  });

  it("memakai pesan generik bila respons bukan JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("<html>bad gateway</html>", { status: 502 })),
    );

    await expect(apiFetch("/api/v1/services")).rejects.toMatchObject({
      status: 502,
      code: null,
      message: "Terjadi kesalahan. Coba lagi beberapa saat lagi.",
    });
  });

  it("memakai pesan generik bila envelope sukses tetapi data kosong", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ success: false, data: null })),
    );

    await expect(apiFetch("/api/v1/services")).rejects.toMatchObject({
      status: 200,
      message: "Terjadi kesalahan. Coba lagi beberapa saat lagi.",
    });
  });
});

describe("errorMessage", () => {
  it("memakai pesan ApiError", () => {
    const error = new ApiError("Slot sudah dipesan.", { status: 409 });
    expect(errorMessage(error)).toBe("Slot sudah dipesan.");
  });

  it("memakai pesan Error biasa", () => {
    expect(errorMessage(new Error("jaringan putus"))).toBe("jaringan putus");
  });

  it("memakai pesan generik untuk nilai yang tidak dikenal", () => {
    expect(errorMessage("boom")).toBe(
      "Terjadi kesalahan. Coba lagi beberapa saat lagi.",
    );
    expect(errorMessage(undefined)).toBe(
      "Terjadi kesalahan. Coba lagi beberapa saat lagi.",
    );
  });
});

describe("fieldError", () => {
  it("mengembalikan pesan pertama untuk field yang diminta", () => {
    const error = new ApiError("Tidak valid.", {
      status: 422,
      fieldErrors: { email: ["Email wajib diisi.", "Email tidak valid."] },
    });

    expect(fieldError(error, "email")).toBe("Email wajib diisi.");
  });

  it("mengembalikan undefined untuk field atau error lain", () => {
    const error = new ApiError("Tidak valid.", {
      status: 422,
      fieldErrors: { email: ["Email wajib diisi."] },
    });

    expect(fieldError(error, "password")).toBeUndefined();
    expect(fieldError(new Error("lain"), "email")).toBeUndefined();
  });
});
