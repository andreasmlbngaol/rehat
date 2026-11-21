import { z } from "zod";
import { uuidSchema } from "@/lib/validation/common";

export const sendMessageSchema = z.object({
  content: z.string().max(4000, "Isi pesan terlalu panjang."),
  clientMessageId: uuidSchema,
});

export const messageListQuerySchema = z.object({
  before: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});

export const sessionListQuerySchema = z.object({
  status: z.enum(["scheduled", "active", "completed"]).optional(),
  method: z.enum(["chat", "zoom"]).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
