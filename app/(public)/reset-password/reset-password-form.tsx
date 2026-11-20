"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, SpinnerGap } from "@phosphor-icons/react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { startNavigationProgress } from "@/components/layout/navigation-progress";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiFetch, errorMessage, fieldError } from "@/lib/api/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Konfirmasi password tidak sama." });
      setLoading(false);
      return;
    }

    try {
      await apiFetch("/api/v1/auth/reset-password", {
        method: "POST",
        body: { password, confirmPassword },
      });
      toast.success("Password berhasil diperbarui. Silakan masuk kembali.");
      startNavigationProgress("/login?reset=1");
      router.push("/login?reset=1");
    } catch (cause) {
      setError(errorMessage(cause));
      setFieldErrors({
        password: fieldError(cause, "password") ?? "",
        confirmPassword: fieldError(cause, "confirmPassword") ?? "",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Selamat datang di REHAT"
      title="Buat awal yang baru."
      description="Ikuti langkah berikut untuk melanjutkan."
      footerAlign="left"
      footer={
        <Link
          href="/login"
          className="font-semibold text-[#31594d] underline-offset-2 hover:underline dark:text-primary"
        >
          Kembali ke halaman masuk
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? <Alert variant="destructive">{error}</Alert> : null}

        <div className="space-y-2">
          <Label htmlFor="password">Kata sandi baru *</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Masukkan kata sandi"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            required
          />
          <p className="text-[11px] leading-[18px] text-[#68746d] dark:text-muted-foreground">
            Minimal 8 karakter.
          </p>
          {fieldErrors.password ? (
            <p className="text-[11px] text-[#9b3f3f]">{fieldErrors.password}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Konfirmasi kata sandi *</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Ulangi kata sandi"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
            required
          />
          {fieldErrors.confirmPassword ? (
            <p className="text-[11px] text-[#9b3f3f]">
              {fieldErrors.confirmPassword}
            </p>
          ) : null}
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? <SpinnerGap className="animate-spin" /> : null}
          {loading ? "Menyimpan..." : "Simpan kata sandi"}
          {loading ? null : <ArrowRight />}
        </Button>
      </form>
    </AuthShell>
  );
}
