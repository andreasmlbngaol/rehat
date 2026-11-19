import { z } from "zod";

const methodSchema = z.enum(["chat", "zoom"], {
  message: "Metode konseling harus chat atau zoom.",
});

const baseService = {
  name: z
    .string()
    .trim()
    .min(1, "Nama layanan wajib diisi.")
    .max(120, "Nama layanan maksimal 120 karakter."),
  description: z
    .string()
    .trim()
    .min(1, "Deskripsi layanan wajib diisi.")
    .max(5000, "Deskripsi maksimal 5000 karakter."),
  durationMinutes: z.coerce
    .number()
    .int("Durasi harus bilangan bulat.")
    .positive("Durasi harus lebih dari 0 menit.")
    .max(480, "Durasi maksimal 480 menit."),
  price: z.coerce
    .number()
    .nonnegative("Harga tidak boleh negatif.")
    .max(100_000_000, "Harga melebihi batas wajar."),
  methods: z
    .array(methodSchema)
    .min(1, "Pilih minimal satu metode konseling.")
    .max(2, "Maksimal dua metode konseling.")
    .refine((items) => new Set(items).size === items.length, {
      message: "Metode konseling tidak boleh duplikat.",
    }),
};

export const createServiceSchema = z.object(baseService);

export const updateServiceSchema = z
  .object({
    name: baseService.name.optional(),
    description: baseService.description.optional(),
    durationMinutes: baseService.durationMinutes.optional(),
    price: baseService.price.optional(),
    methods: baseService.methods.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Tidak ada data yang diperbarui.",
  });

export const serviceQuerySchema = z.object({
  method: methodSchema.optional(),
  q: z.string().trim().max(120).optional(),
});

export const adminServiceQuerySchema = serviceQuerySchema.extend({
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
