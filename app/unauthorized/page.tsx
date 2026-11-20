import Link from "next/link";
import { ShieldWarning } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive text-destructive-foreground">
        <ShieldWarning className="size-8" />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.18em] text-destructive uppercase">
          403
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Akses ditolak
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Akunmu tidak memiliki izin untuk membuka halaman ini.
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/">Kembali ke beranda</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/login">Masuk dengan akun lain</Link>
        </Button>
      </div>
    </div>
  );
}
