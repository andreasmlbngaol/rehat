import { cn } from "cn";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton dipakai hanya untuk pemuatan halaman penuh yang struktur
 * akhirnya sudah diketahui. Aksi, dialog, dan modul kecil memakai spinner.
 */
function SkeletonPage({
  children,
  label = "Memuat konten",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className="space-y-6"
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-64 max-w-full" />
      <Skeleton className="h-4 w-96 max-w-full" />
    </div>
  );
}

/** Ringkasan dashboard: header, kartu statistik, lalu blok konten. */
export function OverviewSkeleton({
  cards = 3,
  columns = 2,
}: {
  cards?: number;
  columns?: 1 | 2;
}) {
  return (
    <SkeletonPage>
      <PageHeaderSkeleton />
      <div
        className={cn(
          "grid gap-4",
          cards >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3",
        )}
      >
        {Array.from({ length: cards }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
      <div className={cn("grid gap-4", columns === 2 && "lg:grid-cols-2")}>
        <Skeleton className="h-64 w-full" />
        {columns === 2 ? <Skeleton className="h-64 w-full" /> : null}
      </div>
    </SkeletonPage>
  );
}

/** Daftar kartu (pemesanan, sesi, slot jadwal). */
export function ListSkeleton({
  rows = 4,
  rowClassName = "h-24",
  showHeader = true,
  showFilter = true,
}: {
  rows?: number;
  rowClassName?: string;
  showHeader?: boolean;
  showFilter?: boolean;
}) {
  return (
    <SkeletonPage>
      {showHeader ? <PageHeaderSkeleton /> : null}
      {showFilter ? <Skeleton className="h-9 w-56 max-w-full" /> : null}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className={cn("w-full", rowClassName)} />
        ))}
      </div>
    </SkeletonPage>
  );
}

/** Tabel admin: header, kolom pencarian, lalu baris tabel. */
export function TableSkeleton({
  rows = 6,
  showHeader = true,
  showSearch = true,
}: {
  rows?: number;
  showHeader?: boolean;
  showSearch?: boolean;
}) {
  return (
    <SkeletonPage label="Memuat tabel">
      {showHeader ? <PageHeaderSkeleton /> : null}
      {showSearch ? (
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 min-w-56 flex-1" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-20" />
        </div>
      ) : null}
      <div className="rounded-xl border bg-card p-3">
        <Skeleton className="mb-3 h-9 w-full" />
        <div className="space-y-2">
          {Array.from({ length: rows }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}

/** Halaman detail dengan header dan satu kartu besar. */
export function DetailSkeleton({ columns = 1 }: { columns?: 1 | 2 }) {
  return (
    <SkeletonPage>
      <Skeleton className="h-8 w-40" />
      <PageHeaderSkeleton />
      <div className={cn("grid gap-4", columns === 2 && "lg:grid-cols-2")}>
        <Skeleton className="h-72 w-full" />
        {columns === 2 ? <Skeleton className="h-72 w-full" /> : null}
      </div>
    </SkeletonPage>
  );
}

/** Ruang chat: header, area pesan, dan kolom kirim. */
export function ChatSkeleton() {
  return (
    <SkeletonPage label="Memuat ruang sesi">
      <Skeleton className="h-8 w-40" />
      <PageHeaderSkeleton />
      <div className="space-y-3 rounded-xl border p-4">
        <Skeleton className="h-14 w-2/3" />
        <Skeleton className="ml-auto h-14 w-1/2" />
        <Skeleton className="h-14 w-3/5" />
        <Skeleton className="ml-auto h-14 w-2/5" />
      </div>
      <Skeleton className="h-20 w-full" />
    </SkeletonPage>
  );
}

/** Katalog publik: header, filter, dan grid kartu. */
export function CatalogSkeleton({
  cards = 6,
  columns = 3,
}: {
  cards?: number;
  columns?: 2 | 3;
}) {
  return (
    <SkeletonPage>
      <PageHeaderSkeleton />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div
        className={cn(
          "grid gap-4",
          columns === 2 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {Array.from({ length: cards }).map((_, index) => (
          <Skeleton key={index} className="h-56 w-full" />
        ))}
      </div>
    </SkeletonPage>
  );
}

/** Halaman detail publik dengan kolom utama dan sidebar. */
export function PublicDetailSkeleton() {
  return (
    <SkeletonPage>
      <Skeleton className="h-8 w-40" />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-3/4 max-w-lg" />
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-56 w-full" />
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    </SkeletonPage>
  );
}

export function PublicPageSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10 sm:px-6"
      role="status"
      aria-busy="true"
      aria-label="Memuat konten"
    >
      <span className="sr-only">Memuat konten</span>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-12 w-full max-w-lg" />
          <Skeleton className="h-12 w-4/5 max-w-md" />
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-4 w-3/4 max-w-lg" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        <Skeleton className="hidden h-72 w-full lg:block" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-56 w-full" />
        ))}
      </div>
    </div>
  );
}

/** Grid kartu untuk halaman seperti daftar konselor. */
export function CardGridSkeleton({
  cards = 3,
  columns = 3,
}: {
  cards?: number;
  columns?: 2 | 3;
}) {
  return (
    <SkeletonPage>
      <PageHeaderSkeleton />
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-11 min-w-56 flex-1" />
        <Skeleton className="h-11 w-40" />
      </div>
      <div
        className={cn(
          "grid gap-5",
          columns === 3 ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2",
        )}
      >
        {Array.from({ length: cards }).map((_, index) => (
          <Skeleton key={index} className="h-[337px] w-full rounded-[12px]" />
        ))}
      </div>
    </SkeletonPage>
  );
}

/** Halaman auth: kartu hijau di kiri dan form di kanan. */
export function AuthSkeleton() {
  return (
    <SkeletonPage label="Memuat halaman masuk">
      <div className="grid gap-8 lg:grid-cols-[540px_1fr]">
        <Skeleton className="h-[653px] w-full rounded-[24px]" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </SkeletonPage>
  );
}
