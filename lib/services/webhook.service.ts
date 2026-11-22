import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { Prisma } from "@/lib/generated/prisma/client";
import type { BookingStatus, PaymentStatus } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { serverEnv } from "@/lib/env";
import { getMidtransTransactionStatus } from "@/lib/integrations/midtrans";

export type MidtransNotification = {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key?: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  transaction_id?: string;
  transaction_time?: string;
  expiry_time?: string;
};

export function verifyMidtransSignature(
  notification: MidtransNotification,
): boolean {
  const expected = createHash("sha512")
    .update(
      `${notification.order_id}${notification.status_code}${notification.gross_amount}${serverEnv().MIDTRANS_SERVER_KEY}`,
    )
    .digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(notification.signature_key ?? "");

  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  );
}

function mapStatus(notification: MidtransNotification): {
  payment: PaymentStatus;
  booking: BookingStatus | null;
  releaseSlot: boolean;
} {
  const status = notification.transaction_status;
  const fraud = notification.fraud_status;

  if (status === "capture") {
    if (fraud === "challenge") {
      return { payment: "pending", booking: null, releaseSlot: false };
    }
    if (fraud === "deny") {
      return { payment: "failed", booking: "expired", releaseSlot: true };
    }
    return { payment: "success", booking: "confirmed", releaseSlot: false };
  }

  if (status === "settlement") {
    return { payment: "success", booking: "confirmed", releaseSlot: false };
  }

  if (status === "pending" || status === "authorize") {
    return { payment: "pending", booking: null, releaseSlot: false };
  }

  if (status === "deny" || status === "failure") {
    return { payment: "failed", booking: "expired", releaseSlot: true };
  }

  if (status === "cancel") {
    return { payment: "cancelled", booking: "cancelled", releaseSlot: true };
  }

  if (status === "expire") {
    return { payment: "expired", booking: "expired", releaseSlot: true };
  }

  return { payment: "pending", booking: null, releaseSlot: false };
}

function parseMidtransDate(value: string | undefined): Date | null {
  if (!value) return null;

  const normalized = value.trim().replace(" ", "T");
  const date = new Date(`${normalized}+07:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

async function resolveViaStatusApi(
  notification: MidtransNotification,
): Promise<MidtransNotification | null> {
  const status = await getMidtransTransactionStatus(notification.order_id);
  if (!status) return null;

  return {
    ...notification,
    status_code: status.status_code,
    gross_amount: status.gross_amount,
    transaction_status: status.transaction_status,
    fraud_status: status.fraud_status,
    payment_type: status.payment_type,
    transaction_id: status.transaction_id,
    transaction_time: status.transaction_time,
    expiry_time: status.expiry_time,
  };
}

export async function processMidtransNotification(
  rawBody: string,
  notification: MidtransNotification,
): Promise<{ duplicate: boolean; zoomSessionId: string | null }> {
  const eventHash = createHash("sha256").update(rawBody).digest("hex");
  const signatureValid = verifyMidtransSignature(notification);
  // Jika signature tidak cocok (misalnya server key sudah dirotasi), verifikasi
  // ulang langsung ke Status API Midtrans. Respons API otentik karena diambil
  // server-ke-server dengan Basic Auth memakai server key.
  const effective = signatureValid
    ? notification
    : await resolveViaStatusApi(notification);

  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`select pg_advisory_xact_lock(hashtext(${`webhook:${eventHash}`}))::text as locked`;

      const existing = await tx.paymentWebhookEvent.findUnique({
        where: { eventHash },
      });

      if (existing?.processedAt && existing.signatureValid) {
        return { duplicate: true, zoomSessionId: null };
      }

      const payment = await tx.payment.findUnique({
        where: { midtransOrderId: notification.order_id },
        include: { booking: true },
      });

      const payload = notification as unknown as Prisma.InputJsonValue;

      const event = existing
        ? await tx.paymentWebhookEvent.update({
            where: { id: existing.id },
            data: {
              paymentId: payment?.id ?? null,
              transactionStatus: notification.transaction_status,
              signatureValid,
              rawPayload: payload,
            },
          })
        : await tx.paymentWebhookEvent.create({
            data: {
              paymentId: payment?.id ?? null,
              midtransOrderId: notification.order_id,
              transactionStatus: notification.transaction_status,
              signatureValid,
              rawPayload: payload,
              eventHash,
            },
          });

      const finish = async () => {
        await tx.paymentWebhookEvent.update({
          where: { id: event.id },
          data: { processedAt: new Date() },
        });
      };

      if (!effective || !payment) {
        await finish();
        return { duplicate: false, zoomSessionId: null };
      }

      const amountMatches =
        Math.abs(
          Number(effective.gross_amount) - Number(payment.grossAmount),
        ) < 0.01;

      if (!amountMatches) {
        await finish();
        return { duplicate: false, zoomSessionId: null };
      }

      const mapped = mapStatus(effective);
      const transactionTime = parseMidtransDate(effective.transaction_time);
      const expiresAt = parseMidtransDate(effective.expiry_time);

      if (mapped.payment === "success") {
        if (payment.status === "success") {
          await finish();
          return { duplicate: false, zoomSessionId: null };
        }

        const otherSuccess = await tx.payment.findFirst({
          where: {
            bookingId: payment.bookingId,
            status: "success",
            id: { not: payment.id },
          },
          select: { id: true },
        });

        if (otherSuccess || payment.booking.status === "confirmed") {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: "failed",
              paymentType: effective.payment_type ?? null,
              midtransTransactionId: effective.transaction_id ?? null,
              transactionTime,
            },
          });
          await finish();
          return { duplicate: false, zoomSessionId: null };
        }

        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "success",
            paymentType: effective.payment_type ?? null,
            midtransTransactionId: effective.transaction_id ?? null,
            transactionTime,
            ...(expiresAt ? { expiresAt } : {}),
          },
        });

        await tx.booking.update({
          where: { id: payment.bookingId },
          data: { status: "confirmed" },
        });

        await tx.timeSlot.update({
          where: { id: payment.booking.timeSlotId },
          data: { status: "booked" },
        });

        const session = await tx.counselingSession.upsert({
          where: { bookingId: payment.bookingId },
          create: { bookingId: payment.bookingId, status: "scheduled" },
          update: {},
        });

        await tx.payment.updateMany({
          where: {
            bookingId: payment.bookingId,
            id: { not: payment.id },
            status: "pending",
          },
          data: { status: "expired" },
        });

        await finish();

        return {
          duplicate: false,
          zoomSessionId:
            payment.booking.method === "zoom" ? session.id : null,
        };
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: mapped.payment,
          paymentType: effective.payment_type ?? null,
          midtransTransactionId: effective.transaction_id ?? null,
          transactionTime,
          ...(expiresAt ? { expiresAt } : {}),
        },
      });

      if (mapped.releaseSlot && mapped.booking) {
        await tx.booking.updateMany({
          where: { id: payment.bookingId, status: "pending_payment" },
          data: { status: mapped.booking },
        });

        await tx.timeSlot.updateMany({
          where: { id: payment.booking.timeSlotId, status: "held" },
          data: { status: "available" },
        });

        await tx.payment.updateMany({
          where: {
            bookingId: payment.bookingId,
            id: { not: payment.id },
            status: "pending",
          },
          data: { status: "expired" },
        });
      }

      await finish();

      return { duplicate: false, zoomSessionId: null };
    },
    { timeout: 15_000 },
  );
}
