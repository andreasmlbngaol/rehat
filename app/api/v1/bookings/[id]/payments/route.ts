import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseParam } from "@/lib/api/validation";
import { uuidSchema } from "@/lib/validation/common";
import {
  createOrResumePayment,
  listPaymentsForBooking,
} from "@/lib/services/payment.service";
import { toPaymentDto } from "@/lib/dto/payment";

export const POST = apiRoute<{ id: string }>(
  {
    auth: "required",
    roles: ["patient"],
    rateLimit: { limit: 10, windowMs: 60_000 },
  },
  async ({ params, user }) => {
    const bookingId = parseParam(uuidSchema, params.id);

    const attempt = await createOrResumePayment({
      bookingId,
      patientId: user!.id,
    });

    return ok(
      attempt,
      attempt.redirectUrl
        ? "Transaksi pembayaran berhasil dibuat."
        : "Melanjutkan transaksi pembayaran yang masih berlaku.",
      201,
    );
  },
);

export const GET = apiRoute<{ id: string }>(
  { auth: "required", roles: ["patient"] },
  async ({ params, user }) => {
    const bookingId = parseParam(uuidSchema, params.id);
    const payments = await listPaymentsForBooking({
      bookingId,
      patientId: user!.id,
    });

    return ok(
      payments.map((payment) =>
        toPaymentDto(payment, { includeSnapToken: true }),
      ),
    );
  },
);
