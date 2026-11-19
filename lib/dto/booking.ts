import "server-only";
import type {
  Booking,
  CounselingSession,
  Payment,
  Profile,
} from "@/lib/generated/prisma/client";
import { avatarPublicUrl } from "@/lib/integrations/r2";
import type { UserRole } from "@/lib/auth/roles";

type BookingRelations = Booking & {
  patient: Pick<Profile, "id" | "fullName" | "avatarKey">;
  counselor: Pick<Profile, "id" | "fullName" | "avatarKey">;
  payments: Payment[];
  session: CounselingSession | null;
};

export function toBookingDto(booking: BookingRelations, viewerRole: UserRole) {
  const latestPayment = booking.payments[0] ?? null;

  return {
    id: booking.id,
    bookingCode: booking.bookingCode,
    status: booking.status,
    method: booking.method,
    serviceId: booking.serviceId,
    serviceName: booking.serviceName,
    durationMinutes: booking.durationMinutes,
    price: Number(booking.price),
    scheduledStart: booking.scheduledStart.toISOString(),
    scheduledEnd: booking.scheduledEnd.toISOString(),
    paymentExpiresAt: booking.paymentExpiresAt?.toISOString() ?? null,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
    patient: {
      id: booking.patient.id,
      fullName: booking.patient.fullName,
      avatarUrl: booking.patient.avatarKey
        ? avatarPublicUrl(booking.patient.avatarKey)
        : null,
    },
    counselor: {
      id: booking.counselor.id,
      fullName: booking.counselor.fullName,
      avatarUrl: booking.counselor.avatarKey
        ? avatarPublicUrl(booking.counselor.avatarKey)
        : null,
    },
    payment: latestPayment
      ? viewerRole === "counselor"
        ? { status: latestPayment.status }
        : {
            id: latestPayment.id,
            status: latestPayment.status,
            grossAmount: Number(latestPayment.grossAmount),
            paymentType: latestPayment.paymentType,
            transactionTime: latestPayment.transactionTime?.toISOString() ?? null,
            expiresAt: latestPayment.expiresAt?.toISOString() ?? null,
          }
      : null,
    session: booking.session
      ? {
          id: booking.session.id,
          status: booking.session.status,
          startedAt: booking.session.startedAt?.toISOString() ?? null,
          endedAt: booking.session.endedAt?.toISOString() ?? null,
        }
      : null,
  };
}
