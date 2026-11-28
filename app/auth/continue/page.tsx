"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SpinnerGap } from "@phosphor-icons/react";
import type { Session } from "@supabase/supabase-js";
import { AuthShell } from "@/components/auth/auth-shell";
import { Alert } from "@/components/ui/alert";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

/**
 * Titik pendaratan untuk tautan email Supabase yang memakai alur implisit
 * (mis. undangan konselor dari Admin API). Token ada di fragment URL
 * (`#access_token=...`) sehingga tidak pernah sampai ke server; sesi harus
 * dibaca di browser lalu disimpan sebagai cookie sebelum lanjut ke halaman
 * berikutnya.
 */
export default function AuthContinuePage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const next = safeNext(new URLSearchParams(window.location.search).get("next"));
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;

    void supabase.auth
      .getSession()
      .then(({ data }: { data: { session: Session | null } }) => {
        if (cancelled) return;
        if (data.session) {
          router.replace(next);
        } else {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <AuthShell
      title={failed ? "Tautan tidak berlaku." : "Menyiapkan sesi..."}
      description={
        failed
          ? "Tautan ini sudah dipakai atau kedaluwarsa. Minta administrator mengirim ulang undangan."
          : "Sebentar, kami sedang memverifikasi tautan Anda."
      }
      footer={
        failed ? (
          <Link
            href="/login"
            className="font-semibold text-[#31594d] underline-offset-2 hover:underline dark:text-primary"
          >
            Kembali ke halaman masuk
          </Link>
        ) : null
      }
    >
      {failed ? (
        <Alert variant="destructive">
          Tautan tidak valid atau sudah kedaluwarsa.
        </Alert>
      ) : (
        <p className="flex items-center gap-2 text-[13px] text-[#59645f] dark:text-muted-foreground">
          <SpinnerGap className="animate-spin" aria-hidden />
          Memverifikasi tautan...
        </p>
      )}
    </AuthShell>
  );
}
