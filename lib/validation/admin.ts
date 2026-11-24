import { z } from "zod";
import { bookingListQuerySchema } from "@/lib/validation/booking";
import { sessionListQuerySchema } from "@/lib/validation/chat";

export const adminUserQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  role: z.enum(["patient", "counselor"]).optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const adminUpdateUserSchema = z.object({
  isActive: z.boolean(),
});

export const adminBookingQuerySchema = bookingListQuerySchema;

export const adminPaymentQuerySchema = z.object({
  status: z
    .enum(["pending", "success", "failed", "cancelled", "expired"])
    .optional(),
  q: z.string().trim().max(120).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const adminSessionQuerySchema = sessionListQuerySchema.extend({
  q: z.string().trim().max(120).optional(),
});
