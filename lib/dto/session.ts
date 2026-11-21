import "server-only";
import type { ChatMessage, Profile } from "@/lib/generated/prisma/client";
import type {
  SessionAccess,
  SessionRelations,
} from "@/lib/services/session.service";
import { effectiveStatus } from "@/lib/services/session.service";
import { avatarPublicUrl } from "@/lib/integrations/r2";

type MessageWithSender = ChatMessage & {
  sender: Pick<Profile, "id" | "fullName" | "avatarKey">;
};

/** Zoom links open 10 minutes before the session starts. */
export const ZOOM_JOIN_LEAD_MS = 10 * 60_000;

export function zoomJoinWindow(
  scheduledStart: Date,
  scheduledEnd: Date,
  now: Date = new Date(),
) {
  const opensAt = new Date(scheduledStart.getTime() - ZOOM_JOIN_LEAD_MS);

  return {
    joinable: now >= opensAt && now < scheduledEnd,
    opensAt,
    closesAt: scheduledEnd,
  };
}

export function toSessionDto(
  session: SessionRelations,
  access: SessionAccess,
) {
  const status = effectiveStatus(
    session.status,
    session.booking.scheduledStart,
    session.booking.scheduledEnd,
  );

  const meeting = session.zoomMeeting;
  const joinWindow =
    session.booking.method === "zoom"
      ? zoomJoinWindow(
          session.booking.scheduledStart,
          session.booking.scheduledEnd,
        )
      : null;

  const zoom =
    session.booking.method !== "zoom"
      ? null
      : access === "admin"
        ? {
            status: meeting?.integrationStatus ?? "pending",
            attemptCount: meeting?.attemptCount ?? 0,
            hasJoinUrl: Boolean(meeting?.joinUrl),
            hasStartUrl: Boolean(meeting?.startUrl),
          }
        : meeting
          ? {
              status: meeting.integrationStatus,
              joinable: joinWindow!.joinable,
              opensAt: joinWindow!.opensAt.toISOString(),
              closesAt: joinWindow!.closesAt.toISOString(),
              joinUrl: joinWindow!.joinable ? meeting.joinUrl : null,
              ...(access === "counselor"
                ? {
                    startUrl: joinWindow!.joinable ? meeting.startUrl : null,
                  }
                : {}),
              startTime: meeting.startTime.toISOString(),
              durationMinutes: meeting.durationMinutes,
              attemptCount: meeting.attemptCount,
              lastError: access === "counselor" ? meeting.lastError : null,
            }
          : null;

  return {
    id: session.id,
    status,
    startedAt: session.startedAt?.toISOString() ?? null,
    endedAt: session.endedAt?.toISOString() ?? null,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    booking: {
      id: session.booking.id,
      bookingCode: session.booking.bookingCode,
      serviceName: session.booking.serviceName,
      method: session.booking.method,
      durationMinutes: session.booking.durationMinutes,
      scheduledStart: session.booking.scheduledStart.toISOString(),
      scheduledEnd: session.booking.scheduledEnd.toISOString(),
      status: session.booking.status,
    },
    patient: {
      id: session.booking.patient.id,
      fullName: session.booking.patient.fullName,
      avatarUrl: session.booking.patient.avatarKey
        ? avatarPublicUrl(session.booking.patient.avatarKey)
        : null,
    },
    counselor: {
      id: session.booking.counselor.id,
      fullName: session.booking.counselor.fullName,
      avatarUrl: session.booking.counselor.avatarKey
        ? avatarPublicUrl(session.booking.counselor.avatarKey)
        : null,
    },
    zoom,
    chat:
      session.booking.method === "chat"
        ? {
            enabled: session.booking.status === "confirmed",
            readOnly: status === "completed",
          }
        : null,
  };
}

export function toMessageDto(message: MessageWithSender) {
  return {
    id: message.id,
    sessionId: message.sessionId,
    senderId: message.senderId,
    content: message.content,
    clientMessageId: message.clientMessageId,
    createdAt: message.createdAt.toISOString(),
    sender: {
      id: message.sender.id,
      fullName: message.sender.fullName,
      avatarUrl: message.sender.avatarKey
        ? avatarPublicUrl(message.sender.avatarKey)
        : null,
    },
  };
}
