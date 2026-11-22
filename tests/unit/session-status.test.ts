import { describe, expect, it } from "vitest";
import { effectiveStatus } from "@/lib/services/session.service";

const start = new Date("2026-01-15T09:00:00.000Z");
const end = new Date("2026-01-15T10:00:00.000Z");

describe("effectiveStatus", () => {
  it("scheduled sebelum waktu mulai", () => {
    expect(
      effectiveStatus("scheduled", start, end, new Date("2026-01-15T08:59:59Z")),
    ).toBe("scheduled");
  });

  it("active tepat pada waktu mulai", () => {
    expect(effectiveStatus("scheduled", start, end, start)).toBe("active");
  });

  it("active di tengah sesi", () => {
    expect(
      effectiveStatus("active", start, end, new Date("2026-01-15T09:30:00Z")),
    ).toBe("active");
  });

  it("completed tepat pada waktu selesai", () => {
    expect(effectiveStatus("active", start, end, end)).toBe("completed");
  });

  it("completed setelah waktu selesai", () => {
    expect(
      effectiveStatus("scheduled", start, end, new Date("2026-01-15T10:00:01Z")),
    ).toBe("completed");
  });

  it("status completed tidak kembali menjadi scheduled", () => {
    expect(
      effectiveStatus("completed", start, end, new Date("2026-01-15T08:00:00Z")),
    ).toBe("completed");
  });
});
