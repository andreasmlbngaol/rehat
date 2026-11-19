import { timingSafeEqual } from "node:crypto";
import { apiRoute } from "@/lib/api/handler";
import { errors } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { expireStaleBookings } from "@/lib/services/booking.service";

function isAuthorized(header: string | null, secret: string): boolean {
  if (!header) return false;

  const provided = Buffer.from(header);
  const expected = Buffer.from(`Bearer ${secret}`);

  return (
    provided.length === expected.length && timingSafeEqual(provided, expected)
  );
}

/**
 * Cron: melepas slot dari pemesanan yang melewati batas pembayaran.
 *
 * Dilindungi `Authorization: Bearer <CRON_SECRET>` (format yang dikirim
 * Vercel Cron). Endpoint ini idempoten dan aman dipanggil berulang.
 */
export const GET = apiRoute({ auth: "none" }, async ({ request }) => {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    throw errors.internal("CRON_SECRET belum dikonfigurasi.");
  }

  if (!isAuthorized(request.headers.get("authorization"), secret)) {
    throw errors.unauthenticated("Token cron tidak valid.");
  }

  const expired = await expireStaleBookings();

  return ok(
    { expired },
    expired > 0
      ? `${expired} pemesanan kedaluwarsa diproses.`
      : "Tidak ada pemesanan kedaluwarsa.",
  );
});
