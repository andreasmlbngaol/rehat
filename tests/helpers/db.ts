import { prisma } from "@/lib/prisma";

export const testDatabaseUrl = process.env.TEST_DATABASE_URL;

/**
 * Integration test hanya dijalankan bila TEST_DATABASE_URL tersedia.
 */
export function hasTestDatabase(): boolean {
  return Boolean(testDatabaseUrl);
}

function databaseName(): string {
  if (!testDatabaseUrl) return "";
  try {
    return new URL(testDatabaseUrl).pathname.replace(/^\/+/, "");
  } catch {
    return "";
  }
}

/**
 * Pengaman: TRUNCATE hanya boleh dijalankan pada database yang jelas-jelas
 * database uji (nama mengandung "test") atau bila ALLOW_TEST_DB_RESET=true.
 */
export function assertSafeTestDatabase(): void {
  if (!testDatabaseUrl) {
    throw new Error("TEST_DATABASE_URL belum diisi.");
  }

  const name = databaseName();

  if (!/test/i.test(name) && process.env.ALLOW_TEST_DB_RESET !== "true") {
    throw new Error(
      `Refusing to reset database "${name}": nama database tidak mengandung "test". ` +
        "Set ALLOW_TEST_DB_RESET=true bila memang yakin.",
    );
  }
}

/**
 * Memastikan skema Prisma sudah diterapkan pada database uji.
 */
export async function ensureTestSchema(): Promise<void> {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    select to_regclass('public.profiles') is not null as exists
  `;

  if (!rows[0]?.exists) {
    throw new Error(
      "Skema database uji belum dibuat. Jalankan:\n" +
        "  DATABASE_URL=$TEST_DATABASE_URL bunx prisma migrate deploy",
    );
  }
}

/**
 * Mengosongkan seluruh tabel aplikasi. Urutan tidak penting karena CASCADE,
 * tetapi daftar dibuat eksplisit agar mudah diaudit.
 */
export async function resetDatabase(): Promise<void> {
  assertSafeTestDatabase();

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE
       zoom_meetings,
       chat_messages,
       counseling_sessions,
       payment_webhook_events,
       payments,
       bookings,
       time_slots,
       counselor_services,
       service_methods,
       services,
       counselor_profiles,
       profiles
     RESTART IDENTITY CASCADE`,
  );
}
