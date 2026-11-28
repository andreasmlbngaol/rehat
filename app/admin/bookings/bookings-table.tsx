"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ShieldCheckLineIcon } from "@/components/ui/figma-icons";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/page-skeleton";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApi } from "@/lib/hooks/use-api";
import { formatDate, formatTime } from "@/lib/format";
import type { Booking, Paginated } from "@/lib/types/api";

function DateFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <label className="flex items-center gap-[7px] text-[12px] leading-[19.2px] text-[#68746d] dark:text-muted-foreground">
      {label}
      <span className="relative inline-flex">
        <button
          type="button"
          onClick={() => {
            const input = ref.current;
            if (!input) return;
            if (typeof input.showPicker === "function") input.showPicker();
            else input.focus();
          }}
          className="h-11 w-[127.5px] rounded-[9px] border border-[#c4cec5] bg-white px-3 text-left text-[12px] whitespace-nowrap text-[#203b33] dark:border-border dark:bg-card dark:text-foreground"
        >
          {value ? formatDate(`${value}T00:00:00+07:00`) : ""}
        </button>
        <input
          ref={ref}
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="sr-only"
          tabIndex={-1}
          aria-label={`${label} tanggal`}
        />
      </span>
    </label>
  );
}

function bookingState(booking: Booking): {
  label: string;
  tone: "success" | "warning" | "destructive" | "info" | "secondary";
} {
  if (booking.status === "pending_payment") {
    return { label: "Menunggu pembayaran", tone: "warning" };
  }
  if (booking.status === "cancelled") {
    return { label: "Dibatalkan", tone: "destructive" };
  }
  if (booking.status === "expired") {
    return { label: "Kedaluwarsa", tone: "destructive" };
  }
  if (booking.session?.status === "scheduled") {
    return { label: "Terjadwal", tone: "info" };
  }
  if (booking.session?.status === "active") {
    return { label: "Aktif", tone: "success" };
  }
  if (booking.session?.status === "completed") {
    return { label: "Selesai", tone: "secondary" };
  }
  return { label: "Terkonfirmasi", tone: "success" };
}

