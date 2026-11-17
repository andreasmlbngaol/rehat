export const WIB_TIME_ZONE = "Asia/Jakarta";

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function isPast(date: Date, now: Date = new Date()): boolean {
  return date.getTime() <= now.getTime();
}

export function isWithin(date: Date, start: Date, end: Date): boolean {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

export function formatTanggalIndonesia(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB_TIME_ZONE,
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export function toWIBISOString(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: WIB_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";

  return `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:${value("minute")}:${value("second")}+07:00`;
}

export function startOfWIBDay(date: Date): Date {
  const iso = toWIBISOString(date);
  const day = iso.slice(0, 10);
  return new Date(`${day}T00:00:00+07:00`);
}

export function endOfWIBDay(date: Date): Date {
  const iso = toWIBISOString(date);
  const day = iso.slice(0, 10);
  return new Date(`${day}T23:59:59.999+07:00`);
}
