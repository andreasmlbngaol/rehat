import { describe, expect, it } from "vitest";
import { homeForRole } from "@/lib/roles";
import { USER_ROLES, isUserRole } from "@/lib/auth/roles";

describe("homeForRole", () => {
  it("mengarahkan setiap peran ke beranda yang tepat", () => {
    expect(homeForRole("admin")).toBe("/admin");
    expect(homeForRole("counselor")).toBe("/counselor");
    expect(homeForRole("patient")).toBe("/dashboard");
  });
});

describe("isUserRole", () => {
  it("menerima peran yang terdaftar", () => {
    for (const role of USER_ROLES) {
      expect(isUserRole(role)).toBe(true);
    }
  });

  it("menolak nilai lain", () => {
    expect(isUserRole("superadmin")).toBe(false);
    expect(isUserRole("")).toBe(false);
    expect(isUserRole(null)).toBe(false);
    expect(isUserRole(1)).toBe(false);
  });
});