export function BookingsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<Booking | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setApplied(search.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const path = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (applied) params.set("q", applied);
    if (status) params.set("status", status);
    if (from) {
      params.set("from", new Date(`${from}T00:00:00+07:00`).toISOString());
    }
    if (to) {
      params.set("to", new Date(`${to}T23:59:59+07:00`).toISOString());
    }
    return `/api/v1/admin/bookings?${params.toString()}`;
  }, [page, applied, status, from, to]);

  const list = useApi<Paginated<Booking>>(path);

  function reset() {
    setSearch("");
    setStatus("");
    setFrom("");
    setTo("");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ruang Admin"
        title="Pemesanan"
        description="Kelola kebutuhanmu dengan lebih mudah di sini."
      />

      <div className="flex flex-wrap items-center gap-[10px] lg:flex-nowrap">
        <div className="relative w-full min-w-[240px] sm:w-[449px] sm:flex-none">
          <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-[13px] size-[18px] -translate-y-1/2 text-[#68746d]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari pemesanan..."
            className="h-11 pl-10 text-[12px]"
          />
        </div>
        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="h-11 w-[183px] text-[12px]"
          aria-label="Filter status"
        >
          <option value="">Semua status</option>
          <option value="pending_payment">Menunggu pembayaran</option>
          <option value="confirmed">Terkonfirmasi</option>
          <option value="cancelled">Dibatalkan</option>
          <option value="expired">Kedaluwarsa</option>
        </Select>
        <DateFilter label="Dari" value={from} onChange={setFrom} />
        <DateFilter label="Sampai" value={to} onChange={setTo} />
        {from || to || status || search ? (
          <button
            type="button"
            onClick={reset}
            className="ml-auto text-[11px] leading-[18px] font-semibold text-[#31594d] hover:underline dark:text-primary"
          >
            Reset filter
          </button>
        ) : null}
      </div>

      <p className="text-[12px] leading-[19.2px] text-[#68746d] dark:text-muted-foreground">
        {list.data?.total ?? 0} pemesanan ditemukan
      </p>

      {list.loading ? (
        <TableSkeleton rows={6} showHeader={false} showSearch={false} />
      ) : list.error ? (
        <EmptyState title="Gagal memuat pemesanan" description={list.error} />
      ) : !list.data || list.data.items.length === 0 ? (
        <EmptyState
          title="Tidak ada pemesanan"
          description="Coba ubah filter atau kata kunci."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-[13px] border border-[#e1e7e1] bg-white dark:border-border dark:bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[16%]">Pemesanan</TableHead>
                  <TableHead className="w-[27%]">
                    Peserta / Layanan
                  </TableHead>
                  <TableHead className="w-[11%]">
                    Metode
                  </TableHead>
                  <TableHead className="w-[19%]">
                    Jadwal / Waktu WIB
                  </TableHead>
                  <TableHead className="w-[15%]">
                    Status
                  </TableHead>
                  <TableHead className="w-[12%]">
                    Detail
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data.items.map((booking) => {
                  const state = bookingState(booking);
                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="py-[22px]">
                        <p className="text-[12px] leading-[19.2px] font-medium text-[#203b33] dark:text-foreground">
                          {booking.bookingCode}
                        </p>
                      </TableCell>
                      <TableCell className="py-[22px] dark:border-border">
                        <p className="text-[12px] leading-[19.2px] text-[#203b33] dark:text-foreground">
                          {booking.patient.fullName}
                        </p>
                        <p className="text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                          {booking.counselor.fullName} · {booking.serviceName}
                        </p>
                      </TableCell>
                      <TableCell className="py-[22px] dark:border-border">
                        <span className="text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                          {booking.method === "chat" ? "Chat" : "Zoom"}
                        </span>
                      </TableCell>
                      <TableCell className="py-[22px] dark:border-border">
                        <p className="text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                          {formatDate(booking.scheduledStart)}
                        </p>
                        <p className="text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                          {formatTime(booking.scheduledStart)} WIB
                        </p>
                      </TableCell>
                      <TableCell className="py-[22px] dark:border-border">
                        <Badge variant={state.tone} className="gap-1.5">
                          <span className="size-1 rounded-full bg-current" />
                          {state.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-[22px] dark:border-border">
                        <button
                          type="button"
                          onClick={() => setSelected(booking)}
                          className="text-[12px] leading-[19.2px] font-medium text-[#31594d] hover:underline dark:text-primary"
                        >
                          Lihat detail
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {(list.data.totalPages ?? 1) > 1 ? (
            <Pagination
              page={list.data.page}
              totalPages={list.data.totalPages}
              total={list.data.total}
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-[calc(100%-2rem)] sm:max-w-[540px]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[#e1e7e1] pb-[18px] dark:border-border">
            <DialogTitle className="text-[18px] leading-[28.8px]">
              Detail sesi · {selected?.bookingCode}
            </DialogTitle>
            <DialogClose asChild>
              <button
                type="button"
                aria-label="Tutup"
                className="-mt-1 flex size-11 shrink-0 items-center justify-center rounded-[8px] text-[#59645f] transition-colors hover:bg-[#f5f7f5] dark:text-muted-foreground dark:hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </DialogClose>
          </div>

          {selected ? (
            <div>
              <div className="mt-[22px]">
                <Badge
                  variant={bookingState(selected).tone}
                  className="gap-1.5"
                >
                  <span className="size-1 rounded-full bg-current" />
                  {bookingState(selected).label}
                </Badge>
              </div>

              <p className="mt-[18px] text-[23px] leading-[36.8px] font-semibold text-[#203b33] dark:text-foreground">
                {selected.serviceName}
              </p>

              <dl className="mt-[10px] divide-y divide-[#edf0eb] text-[12px] leading-[19.2px] dark:divide-border">
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    Pasien
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {selected.patient.fullName}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    Konselor
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {selected.counselor.fullName}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    Metode
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {selected.method === "chat" ? "Chat" : "Zoom"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    Jadwal
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {formatDate(selected.scheduledStart)}
                    <br />
                    {formatTime(selected.scheduledStart)} WIB ·{" "}
                    {selected.durationMinutes} menit
                  </dd>
                </div>
              </dl>

              <div className="mt-[25px] flex items-start gap-3 rounded-[10px] bg-[#eff6f2] p-4 dark:bg-accent">
                <ShieldCheckLineIcon className="mt-0.5 size-5 shrink-0 text-[#31594d] dark:text-accent-foreground" />
                <div>
                  <p className="text-[12px] leading-[19.2px] font-semibold text-[#203b33] dark:text-foreground">
                    Metadata operasional saja
                  </p>
                  <p className="mt-0.5 text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                    Isi chat dan tautan meeting tidak tersedia untuk admin.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
