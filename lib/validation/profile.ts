import { z } from "zod";
import { fullNameSchema } from "@/lib/validation/common";

export const updateProfileSchema = z
  .object({
    fullName: fullNameSchema.optional(),
    specialization: z
      .string()
      .trim()
      .min(2, "Bidang keahlian minimal 2 karakter.")
      .max(120, "Bidang keahlian maksimal 120 karakter.")
      .optional(),
    bio: z
      .string()
      .trim()
      .max(2000, "Deskripsi profesional maksimal 2000 karakter.")
      .nullable()
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Tidak ada data yang diperbarui.",
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
