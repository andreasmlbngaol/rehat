import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { errors } from "@/lib/api/errors";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const GET = apiRoute({ auth: "none" }, async ({ request }) => {
  const supabase = await createSupabaseServerClient();
  const next = safeRedirectPath(request.nextUrl.searchParams.get("next"));
  const origin = request.nextUrl.origin;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    throw errors.external("Login Google sedang tidak tersedia. Coba lagi nanti.");
  }

  return NextResponse.redirect(data.url);
});
