import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseBody, readJson } from "@/lib/api/validation";
import { signupSchema } from "@/lib/validation/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { errors } from "@/lib/api/errors";

export const POST = apiRoute(
  { auth: "none", rateLimit: { limit: 5, windowMs: 15 * 60_000 } },
  async ({ request }) => {
    const input = parseBody(signupSchema, await readJson(request));
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { full_name: input.fullName },
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
      },
    });

    if (error && error.code !== "user_already_exists") {
      if (error.status === 429) {
        throw errors.rateLimited("Terlalu banyak permintaan pendaftaran. Coba lagi nanti.");
      }
      throw errors.external("Pendaftaran sedang tidak dapat diproses. Coba lagi nanti.");
    }

    // Pesan generik: jangan ungkap apakah email sudah terdaftar (FR-AUTH-015).
    return ok(
      { email: input.email },
      "Pendaftaran diterima. Jika email valid dan belum terdaftar, tautan verifikasi telah dikirim.",
      201,
    );
  },
);
