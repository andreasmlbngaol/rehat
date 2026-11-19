import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/auth/redirect";

describe("safeRedirectPath", () => {
  it("mempertahankan path internal", () => {
    expect(safeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath("/dashboard/bookings?status=confirmed#top")).toBe(
      "/dashboard/bookings?status=confirmed#top",
    );
  });

  it("memakai fallback untuk nilai kosong", () => {
    expect(safeRedirectPath(null)).toBe("/dashboard");
    expect(safeRedirectPath(undefined)).toBe("/dashboard");
    expect(safeRedirectPath("")).toBe("/dashboard");
  });

  it("menolak URL eksternal dan protocol-relative", () => {
    expect(safeRedirectPath("https://evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("//evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/dashboard");
  });

  it("menolak backslash yang dinormalisasi browser menjadi slash", () => {
    expect(safeRedirectPath("/\\evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("/\\/evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("/%5Cevil.example")).toBe("/dashboard");
    expect(safeRedirectPath("/%5cevil.example")).toBe("/dashboard");
  });

  it("menolak karakter kontrol", () => {
    expect(safeRedirectPath("/dashboard\nLocation: https://evil.example")).toBe(
      "/dashboard",
    );
    expect(safeRedirectPath("/dashboard\u0000")).toBe("/dashboard");
  });

  it("memakai fallback khusus bila diberikan", () => {
    expect(safeRedirectPath(null, "/reset-password")).toBe("/reset-password");
    expect(safeRedirectPath("//evil.example", "/reset-password")).toBe(
      "/reset-password",
    );
  });
});
