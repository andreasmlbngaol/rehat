"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, SpinnerGap } from "@phosphor-icons/react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { startNavigationProgress } from "@/components/layout/navigation-progress";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, errorMessage, fieldError } from "@/lib/api/client";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { homeForRole } from "@/lib/roles";
import type { UserRole } from "@/lib/types/api";

type LoginResponse = {
  user: { id: string; email: string; role: UserRole; fullName: string };
};

const queryErrors: Record<string, string> = {
  oauth_failed: "Login Google gagal. Coba lagi atau gunakan email dan password.",
  oauth_missing_code: "Login Google tidak selesai. Coba lagi.",
  inactive: "Akun kamu tidak aktif. Hubungi administrator.",
  invalid_link: "Tautan tidak valid atau sudah kedaluwarsa.",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const queryError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    queryError ? (queryErrors[queryError] ?? "Login gagal. Coba lagi.") : null,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const result = await apiFetch<LoginResponse>("/api/v1/auth/login", {
        method: "POST",
        body: { email, password },
      });

      toast.success("Berhasil masuk.");
      const destination = safeRedirectPath(
        next,
        homeForRole(result.user.role),
      );
      startNavigationProgress(destination);
      router.push(destination);
      router.refresh();
    } catch (cause) {
      setError(errorMessage(cause));
      setFieldErrors({
        email: fieldError(cause, "email") ?? "",
        password: fieldError(cause, "password") ?? "",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Selamat datang di REHAT"
      title="Senang kamu ada di sini."
      description="Masuk untuk melanjutkan perjalananmu."
      notice="Pilihan layananmu tersimpan. Masuk sebagai pasien untuk melanjutkan."
      spacer
      footer={
        <>
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#203b33] underline-offset-2 hover:underline dark:text-foreground"
          >
            Daftar sekarang
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? <Alert variant="destructive">{error}</Alert> : null}

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            required
          />
          {fieldErrors.email ? (
            <p className="text-[11px] text-[#9b3f3f]">{fieldErrors.email}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Kata sandi *</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Masukkan kata sandi"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            required
          />
          {fieldErrors.password ? (
            <p className="text-[11px] text-[#9b3f3f]">{fieldErrors.password}</p>
          ) : null}
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-[12px] leading-[19.2px] font-semibold text-[#59645f] underline-offset-2 hover:text-[#203b33] hover:underline dark:text-muted-foreground"
            >
              Lupa kata sandi?
            </Link>
          </div>
        </div>

        <Button type="submit" className="h-[50px] w-full gap-[22px]" size="lg" disabled={loading}>
          {loading ? <SpinnerGap className="animate-spin" /> : null}
          {loading ? "Memproses..." : "Masuk"}
          {loading ? null : <ArrowRight />}
        </Button>

        <div className="flex items-center gap-3 py-[22px]">
          <span className="h-px flex-1 bg-[#e1e7e1] dark:bg-border" />
          <span className="text-[12px] leading-[19.2px] text-[#68746d] dark:text-muted-foreground">
            atau lanjutkan dengan
          </span>
          <span className="h-px flex-1 bg-[#e1e7e1] dark:bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          className={`h-14 w-full gap-[22px] text-[13px] font-semibold ${oauthLoading ? "pointer-events-none opacity-60" : ""}`}
          size="lg"
          asChild
        >
          <a
            href={`/api/v1/auth/oauth/google${
              next ? `?next=${encodeURIComponent(next)}` : ""
            }`}
            onClick={(event) => {
              if (
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              ) {
                return;
              }
              event.preventDefault();
              if (oauthLoading) return;
              setOauthLoading(true);
              const href = event.currentTarget.href;
              window.setTimeout(() => {
                window.location.href = href;
              }, 50);
            }}
          >
            {oauthLoading ? (
              <SpinnerGap className="animate-spin" />
            ) : (
              <span
                aria-hidden
                className="text-[20px] leading-[28px] font-bold text-[#31594d]"
              >
                G
              </span>
            )}
            {oauthLoading ? "Mengalihkan ke Google..." : "Google"}
          </a>
        </Button>
      </form>
    </AuthShell>
  );
}
