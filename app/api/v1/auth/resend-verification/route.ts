import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseBody, readJson } from "@/lib/api/validation";
import { resendVerificationSchema } from "@/lib/validation/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const POST = apiRoute(
  { auth: "none", rateLimit: { limit: 3, windowMs: 15 * 60_000 } },
  async ({ request }) => {
    const input = parseBody(resendVerificationSchema, await readJson(request));
    const supabase = await createSupabaseServerClient();

    await supabase.auth.resend({
      type: "signup",
      email: input.email,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
      },
    });

    // Respons generik untuk mencegah enumerasi email.
    return ok(
      { email: input.email },
      "Jika email terdaftar dan belum terverifikasi, tautan verifikasi baru telah dikirim.",
    );
  },
);
