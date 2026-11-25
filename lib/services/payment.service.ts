import "server-only";
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/api/errors";
import { createSnapTransaction } from "@/lib/integrations/midtrans";
import { expireStaleBookings } from "@/lib/services/booking.service";

export type PaymentAttemptDto = {
  paymentId: string;
  midtransOrderId: string;
  snapToken: string;
  redirectUrl: string | null;
  grossAmount: number;
  expiresAt: string | null;
};

export async function createOrResumePayment(input: {
  bookingId: string;
  patientId: string;
}): Promise<PaymentAttemptDto> {
  await expireStaleBookings();

  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`select pg_advisory_xact_lock(hashtext(${`payment:${input.bookingId}`}))::text as locked`;

      const booking = await tx.booking.findUnique({
        where: { id: input.bookingId },
        include: {
          patient: { select: { fullName: true, email: true } },
          payments: { orderBy: { createdAt: "desc" } },
        },
      });

      if (!booking || booking.patientId !== input.patientId) {
        throw errors.notFound("Pemesanan tidak ditemukan.");
      }

      if (booking.status === "confirmed") {
        throw errors.paymentAlreadySuccess();
      }

      if (booking.status !== "pending_payment") {
        throw errors.bookingNotPayable();
      }

      const now = new Date();

      if (!booking.paymentExpiresAt || booking.paymentExpiresAt <= now) {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: "expired" },
        });

        await tx.timeSlot.updateMany({
          where: { id: booking.timeSlotId, status: "held" },
          data: { status: "available" },
        });

        throw errors.bookingNotPayable("Batas waktu pembayaran sudah lewat.");
      }

      const active = booking.payments.find(
        (payment) =>
          payment.status === "pending" &&
          payment.snapToken &&
          payment.expiresAt &&
          payment.expiresAt > now,
      );

      if (active) {
        return {
          paymentId: active.id,
          midtransOrderId: active.midtransOrderId,
          snapToken: active.snapToken!,
          redirectUrl: null,
          grossAmount: Number(active.grossAmount),
          expiresAt: active.expiresAt?.toISOString() ?? null,
        };
      }

      await tx.payment.updateMany({
        where: { bookingId: booking.id, status: "pending" },
        data: { status: "expired" },
      });

      const attempt = booking.payments.length + 1;
      const midtransOrderId = `${booking.bookingCode}-${attempt}`;
      const grossAmount = Number(booking.price);

      const snap = await createSnapTransaction({
        orderId: midtransOrderId,
        grossAmount,
        customer: {
          firstName: booking.patient.fullName,
          email: booking.patient.email,
        },
        itemName: booking.serviceName,
        expiresAt: booking.paymentExpiresAt,
      });

      const payment = await tx.payment.create({
        data: {
          bookingId: booking.id,
          midtransOrderId,
          snapToken: snap.token,
          grossAmount: booking.price,
          status: "pending",
          expiresAt: booking.paymentExpiresAt,
        },
      });

      return {
        paymentId: payment.id,
        midtransOrderId,
        snapToken: snap.token,
        redirectUrl: snap.redirect_url,
        grossAmount,
        expiresAt: booking.paymentExpiresAt.toISOString(),
      };
    },
    { timeout: 25_000 },
  );
}

export async function listPaymentsForBooking(input: {
  bookingId: string;
  patientId: string;
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    select: { id: true, patientId: true },
  });

  if (!booking || booking.patientId !== input.patientId) {
    throw errors.notFound("Pemesanan tidak ditemukan.");
  }

  return prisma.payment.findMany({
    where: { bookingId: input.bookingId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listPaymentsForPatient(input: {
  patientId: string;
  page: number;
  limit: number;
}) {
  const where = { booking: { patientId: input.patientId } };

  const [items, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      include: {
        booking: {
          select: {
            id: true,
            bookingCode: true,
            serviceName: true,
            scheduledStart: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.payment.count({ where }),
  ]);

  return { items, total };
}
