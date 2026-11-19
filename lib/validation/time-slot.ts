import { z } from "zod";
import { uuidSchema } from "@/lib/validation/common";

const startTimeSchema = z.coerce.date({
  message: "Waktu mulai tidak valid.",
});

const durationSchema = z.coerce
  .number()
  .int("Durasi harus bilangan bulat.")
  .min(15, "Durasi minimal 15 menit.")
  .max(480, "Durasi maksimal 480 menit.");

export const counselorCreateTimeSlotSchema = z
  .object({
    startTime: startTimeSchema,
    serviceId: uuidSchema.optional(),
    durationMinutes: durationSchema.optional(),
  })
  .refine((data) => data.serviceId || data.durationMinutes, {
    path: ["durationMinutes"],
    message: "Pilih layanan atau isi durasi slot.",
  });

export const adminCreateTimeSlotSchema = counselorCreateTimeSlotSchema.and(
  z.object({ counselorId: uuidSchema }),
);

export const updateTimeSlotSchema = z
  .object({
    startTime: startTimeSchema.optional(),
    serviceId: uuidSchema.optional(),
    durationMinutes: durationSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Tidak ada data yang diperbarui.",
  });

export const timeSlotListQuerySchema = z.object({
  counselorId: uuidSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  status: z.enum(["available", "held", "booked"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const publicTimeSlotQuerySchema = z.object({
  counselorId: uuidSchema,
  serviceId: uuidSchema.optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD.")
    .optional(),
});
