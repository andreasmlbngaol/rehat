import "server-only";
import type { Booking, Payment, Profile } from "@/lib/generated/prisma/client";

type PaymentWithBooking = Payment & {
  booking?: Pick<
    Booking,
    "id" | "bookingCode" | "serviceName" | "scheduledStart"
  > | null;
};

export function toPaymentDto(
  payment: PaymentWithBooking,
  options?: { includeSnapToken?: boolean },
) {
  return {
    id: payment.id,
    midtransOrderId: payment.midtransOrderId,
    status: payment.status,
    grossAmount: Number(payment.grossAmount),
    paymentType: payment.paymentType,
    transactionTime: payment.transactionTime?.toISOString() ?? null,
    expiresAt: payment.expiresAt?.toISOString() ?? null,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
    ...(options?.includeSnapToken && payment.snapToken
      ? { snapToken: payment.snapToken }
      : {}),
    ...(payment.booking
      ? {
          booking: {
            id: payment.booking.id,
            bookingCode: payment.booking.bookingCode,
            serviceName: payment.booking.serviceName,
            scheduledStart: payment.booking.scheduledStart.toISOString(),
          },
        }
      : {}),
  };
}

type AdminPaymentWithBooking = Payment & {
  booking: Pick<
    Booking,
    "id" | "bookingCode" | "serviceName" | "scheduledStart"
  > & {
    patient: Pick<Profile, "id" | "fullName">;
  };
};

export function toAdminPaymentDto(payment: AdminPaymentWithBooking) {
  return {
    ...toPaymentDto(payment),
    patient: {
      id: payment.booking.patient.id,
      fullName: payment.booking.patient.fullName,
    },
  };
}
