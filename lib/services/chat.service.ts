import "server-only";
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/api/errors";
import { assertSessionParticipant } from "@/lib/services/session.service";

const senderSelect = {
  id: true,
  fullName: true,
  avatarKey: true,
} as const;

export async function listMessages(input: {
  sessionId: string;
  userId: string;
  before?: Date;
  limit: number;
}) {
  await assertSessionParticipant(input.sessionId, input.userId);

  const messages = await prisma.chatMessage.findMany({
    where: {
      sessionId: input.sessionId,
      ...(input.before ? { createdAt: { lt: input.before } } : {}),
    },
    include: { sender: { select: senderSelect } },
    orderBy: { createdAt: "desc" },
    take: input.limit + 1,
  });

  const hasMore = messages.length > input.limit;
  const page = hasMore ? messages.slice(0, input.limit) : messages;
  const items = [...page].reverse();

  return {
    items,
    hasMore,
    nextCursor: hasMore ? (items[0]?.createdAt.toISOString() ?? null) : null,
  };
}

export async function sendMessage(input: {
  sessionId: string;
  userId: string;
  content: string;
  clientMessageId: string;
}) {
  const content = input.content.trim();

  if (content.length === 0) {
    throw errors.validation({ content: ["Pesan tidak boleh kosong."] });
  }

  if (content.length > 2000) {
    throw errors.validation({ content: ["Pesan maksimal 2000 karakter."] });
  }

  const session = await assertSessionParticipant(input.sessionId, input.userId);
  const now = new Date();

  if (now < session.booking.scheduledStart) {
    throw errors.sessionNotActive("Sesi belum dimulai.");
  }

  if (now > session.booking.scheduledEnd) {
    throw errors.sessionNotActive("Sesi sudah berakhir.");
  }

  const existing = await prisma.chatMessage.findUnique({
    where: {
      sessionId_clientMessageId: {
        sessionId: input.sessionId,
        clientMessageId: input.clientMessageId,
      },
    },
    include: { sender: { select: senderSelect } },
  });

  if (existing) {
    return { message: existing, duplicate: true };
  }

  try {
    const message = await prisma.chatMessage.create({
      data: {
        sessionId: input.sessionId,
        senderId: input.userId,
        content,
        clientMessageId: input.clientMessageId,
      },
      include: { sender: { select: senderSelect } },
    });

    return { message, duplicate: false };
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      const duplicate = await prisma.chatMessage.findUnique({
        where: {
          sessionId_clientMessageId: {
            sessionId: input.sessionId,
            clientMessageId: input.clientMessageId,
          },
        },
        include: { sender: { select: senderSelect } },
      });

      if (duplicate) {
        return { message: duplicate, duplicate: true };
      }
    }

    throw error;
  }
}
