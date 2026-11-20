"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, SpinnerGap } from "@phosphor-icons/react";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, errorMessage, fieldError } from "@/lib/api/client";

export function RegisterForm() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: "Konfirmasi password tidak sama." });
      setLoading(false);
      return;
    }

    try {
      await apiFetch("/api/v1/auth/signup", {
        method: "POST",
        body: form,
      });
      setDone(true);
    } catch (cause) {
      setError(errorMessage(cause));
      setFieldErrors({
        fullName: fieldError(cause, "fullName") ?? "",
        email: fieldError(cause, "email") ?? "",
        password: fieldError(cause, "password") ?? "",
        confirmPassword: fieldError(cause, "confirmPassword") ?? "",
      });
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthShell
        eyebrow="Verifikasi email"
        title="Cek email kamu."
        description="Kami telah mengirim tautan verifikasi jika email tersebut valid dan belum terdaftar."
        footer={
          <Link
            href="/login"
            className="font-semibold text-[#203b33] underline-offset-2 hover:underline dark:text-foreground"
          >
            Kembali ke halaman masuk
          </Link>
        }
      >
        <div className="space-y-4">
          <Alert variant="success">
            Buka tautan verifikasi di email <strong>{form.email}</strong> untuk
            mengaktifkan akun. Tautan berlaku terbatas.
          </Alert>
          <Button variant="outline" className="w-full" size="lg" asChild>
            <Link href="/verify-email">Tidak menerima email?</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Daftar pasien"
      title="Satu langkah untuk dirimu."
      description="Buat akun pasien dan temukan ruang ceritamu."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#203b33] underline-offset-2 hover:underline dark:text-foreground"
          >
            Masuk di sini
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? <Alert variant="destructive">{error}</Alert> : null}

        <div className="space-y-2">
          <Label htmlFor="fullName">Nama lengkap *</Label>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="Nama yang ingin kami panggil"
            value={form.fullName}
            onChange={(event) => update("fullName", event.target.value)}
            aria-invalid={Boolean(fieldErrors.fullName)}
            required
          />
          {fieldErrors.fullName ? (
            <p className="text-[11px] text-[#9b3f3f]">{fieldErrors.fullName}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
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
            autoComplete="new-password"
            placeholder="Masukkan kata sandi"
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
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
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Ulangi kata sandi"
            value={form.confirmPassword}
            onChange={(event) => update("confirmPassword", event.target.value)}
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
          {loading ? "Mendaftar..." : "Buat akun"}
          {loading ? null : <ArrowRight />}
        </Button>
      </form>
    </AuthShell>
  );
}
