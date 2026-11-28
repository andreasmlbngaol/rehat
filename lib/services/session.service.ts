import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/api/errors";
import type { UserRole } from "@/lib/auth/roles";

export const sessionInclude = {
  booking: {
    include: {
      patient: { select: { id: true, fullName: true, avatarKey: true } },
      counselor: { select: { id: true, fullName: true, avatarKey: true } },
    },
  },
  zoomMeeting: true,
} satisfies Prisma.CounselingSessionInclude;

export type SessionRelations = Prisma.CounselingSessionGetPayload<{
  include: typeof sessionInclude;
}>;

export type SessionAccess = "patient" | "counselor" | "admin";

export function effectiveStatus(
  status: "scheduled" | "active" | "completed",
  scheduledStart: Date,
  scheduledEnd: Date,
  now: Date = new Date(),
): "scheduled" | "active" | "completed" {
  if (status === "completed") return "completed";
  if (now >= scheduledEnd) return "completed";
  if (now >= scheduledStart) return "active";
  return "scheduled";
}

export async function reconcileSessionStatus(
  sessionId: string,
): Promise<void> {
  const session = await prisma.counselingSession.findUnique({
    where: { id: sessionId },
    include: { booking: { select: { scheduledStart: true, scheduledEnd: true } } },
  });

  if (!session) return;

  const now = new Date();
  const next = effectiveStatus(
    session.status,
    session.booking.scheduledStart,
    session.booking.scheduledEnd,
    now,
  );

  if (next === session.status) return;

  await prisma.counselingSession.update({
    where: { id: session.id },
    data: {
      status: next,
      ...(next === "active" && !session.startedAt ? { startedAt: now } : {}),
      ...(next === "completed" && !session.endedAt
        ? { endedAt: session.booking.scheduledEnd }
        : {}),
    },
  });
}

export async function reconcileSessionsForUser(user: {
  id: string;
  role: UserRole;
}): Promise<void> {
  if (user.role !== "patient" && user.role !== "counselor") return;

  const now = new Date();

  const sessions = await prisma.counselingSession.findMany({
    where: {
      status: { in: ["scheduled", "active"] },
      booking:
        user.role === "patient"
          ? { patientId: user.id }
          : { counselorId: user.id },
    },
    include: { booking: { select: { scheduledStart: true, scheduledEnd: true } } },
    take: 100,
  });

  const updates = sessions
    .map((session) => {
      const next = effectiveStatus(
        session.status,
        session.booking.scheduledStart,
        session.booking.scheduledEnd,
        now,
      );

      if (next === session.status) return null;

      return prisma.counselingSession.update({
        where: { id: session.id },
        data: {
          status: next,
          ...(next === "active" && !session.startedAt ? { startedAt: now } : {}),
          ...(next === "completed" && !session.endedAt
            ? { endedAt: session.booking.scheduledEnd }
            : {}),
        },
      });
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }
}

export async function reconcileAllSessions(): Promise<void> {
  const now = new Date();

  const sessions = await prisma.counselingSession.findMany({
    where: { status: { in: ["scheduled", "active"] } },
    include: { booking: { select: { scheduledStart: true, scheduledEnd: true } } },
    take: 200,
  });

  const updates = sessions
    .map((session) => {
      const next = effectiveStatus(
        session.status,
        session.booking.scheduledStart,
        session.booking.scheduledEnd,
        now,
      );

      if (next === session.status) return null;

      return prisma.counselingSession.update({
        where: { id: session.id },
        data: {
          status: next,
          ...(next === "active" && !session.startedAt ? { startedAt: now } : {}),
          ...(next === "completed" && !session.endedAt
            ? { endedAt: session.booking.scheduledEnd }
            : {}),
        },
      });
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }
}

export async function endSession(
  sessionId: string,
  userId: string,
): Promise<SessionRelations> {
  const session = await prisma.counselingSession.findUnique({
    where: { id: sessionId },
    include: sessionInclude,
  });

  if (!session) {
    throw errors.notFound("Sesi konseling tidak ditemukan.");
  }

  if (
    session.booking.patientId !== userId &&
    session.booking.counselorId !== userId
  ) {
    throw errors.forbidden("Anda tidak terlibat dalam sesi ini.");
  }

  if (session.status === "completed") {
    return session;
  }

  if (session.status !== "active") {
    throw errors.conflict("Sesi belum berlangsung.");
  }

  return prisma.counselingSession.update({
    where: { id: sessionId },
    data: { status: "completed", endedAt: new Date() },
    include: sessionInclude,
  });
}

export async function getSessionForViewer(
  id: string,
  viewer: { id: string; role: UserRole },
): Promise<{ session: SessionRelations; access: SessionAccess }> {
  const session = await prisma.counselingSession.findUnique({
    where: { id },
    include: sessionInclude,
  });

  if (!session) {
    throw errors.notFound("Sesi konseling tidak ditemukan.");
  }

  if (viewer.role === "admin") {
    return { session, access: "admin" };
  }

  if (viewer.role === "patient" && session.booking.patientId === viewer.id) {
    return { session, access: "patient" };
  }

  if (
    viewer.role === "counselor" &&
    session.booking.counselorId === viewer.id
  ) {
    return { session, access: "counselor" };
  }

  throw errors.notFound("Sesi konseling tidak ditemukan.");
}

export async function assertSessionParticipant(
  sessionId: string,
  userId: string,
) {
  const session = await prisma.counselingSession.findUnique({
    where: { id: sessionId },
    include: {
      booking: {
        select: {
          patientId: true,
          counselorId: true,
          scheduledStart: true,
          scheduledEnd: true,
        },
      },
    },
  });

  if (!session) {
    throw errors.notFound("Sesi konseling tidak ditemukan.");
  }

  if (
    session.booking.patientId !== userId &&
    session.booking.counselorId !== userId
  ) {
    throw errors.forbidden("Anda tidak terlibat dalam sesi ini.");
  }

  return session;
}
