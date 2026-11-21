import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseBody, parseParam, parseQuery, readJson } from "@/lib/api/validation";
import { uuidSchema } from "@/lib/validation/common";
import { messageListQuerySchema, sendMessageSchema } from "@/lib/validation/chat";
import { listMessages, sendMessage } from "@/lib/services/chat.service";
import { toMessageDto } from "@/lib/dto/session";

export const GET = apiRoute<{ id: string }>(
  { auth: "required" },
  async ({ params, searchParams, user }) => {
    const id = parseParam(uuidSchema, params.id);
    const query = parseQuery(messageListQuerySchema, searchParams);

    const result = await listMessages({
      sessionId: id,
      userId: user!.id,
      before: query.before,
      limit: query.limit,
    });

    return ok({
      items: result.items.map(toMessageDto),
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
    });
  },
);

export const POST = apiRoute<{ id: string }>(
  { auth: "required", rateLimit: { limit: 60, windowMs: 60_000 } },
  async ({ params, request, user }) => {
    const id = parseParam(uuidSchema, params.id);
    const input = parseBody(sendMessageSchema, await readJson(request));

    const result = await sendMessage({
      sessionId: id,
      userId: user!.id,
      content: input.content,
      clientMessageId: input.clientMessageId,
    });

    return ok(
      toMessageDto(result.message),
      result.duplicate ? "Pesan sudah tersimpan." : "Pesan terkirim.",
      result.duplicate ? 200 : 201,
    );
  },
);
