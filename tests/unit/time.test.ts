import { describe, expect, it } from "vitest";
import {
  addMinutes,
  endOfWIBDay,
  formatTanggalIndonesia,
  isPast,
  isWithin,
  startOfWIBDay,
  toWIBISOString,
} from "@/lib/time";

describe("addMinutes", () => {
  it("menambah menit", () => {
    const result = addMinutes(new Date("2026-01-01T00:00:00.000Z"), 90);
    expect(result.toISOString()).toBe("2026-01-01T01:30:00.000Z");
  });

  it("mendukung nilai negatif", () => {
    const result = addMinutes(new Date("2026-01-01T01:30:00.000Z"), -30);
    expect(result.toISOString()).toBe("2026-01-01T01:00:00.000Z");
  });
});

describe("isPast", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");

  it("true untuk waktu lampau", () => {
    expect(isPast(new Date("2025-12-31T23:59:59.000Z"), now)).toBe(true);
  });

  it("true untuk waktu yang sama (inklusif)", () => {
    expect(isPast(now, now)).toBe(true);
  });

  it("false untuk waktu mendatang", () => {
    expect(isPast(new Date("2026-01-01T00:00:01.000Z"), now)).toBe(false);
  });
});

describe("isWithin", () => {
  const start = new Date("2026-01-01T09:00:00.000Z");
  const end = new Date("2026-01-01T10:00:00.000Z");

  it("true pada batas awal dan akhir", () => {
    expect(isWithin(start, start, end)).toBe(true);
    expect(isWithin(end, start, end)).toBe(true);
  });

  it("true di dalam rentang", () => {
    expect(isWithin(new Date("2026-01-01T09:30:00.000Z"), start, end)).toBe(
      true,
    );
  });

  it("false di luar rentang", () => {
    expect(isWithin(new Date("2026-01-01T08:59:59.000Z"), start, end)).toBe(
      false,
    );
    expect(isWithin(new Date("2026-01-01T10:00:01.000Z"), start, end)).toBe(
      false,
    );
  });
});

describe("zona waktu WIB", () => {
  it("toWIBISOString mengubah UTC ke offset +07:00", () => {
    expect(toWIBISOString(new Date("2026-01-15T03:04:05.000Z"))).toBe(
      "2026-01-15T10:04:05+07:00",
    );
  });

  it("startOfWIBDay memakai tengah malam WIB, bukan UTC", () => {
    // 20:00Z = 03:00 WIB tanggal 16 Januari.
    const start = startOfWIBDay(new Date("2026-01-15T20:00:00.000Z"));
    expect(start.toISOString()).toBe("2026-01-15T17:00:00.000Z");
  });

  it("endOfWIBDay memakai 23:59:59.999 WIB", () => {
    const end = endOfWIBDay(new Date("2026-01-15T03:00:00.000Z"));
    expect(end.toISOString()).toBe("2026-01-15T16:59:59.999Z");
  });

  it("formatTanggalIndonesia menampilkan tanggal Indonesia", () => {
    const value = formatTanggalIndonesia(
      new Date("2026-01-15T03:00:00.000Z"),
    );
    expect(value).toContain("Januari");
    expect(value).toContain("2026");
  });
});
