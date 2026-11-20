import { SpinnerGap } from "@phosphor-icons/react/dist/ssr";
import { cn } from "cn";

/**
 * Indikator kecil untuk aksi atau pemuatan ulang data yang sudah tampil.
 * Tidak mengganti konten, sehingga tidak menyebabkan layout shift.
 */
export function InlineLoading({
  label = "Memperbarui...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
        className,
      )}
    >
      <SpinnerGap
        className="size-3.5 animate-spin motion-reduce:animate-none"
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

/** Layar penuh tanpa struktur konten yang diketahui (mis. halaman auth). */
export function FullPageSpinner({ label = "Memuat halaman" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="flex min-h-svh items-center justify-center"
    >
      <SpinnerGap
        className="size-6 animate-spin text-muted-foreground motion-reduce:animate-none"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * Overlay blocking untuk aksi yang tidak boleh diulang dan butuh waktu,
 * mis. membuat pemesanan atau menyiapkan pembayaran. Konten di belakang
 * diredupkan agar fokus pengguna tetap pada progres aksi.
 */
export function LoadingOverlay({ label = "Memproses..." }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="assertive"
      aria-label={label}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0f1a16]/30 px-4 backdrop-blur-[2px]"
    >
      <div className="flex flex-col items-center gap-3 rounded-[16px] bg-white px-8 py-7 shadow-[0_20px_80px_rgba(32,59,51,0.18)] dark:bg-card">
        <SpinnerGap
          className="size-7 animate-spin text-[#31594d] motion-reduce:animate-none dark:text-primary"
          aria-hidden="true"
        />
        <p className="text-[12px] leading-[19.2px] font-medium text-[#203b33] dark:text-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}
