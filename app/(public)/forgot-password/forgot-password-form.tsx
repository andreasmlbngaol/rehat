"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, SpinnerGap } from "@phosphor-icons/react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, errorMessage, fieldError } from "@/lib/api/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setEmailError(null);

    try {
      await apiFetch("/api/v1/auth/forgot-password", {
        method: "POST",
        body: { email },
      });
      setDone(true);
    } catch (cause) {
      setError(errorMessage(cause));
      setEmailError(fieldError(cause, "email") ?? null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Selamat datang di REHAT"
      title="Kita mulai kembali."
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
      {done ? (
        <div className="space-y-4">
          <Alert variant="success">
            Jika email terdaftar, tautan pemulihan telah dikirim. Periksa inbox
            dan folder spam.
          </Alert>
          <Button variant="outline" className="w-full" size="lg" asChild>
            <Link href="/login">Kembali ke login</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error ? <Alert variant="destructive">{error}</Alert> : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(emailError)}
              required
            />
            {emailError ? (
              <p className="text-[11px] text-[#9b3f3f]">{emailError}</p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? <SpinnerGap className="animate-spin" /> : null}
            {loading ? "Mengirim..." : "Kirim tautan reset"}
            {loading ? null : <ArrowRight />}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
