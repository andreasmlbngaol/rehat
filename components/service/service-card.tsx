import Link from "next/link";
import { ArrowRight, Clock } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import type { Service } from "@/lib/types/api";

const categories = ["Untuk dirimu", "Temukan keseimbangan", "Tumbuh bersama"];

export function ServiceCard({
  service,
  index,
  href,
  actionLabel = "Pilih layanan",
}: {
  service: Service;
  index: number;
  href: string;
  actionLabel?: string;
}) {
  const lower = service.name.toLowerCase();
  const category =
    lower.includes("pasangan") || lower.includes("relasi")
      ? categories[2]
      : lower.includes("stres") || lower.includes("singkat")
        ? categories[1]
        : categories[0];

  return (
    <article className="flex flex-col gap-5 rounded-xl border border-[#e1e7e1] bg-white p-[22px] transition-colors hover:border-[#c4cec5] sm:flex-row sm:items-center sm:justify-between dark:border-border dark:bg-card">
      <div className="flex min-w-0 gap-5">
        <span className="hidden w-10 shrink-0 font-heading text-[38px] leading-none text-[#dce2de] sm:block dark:text-muted">
          0{index + 1}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] leading-[18px] font-semibold tracking-[1.2px] text-[#52796a] uppercase">
            {category}
          </p>
          <h2 className="mt-1 font-sans text-[16px] leading-[26px] font-semibold text-[#203b33] dark:text-foreground">
            {service.name}
          </h2>
          <p className="mt-1 max-w-[560px] text-[12px] leading-[22px] text-[#59645f] dark:text-muted-foreground">
            {service.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] leading-[19px] text-[#68746d] dark:text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {service.durationMinutes} menit
            </span>
            <span className="size-1 rounded-full bg-[#c4cec5]" />
            <span>
              {service.methods
                .map((method) => (method === "chat" ? "Chat" : "Zoom"))
                .join(" / ")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-6 sm:flex-col sm:items-end">
        <div className="text-left sm:text-right">
          <p className="text-[11px] leading-[18px] text-[#68746d] dark:text-muted-foreground">
            Per sesi
          </p>
          <p className="font-sans text-[16px] leading-[26px] font-semibold text-[#203b33] dark:text-foreground">
            {formatRupiah(service.price)}
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href={href}>
            {actionLabel}
            <ArrowRight weight="bold" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
