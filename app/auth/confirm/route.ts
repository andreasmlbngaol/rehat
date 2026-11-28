import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

function normalizeType(value: string | null): EmailOtpType | null {
  if (!value) return null;
  if (value === "email_change_current" || value === "email_change_new") {
    return "email_change";
  }
  return (ALLOWED_TYPES as string[]).includes(value) ? (value as EmailOtpType) : null;
}

function fallbackFor(type: EmailOtpType): string {
  if (type === "recovery" || type === "invite") return "/reset-password";
  return "/dashboard";
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const base = request.nextUrl.origin;

  const tokenHash = searchParams.get("token_hash");
  const code = searchParams.get("code");
  const type = normalizeType(searchParams.get("type"));

  const supabase = await createSupabaseServerClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) {
      return NextResponse.redirect(new URL("/login?error=invalid_link", base));
    }
    return NextResponse.redirect(
      new URL(
        safeRedirectPath(searchParams.get("next"), fallbackFor(type)),
        base,
      ),
    );
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/login?error=invalid_link", base));
    }
    return NextResponse.redirect(
      new URL(
        safeRedirectPath(searchParams.get("next"), fallbackFor(type ?? "signup")),
        base,
      ),
    );
  }

  return NextResponse.redirect(new URL("/login?error=invalid_link", base));
}
