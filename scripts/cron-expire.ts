import "dotenv/config";

/**
 * Memicu endpoint cron secara manual (untuk self-hosted / lokal).
 * Aplikasi harus sedang berjalan dan CRON_SECRET harus sama dengan server.
 */
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const secret = process.env.CRON_SECRET;

if (!secret) {
  console.error("CRON_SECRET belum diisi.");
  process.exit(1);
}

const response = await fetch(`${baseUrl}/api/cron/expire-bookings`, {
  headers: { authorization: `Bearer ${secret}` },
});

const body = await response.json().catch(() => null);

console.log(JSON.stringify({ status: response.status, body }, null, 2));

process.exit(response.ok ? 0 : 1);
