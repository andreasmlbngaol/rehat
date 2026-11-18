import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseBody, readJson } from "@/lib/api/validation";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const POST = apiRoute(
  { auth: "none", rateLimit: { limit: 3, windowMs: 15 * 60_000 } },
  async ({ request }) => {
    const input = parseBody(forgotPasswordSchema, await readJson(request));
    const supabase = await createSupabaseServerClient();

    await supabase.auth.resetPasswordForEmail(input.email, {
      redirectTo: `${request.nextUrl.origin}/auth/confirm?next=/reset-password`,
    });

    // Respons generik untuk mencegah enumerasi email.
    return ok(
      { email: input.email },
      "Jika email terdaftar, tautan pemulihan password telah dikirim.",
    );
  },
);
