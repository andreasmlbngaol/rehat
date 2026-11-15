import "server-only";
import { z } from "zod";

/**
 * Validasi environment sisi server.
 *
 * Parsing dilakukan malas (lazy) agar `next build` tidak gagal saat modul
 * diimpor untuk analisis statis. Kesalahan konfigurasi tetap muncul cepat
 * pada request pertama.
 */
const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi."),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),

  MIDTRANS_SERVER_KEY: z.string().min(1),
  MIDTRANS_IS_PRODUCTION: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: z.string().min(1),

  ZOOM_ACCOUNT_ID: z.string().min(1),
  ZOOM_CLIENT_ID: z.string().min(1),
  ZOOM_CLIENT_SECRET: z.string().min(1),
  ZOOM_SECRET_TOKEN: z.string().optional(),

  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().min(1),
  SUPABASE_SEND_EMAIL_HOOK_SECRET: z.string().optional(),

  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_ENDPOINT: z.string().url(),
  R2_PUBLIC_URL: z.string().url(),

  BOOKING_PAYMENT_TTL_MINUTES: z.coerce.number().int().positive().default(60),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Konfigurasi environment tidak valid — ${detail}`);
  }

  cached = parsed.data;
  return cached;
}
