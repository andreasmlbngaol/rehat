"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, SpinnerGap } from "@phosphor-icons/react";
import { AuthShell } from "@/components/auth/auth-shell";
import { useSession } from "@/components/providers/session-provider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EnvelopeLineIcon } from "@/components/ui/figma-icons";
import { Input } from "@/components/ui/input";
import { apiFetch, errorMessage } from "@/lib/api/client";

export function VerifyEmailForm() {
  const router = useRouter();
  const { user, logout } = useSession();
  const [email, setEmail] = useState(user?.email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function resend() {
    if (!email) {
      setShowInput(true);
      return;
    }

    setLoading(true);
    setError(null);
    setDone(false);

    try {
      await apiFetch("/api/v1/auth/resend-verification", {
        method: "POST",
        body: { email },
      });
      setDone(true);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Selamat datang di REHAT"
      title="Satu langkah lagi."
      description="Ikuti langkah berikut untuk melanjutkan."
    >
      <div className="flex flex-col items-center pt-6 text-center">
        <span className="flex size-[75px] items-center justify-center rounded-full bg-[#eff6f2] text-[#52796a] dark:bg-accent">
          <EnvelopeLineIcon className="size-[35px]" />
        </span>
        <h2 className="mt-6 text-[16px] leading-[26px] font-semibold text-[#203b33] dark:text-foreground">
          Verifikasi alamat emailmu
        </h2>
        <p className="mt-2 max-w-[360px] text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
          Konfirmasikan alamat email kamu untuk melanjutkan ke REHAT.
        </p>

        {error ? (
          <Alert variant="destructive" className="mt-4 w-full text-left">
            {error}
          </Alert>
        ) : null}
        {done ? (
          <Alert variant="success" className="mt-4 w-full text-left">
            Tautan verifikasi telah dikirim. Periksa inbox dan folder spam.
          </Alert>
        ) : null}

        {showInput && !email ? (
          <Input
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-4"
            aria-label="Email terdaftar"
          />
        ) : null}

        <Button
          type="button"
          className="mt-6 h-[50px] w-full gap-[22px]"
          onClick={resend}
          disabled={loading}
        >
          {loading ? <SpinnerGap className="animate-spin" /> : null}
          {loading ? "Mengirim..." : "Verifikasi email"}
          {loading ? null : <ArrowRight />}
        </Button>

        <button
          type="button"
          onClick={resend}
          disabled={loading}
          className="mt-4 text-[12px] leading-[19.2px] font-semibold text-[#31594d] underline-offset-2 hover:underline disabled:opacity-60 dark:text-primary"
        >
          Kirim ulang email
        </button>

        <button
          type="button"
          disabled={loggingOut}
          onClick={async () => {
            setLoggingOut(true);
            await logout();
            router.push("/login");
          }}
          className="mt-3 text-[12px] leading-[19.2px] text-[#59645f] hover:text-[#203b33] disabled:opacity-60 dark:text-muted-foreground dark:hover:text-foreground"
        >
          {loggingOut ? "Keluar..." : "Keluar dari akun"}
        </button>
      </div>
    </AuthShell>
  );
}
