import type {
  BookingStatus,
  CounselingMethod,
  PaymentStatus,
  SessionStatus,
  TimeSlotStatus,
  UserRole,
} from "@/lib/types/api";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

const weekdayFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  timeZone: "Asia/Jakarta",
});

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string | Date): string {
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: string | Date): string {
  return dateTimeFormatter.format(new Date(value));
}

export function formatTime(value: string | Date): string {
  return timeFormatter.format(new Date(value));
}

export function formatWeekday(value: string | Date): string {
  return weekdayFormatter.format(new Date(value));
}

export function formatDateInput(value: string | Date): string {
  const date = new Date(value);
  const offset = 7 * 60 * 60 * 1000;
  return new Date(date.getTime() + offset).toISOString().slice(0, 10);
}

export function formatDateTimeInput(value: string | Date): string {
  const date = new Date(value);
  const offset = 7 * 60 * 60 * 1000;
  return new Date(date.getTime() + offset).toISOString().slice(0, 16);
}

export function todayInput(): string {
  return formatDateInput(new Date());
}

export function addDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending_payment: "Menunggu pembayaran",
  confirmed: "Terkonfirmasi",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Menunggu",
  success: "Berhasil",
  failed: "Gagal",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
};

export const SESSION_STATUS_LABEL: Record<SessionStatus, string> = {
  scheduled: "Terjadwal",
  active: "Berlangsung",
  completed: "Selesai",
};

export const SLOT_STATUS_LABEL: Record<TimeSlotStatus, string> = {
  available: "Tersedia",
  held: "Ditahan",
  booked: "Terisi",
};

export const METHOD_LABEL: Record<CounselingMethod, string> = {
  chat: "Chat",
  zoom: "Zoom",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  patient: "Pasien",
  counselor: "Konselor",
  admin: "Administrator",
};

export function bookingStatusTone(
  status: BookingStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "confirmed":
      return "default";
    case "pending_payment":
      return "secondary";
    case "cancelled":
    case "expired":
      return "destructive";
    default:
      return "outline";
  }
}

export function paymentStatusTone(
  status: PaymentStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "success":
      return "default";
    case "pending":
      return "secondary";
    case "failed":
    case "cancelled":
    case "expired":
      return "destructive";
    default:
      return "outline";
  }
}

export function sessionStatusTone(
  status: SessionStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default";
    case "scheduled":
      return "secondary";
    case "completed":
      return "outline";
    default:
      return "outline";
  }
}
