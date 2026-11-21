import { z } from "zod";
import { uuidSchema } from "@/lib/validation/common";

export const createBookingSchema = z.object({
  timeSlotId: uuidSchema,
  serviceId: uuidSchema,
  method: z.enum(["chat", "zoom"], {
    message: "Metode konseling harus chat atau zoom.",
  }),
});

export const bookingListQuerySchema = z.object({
  status: z
    .enum(["pending_payment", "confirmed", "cancelled", "expired"])
    .optional(),
  method: z.enum(["chat", "zoom"]).optional(),
  q: z.string().trim().max(120).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const idempotencyKeySchema = z
  .string()
  .uuid("Header Idempotency-Key harus berupa UUID.");

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
