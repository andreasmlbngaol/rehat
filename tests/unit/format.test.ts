import { describe, expect, it } from "vitest";
import {
  BOOKING_STATUS_LABEL,
  METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  ROLE_LABEL,
  SESSION_STATUS_LABEL,
  SLOT_STATUS_LABEL,
  addDays,
  bookingStatusTone,
  formatDate,
  formatDateInput,
  formatDateTime,
  formatDateTimeInput,
  formatRupiah,
  formatTime,
  formatWeekday,
  initials,
  paymentStatusTone,
  sessionStatusTone,
  todayInput,
} from "@/lib/format";

describe("formatRupiah", () => {
  it("memformat angka tanpa desimal", () => {
    expect(formatRupiah(150_000)).toMatch(/Rp\s?150\.000/);
  });

  it("memformat nol", () => {
    expect(formatRupiah(0)).toMatch(/Rp\s?0/);
  });

  it("membulatkan pecahan", () => {
    expect(formatRupiah(150_000.75)).not.toContain(",75");
  });
});

describe("format tanggal dan waktu (Asia/Jakarta)", () => {
  const iso = "2026-01-15T03:00:00.000Z"; // 10:00 WIB, Kamis

  it("formatDate memakai bulan panjang", () => {
    expect(formatDate(iso)).toBe("15 Januari 2026");
  });

  it("formatDateTime menampilkan tanggal dan jam WIB", () => {
    const value = formatDateTime(iso);
    expect(value).toContain("15 Jan 2026");
    expect(value).toContain("10.00");
  });

  it("formatTime hanya menampilkan jam WIB", () => {
    expect(formatTime(iso)).toBe("10.00");
  });

  it("formatWeekday menampilkan nama hari", () => {
    expect(formatWeekday(iso)).toBe("Kamis");
  });

  it("menerima objek Date", () => {
    expect(formatDate(new Date(iso))).toBe("15 Januari 2026");
  });
});

describe("format input datetime-local", () => {
  it("formatDateInput menghasilkan YYYY-MM-DD menurut WIB", () => {
    expect(formatDateInput("2026-01-15T20:00:00.000Z")).toBe("2026-01-16");
  });

  it("formatDateTimeInput menghasilkan YYYY-MM-DDTHH:mm menurut WIB", () => {
    expect(formatDateTimeInput("2026-01-15T03:04:00.000Z")).toBe(
      "2026-01-15T10:04",
    );
  });

  it("todayInput berformat YYYY-MM-DD", () => {
    expect(todayInput()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("addDays", () => {
  it("menambah hari tanpa memutasi objek asli", () => {
    const original = new Date("2026-01-15T03:00:00.000Z");
    const next = addDays(original, 3);

    expect(next.toISOString()).toBe("2026-01-18T03:00:00.000Z");
    expect(original.toISOString()).toBe("2026-01-15T03:00:00.000Z");
  });

  it("mendukung nilai negatif", () => {
    const next = addDays(new Date("2026-01-15T03:00:00.000Z"), -1);
    expect(next.toISOString()).toBe("2026-01-14T03:00:00.000Z");
  });
});

describe("initials", () => {
  it("mengambil maksimal dua inisial", () => {
    expect(initials("Ayu Prameswari")).toBe("AP");
    expect(initials("Bima Ardiansyah Putra")).toBe("BA");
  });

  it("menangani satu kata", () => {
    expect(initials("Rehat")).toBe("R");
  });

  it("menangani spasi berlebih", () => {
    expect(initials("  ayu   prameswari  ")).toBe("AP");
  });

  it("mengembalikan string kosong untuk input kosong", () => {
    expect(initials("   ")).toBe("");
  });
});

describe("label dan tone status", () => {
  it("label status pemesanan lengkap", () => {
    expect(BOOKING_STATUS_LABEL).toEqual({
      pending_payment: "Menunggu pembayaran",
      confirmed: "Terkonfirmasi",
      cancelled: "Dibatalkan",
      expired: "Kedaluwarsa",
    });
  });

  it("label status pembayaran lengkap", () => {
    expect(Object.keys(PAYMENT_STATUS_LABEL)).toEqual([
      "pending",
      "success",
      "failed",
      "cancelled",
      "expired",
    ]);
  });

  it("label sesi, slot, metode, dan peran", () => {
    expect(SESSION_STATUS_LABEL.active).toBe("Berlangsung");
    expect(SLOT_STATUS_LABEL.held).toBe("Ditahan");
    expect(METHOD_LABEL.zoom).toBe("Zoom");
    expect(ROLE_LABEL.admin).toBe("Administrator");
  });

  it("tone pemesanan sesuai status", () => {
    expect(bookingStatusTone("confirmed")).toBe("default");
    expect(bookingStatusTone("pending_payment")).toBe("secondary");
    expect(bookingStatusTone("cancelled")).toBe("destructive");
    expect(bookingStatusTone("expired")).toBe("destructive");
  });

  it("tone pembayaran sesuai status", () => {
    expect(paymentStatusTone("success")).toBe("default");
    expect(paymentStatusTone("pending")).toBe("secondary");
    expect(paymentStatusTone("failed")).toBe("destructive");
    expect(paymentStatusTone("cancelled")).toBe("destructive");
    expect(paymentStatusTone("expired")).toBe("destructive");
  });

  it("tone sesi sesuai status", () => {
    expect(sessionStatusTone("active")).toBe("default");
    expect(sessionStatusTone("scheduled")).toBe("secondary");
    expect(sessionStatusTone("completed")).toBe("outline");
  });
});
