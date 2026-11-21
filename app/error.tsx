"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowsClockwise, Warning } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { reportClientError } from "@/lib/monitoring/client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, { boundary: "app/error" });
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive text-destructive-foreground">
        <Warning className="size-8" />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.18em] text-destructive uppercase">
          Terjadi kesalahan
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Halaman gagal dimuat
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Kami sudah mencatat masalah ini. Coba muat ulang halaman atau kembali
          ke beranda.
        </p>
        {error.digest ? (
          <p className="font-mono text-xs text-muted-foreground">
            Kode: {error.digest}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>
          <ArrowsClockwise />
          Coba lagi
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Kembali ke beranda</Link>
        </Button>
      </div>
    </div>
  );
}
