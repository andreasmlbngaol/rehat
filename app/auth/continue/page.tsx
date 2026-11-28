"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SpinnerGap } from "@phosphor-icons/react";
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

    void (async () => {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (cancelled) return;
        if (!error) {
          router.replace(next);
          return;
        }
        console.error("[auth/continue] gagal menyimpan sesi:", error.message);
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        router.replace(next);
      } else {
        setFailed(true);
      }
    })();

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
