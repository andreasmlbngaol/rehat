import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseBody, readJson } from "@/lib/api/validation";
import { loginSchema } from "@/lib/validation/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/api/errors";

export const POST = apiRoute(
  { auth: "none", rateLimit: { limit: 10, windowMs: 15 * 60_000 } },
  async ({ request }) => {
    const input = parseBody(loginSchema, await readJson(request));
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error || !data.user) {
      if (error?.code === "email_not_confirmed") {
        throw errors.emailNotVerified();
      }
      throw errors.unauthenticated("Email atau password salah.");
    }

    const profile = await prisma.profile.findUnique({
      where: { id: data.user.id },
      select: { id: true, email: true, role: true, fullName: true, isActive: true },
    });

    if (!profile) {
      await supabase.auth.signOut();
      throw errors.unauthenticated("Profil pengguna tidak ditemukan.");
    }

    if (!profile.isActive) {
      await supabase.auth.signOut();
      throw errors.accountInactive();
    }

    return ok(
      {
        user: {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          fullName: profile.fullName,
        },
      },
      "Login berhasil.",
    );
  },
);
