import { z } from "zod";
import { emailSchema, fullNameSchema, uuidSchema } from "@/lib/validation/common";

export const createCounselorSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  specialization: z
    .string()
    .trim()
    .min(2, "Bidang keahlian minimal 2 karakter.")
    .max(120, "Bidang keahlian maksimal 120 karakter."),
  bio: z
    .string()
    .trim()
    .max(2000, "Deskripsi profesional maksimal 2000 karakter.")
    .nullable()
    .optional(),
  serviceIds: z
    .array(uuidSchema)
    .min(1, "Pilih minimal satu layanan.")
    .max(20, "Maksimal 20 layanan."),
});

export const updateCounselorSchema = z
  .object({
    fullName: fullNameSchema.optional(),
    specialization: z.string().trim().min(2).max(120).optional(),
    bio: z.string().trim().max(2000).nullable().optional(),
    serviceIds: z.array(uuidSchema).min(1).max(20).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Tidak ada data yang diperbarui.",
  });

export const counselorQuerySchema = z.object({
  serviceId: uuidSchema.optional(),
});

export type CreateCounselorInput = z.infer<typeof createCounselorSchema>;
export type UpdateCounselorInput = z.infer<typeof updateCounselorSchema>;
