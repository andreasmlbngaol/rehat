import Link from "next/link";
import { Compass, House } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Compass className="size-8" />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
          404
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Halaman tidak ditemukan
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Tautan mungkin salah, sudah dipindahkan, atau tidak lagi tersedia.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/">
            <House />
            Kembali ke beranda
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/services">Lihat layanan</Link>
        </Button>
      </div>
    </div>
  );
}
