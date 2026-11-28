"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  MethodVideoIcon,
  ShieldCheckLineIcon,
} from "@/components/ui/figma-icons";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/page-skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApi } from "@/lib/hooks/use-api";
import {
  PAYMENT_STATUS_LABEL,
  SESSION_STATUS_LABEL,
  formatDate,
  formatRupiah,
  formatTime,
  paymentStatusTone,
  sessionStatusTone,
} from "@/lib/format";
import type {
  Booking,
  CounselingSession,
  Paginated,
  Payment,
} from "@/lib/types/api";

type Tab = "bookings" | "payments" | "sessions";

const tabs: Array<{ key: Tab; label: string }> = [
  { key: "bookings", label: "Pemesanan" },
  { key: "payments", label: "Pembayaran" },
  { key: "sessions", label: "Sesi" },
];

const statusOptions: Record<Tab, Array<{ value: string; label: string }>> = {
  bookings: [
    { value: "", label: "Semua status" },
    { value: "pending_payment", label: "Menunggu pembayaran" },
    { value: "confirmed", label: "Terkonfirmasi" },
    { value: "cancelled", label: "Dibatalkan" },
    { value: "expired", label: "Kedaluwarsa" },
  ],
  payments: [
    { value: "", label: "Semua status" },
    { value: "pending", label: "Menunggu" },
    { value: "success", label: "Berhasil" },
    { value: "failed", label: "Gagal" },
    { value: "cancelled", label: "Dibatalkan" },
    { value: "expired", label: "Kedaluwarsa" },
  ],
  sessions: [
    { value: "", label: "Semua status" },
    { value: "scheduled", label: "Terjadwal" },
    { value: "active", label: "Berlangsung" },
    { value: "completed", label: "Selesai" },
  ],
};

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

function paymentMethodLabel(type: string | null): string {
  if (!type) return "Snap";
  const labels: Record<string, string> = {
    credit_card: "Kartu kredit",
    qris: "QRIS",
    bank_transfer: "Transfer bank",
    echannel: "E-channel",
    gopay: "GoPay",
    shopeepay: "ShopeePay",
    cstore: "Gerai retail",
    akulaku: "Akulaku",
  };
  return labels[type] ?? type.replace(/_/g, " ");
}

function zoomState(session: CounselingSession): {
  label: string;
  tone: "success" | "destructive" | "info";
} {
  if (session.zoom?.status === "created") {
    return { label: "Siap", tone: "success" };
  }
  if (session.zoom?.status === "failed") {
    return { label: "Gagal", tone: "destructive" };
  }
  return { label: "Belum tersedia", tone: "info" };
}

export function ReportsView() {
  const [tab, setTab] = useState<Tab>("bookings");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedSession, setSelectedSession] =
    useState<CounselingSession | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setApplied(search.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (applied) params.set("q", applied);
    if (status) params.set("status", status);
    if (from) {
      params.set("from", new Date(`${from}T00:00:00+07:00`).toISOString());
    }
    if (to) {
      params.set("to", new Date(`${to}T23:59:59+07:00`).toISOString());
    }
    return params.toString();
  }, [page, applied, status, from, to]);

  const bookings = useApi<Paginated<Booking>>(
    tab === "bookings" ? `/api/v1/admin/bookings?${query}` : null,
  );
  const payments = useApi<Paginated<Payment>>(
    tab === "payments" ? `/api/v1/admin/payments?${query}` : null,
  );
  const sessions = useApi<Paginated<CounselingSession>>(
    tab === "sessions" ? `/api/v1/admin/sessions?${query}` : null,
  );

  const active =
    tab === "bookings" ? bookings : tab === "payments" ? payments : sessions;
  const total = active.data?.total ?? 0;
  const totalPages = active.data?.totalPages ?? 1;

  function changeTab(next: Tab) {
    setTab(next);
    setPage(1);
    setStatus("");
    setSearch("");
    setApplied("");
    setFrom("");
    setTo("");
  }

  function reset() {
    setSearch("");
    setApplied("");
    setStatus("");
    setFrom("");
    setTo("");
    setPage(1);
  }

  const detailOpen = Boolean(
    selectedBooking || selectedPayment || selectedSession,
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Ruang kerja REHAT"
        title="Laporan Operasional"
        description="Kelola kebutuhanmu dengan lebih mudah di sini."
      />

      <div className="flex gap-1 border-b border-[#e1e7e1] dark:border-border">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => changeTab(item.key)}
            className={`-mb-px border-b-2 px-4 py-3 text-[12px] transition-colors ${
              tab === item.key
                ? "border-[#203b33] font-semibold text-[#203b33] dark:border-primary dark:text-foreground"
                : "border-transparent text-[#68746d] hover:text-[#203b33] dark:text-muted-foreground dark:hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-[10px] lg:flex-nowrap">
        <div className="relative min-w-[240px] flex-1">
          <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-[13px] size-[18px] -translate-y-1/2 text-[#68746d]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari laporan operasional..."
            className="h-11 pl-10 text-[12px]"
          />
        </div>
        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="h-11 w-[127px] text-[12px]"
          aria-label="Filter status"
        >
          {statusOptions[tab].map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
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
        {total}{" "}
        {tab === "bookings"
          ? "pemesanan"
          : tab === "payments"
            ? "pembayaran"
            : "sesi"}{" "}
        ditemukan
      </p>

      {active.loading ? (
        <TableSkeleton rows={6} showHeader={false} showSearch={false} />
      ) : active.error ? (
        <EmptyState
          title="Gagal memuat laporan"
          description={active.error}
          action={<Button onClick={() => void active.refetch()}>Coba lagi</Button>}
        />
      ) : !active.data || active.data.items.length === 0 ? (
        <EmptyState
          title="Tidak ada data"
          description="Coba ubah kata kunci atau filter."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-[13px] border border-[#e1e7e1] bg-white dark:border-border dark:bg-card">
            <Table>
              {tab === "bookings" ? (
                <>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[18%]">Pemesanan</TableHead>
                      <TableHead className="w-[26%]">
                        Peserta / Layanan
                      </TableHead>
                      <TableHead className="w-[11%]">
                        Metode
                      </TableHead>
                      <TableHead className="w-[20%]">
                        Jadwal / Waktu WIB
                      </TableHead>
                      <TableHead className="w-[14%]">
                        Status
                      </TableHead>
                      <TableHead className="w-[11%]">
                        Detail
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(bookings.data?.items ?? []).map((booking) => {
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
                              {booking.counselor.fullName} ·{" "}
                              {booking.serviceName}
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
                              onClick={() => setSelectedBooking(booking)}
                              className="text-[12px] leading-[19.2px] font-medium text-[#31594d] hover:underline dark:text-primary"
                            >
                              Lihat detail
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </>
              ) : null}

              {tab === "payments" ? (
                <>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[22%]">Transaksi</TableHead>
                      <TableHead className="w-[15%]">
                        Jumlah
                      </TableHead>
                      <TableHead className="w-[15%]">
                        Metode
                      </TableHead>
                      <TableHead className="w-[24%]">
                        Waktu Transaksi (WIB)
                      </TableHead>
                      <TableHead className="w-[13%]">
                        Status
                      </TableHead>
                      <TableHead className="w-[11%]">
                        Detail
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(payments.data?.items ?? []).map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="py-[22px]">
                          <p className="text-[12px] leading-[19.2px] font-medium text-[#203b33] dark:text-foreground">
                            {payment.midtransOrderId}
                          </p>
                        </TableCell>
                        <TableCell className="py-[22px] text-[12px] dark:border-border">
                          {formatRupiah(payment.grossAmount)}
                        </TableCell>
                        <TableCell className="py-[22px] dark:border-border">
                          <span className="text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                            {paymentMethodLabel(payment.paymentType)}
                          </span>
                        </TableCell>
                        <TableCell className="py-[22px] dark:border-border">
                          <span className="text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                            {payment.transactionTime
                              ? `${formatDate(payment.transactionTime)}, ${formatTime(payment.transactionTime)} WIB`
                              : "-"}
                          </span>
                        </TableCell>
                        <TableCell className="py-[22px] dark:border-border">
                          <Badge
                            variant={paymentStatusTone(payment.status)}
                            className="gap-1.5"
                          >
                            <span className="size-1 rounded-full bg-current" />
                            {PAYMENT_STATUS_LABEL[payment.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-[22px] dark:border-border">
                          <button
                            type="button"
                            onClick={() => setSelectedPayment(payment)}
                            className="text-[12px] leading-[19.2px] font-medium text-[#31594d] hover:underline dark:text-primary"
                          >
                            Lihat detail
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </>
              ) : null}

              {tab === "sessions" ? (
                <>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[18%]">Pemesanan</TableHead>
                      <TableHead className="w-[26%]">
                        Peserta / Layanan
                      </TableHead>
                      <TableHead className="w-[11%]">
                        Metode
                      </TableHead>
                      <TableHead className="w-[20%]">
                        Jadwal / Waktu WIB
                      </TableHead>
                      <TableHead className="w-[14%]">
                        Status
                      </TableHead>
                      <TableHead className="w-[11%]">
                        Detail
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(sessions.data?.items ?? []).map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="py-[22px]">
                          <p className="text-[12px] leading-[19.2px] font-medium text-[#203b33] dark:text-foreground">
                            {session.booking.bookingCode}
                          </p>
                        </TableCell>
                        <TableCell className="py-[22px] dark:border-border">
                          <p className="text-[12px] leading-[19.2px] text-[#203b33] dark:text-foreground">
                            {session.patient.fullName}
                          </p>
                          <p className="text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                            {session.counselor.fullName} ·{" "}
                            {session.booking.serviceName}
                          </p>
                        </TableCell>
                        <TableCell className="py-[22px] dark:border-border">
                          <span className="text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                            {session.booking.method === "chat" ? "Chat" : "Zoom"}
                          </span>
                        </TableCell>
                        <TableCell className="py-[22px] dark:border-border">
                          <p className="text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                            {formatDate(session.booking.scheduledStart)}
                          </p>
                          <p className="text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                            {formatTime(session.booking.scheduledStart)} WIB
                          </p>
                        </TableCell>
                        <TableCell className="py-[22px] dark:border-border">
                          <Badge
                            variant={sessionStatusTone(session.status)}
                            className="gap-1.5"
                          >
                            <span className="size-1 rounded-full bg-current" />
                            {SESSION_STATUS_LABEL[session.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-[22px] dark:border-border">
                          <button
                            type="button"
                            onClick={() => setSelectedSession(session)}
                            className="text-[12px] leading-[19.2px] font-medium text-[#31594d] hover:underline dark:text-primary"
                          >
                            Lihat detail
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </>
              ) : null}
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              href={
                tab === "bookings"
                  ? "/admin/bookings"
                  : tab === "payments"
                    ? "/admin/payments"
                    : "/admin/sessions"
              }
              className="text-[11px] leading-[18px] font-semibold text-[#31594d] hover:underline dark:text-primary"
            >
              Buka halaman{" "}
              {tab === "bookings"
                ? "pemesanan"
                : tab === "payments"
                  ? "pembayaran"
                  : "sesi"}
            </Link>
            {totalPages > 1 ? (
              <Pagination
                page={active.data.page}
                totalPages={totalPages}
                total={total}
                onPageChange={setPage}
              />
            ) : null}
          </div>
        </>
      )}

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          if (open) return;
          setSelectedBooking(null);
          setSelectedPayment(null);
          setSelectedSession(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-[calc(100%-2rem)] sm:max-w-[540px]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[#e1e7e1] pb-[18px] dark:border-border">
            <DialogTitle className="text-[18px] leading-[28.8px]">
              {selectedPayment
                ? "Detail pembayaran"
                : `Detail sesi · ${
                    selectedBooking?.bookingCode ??
                    selectedSession?.booking.bookingCode ??
                    ""
                  }`}
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

          {selectedBooking ? (
            <div>
              <div className="mt-[22px]">
                <Badge
                  variant={bookingState(selectedBooking).tone}
                  className="gap-1.5"
                >
                  <span className="size-1 rounded-full bg-current" />
                  {bookingState(selectedBooking).label}
                </Badge>
              </div>
              <p className="mt-[18px] text-[23px] leading-[36.8px] font-semibold text-[#203b33] dark:text-foreground">
                {selectedBooking.serviceName}
              </p>
              <dl className="mt-[10px] divide-y divide-[#edf0eb] text-[12px] leading-[19.2px] dark:divide-border">
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    Pasien
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {selectedBooking.patient.fullName}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    Konselor
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {selectedBooking.counselor.fullName}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    Metode
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {selectedBooking.method === "chat" ? "Chat" : "Zoom"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    Jadwal
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {formatDate(selectedBooking.scheduledStart)}
                    <br />
                    {formatTime(selectedBooking.scheduledStart)} WIB ·{" "}
                    {selectedBooking.durationMinutes} menit
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

          {selectedPayment ? (
            <div>
              <div className="mt-[22px]">
                <Badge
                  variant={paymentStatusTone(selectedPayment.status)}
                  className="gap-1.5"
                >
                  <span className="size-1 rounded-full bg-current" />
                  {PAYMENT_STATUS_LABEL[selectedPayment.status]}
                </Badge>
              </div>
              <p className="mt-[18px] text-[23px] leading-[36.8px] font-semibold text-[#203b33] dark:text-foreground">
                {formatRupiah(selectedPayment.grossAmount)}
              </p>
              <dl className="mt-[10px] divide-y divide-[#edf0eb] text-[12px] leading-[19.2px] dark:divide-border">
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    ID transaksi
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {selectedPayment.midtransOrderId}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    Pemesanan
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {selectedPayment.booking?.bookingCode ?? "-"}
                    <br />
                    {selectedPayment.booking?.serviceName ?? ""}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    Pasien
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {selectedPayment.patient?.fullName ?? "-"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    Metode
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {paymentMethodLabel(selectedPayment.paymentType)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    Waktu transaksi
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {selectedPayment.transactionTime
                      ? `${formatDate(selectedPayment.transactionTime)}, ${formatTime(selectedPayment.transactionTime)} WIB`
                      : "-"}
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
                    Detail instrumen pembayaran tidak tersedia untuk admin.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {selectedSession ? (
            <div>
              <div className="mt-[22px]">
                <Badge
                  variant={sessionStatusTone(selectedSession.status)}
                  className="gap-1.5"
                >
                  <span className="size-1 rounded-full bg-current" />
                  {SESSION_STATUS_LABEL[selectedSession.status]}
                </Badge>
              </div>
              <p className="mt-[18px] text-[23px] leading-[36.8px] font-semibold text-[#203b33] dark:text-foreground">
                {selectedSession.booking.serviceName}
              </p>
              <dl className="mt-[10px] divide-y divide-[#edf0eb] text-[12px] leading-[19.2px] dark:divide-border">
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    Pasien
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {selectedSession.patient.fullName}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    Konselor
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {selectedSession.counselor.fullName}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    Metode
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {selectedSession.booking.method === "chat" ? "Chat" : "Zoom"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    Jadwal
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {formatDate(selectedSession.booking.scheduledStart)}
                    <br />
                    {formatTime(selectedSession.booking.scheduledStart)} WIB ·{" "}
                    {selectedSession.booking.durationMinutes} menit
                  </dd>
                </div>
              </dl>
              {selectedSession.booking.method === "zoom" ? (
                (() => {
                  const zoom = zoomState(selectedSession);
                  return (
                    <div className="mt-[25px] rounded-[10px] bg-[#eff6f2] p-4 dark:bg-accent">
                      <div className="flex flex-wrap items-center gap-2">
                        <MethodVideoIcon className="size-5 text-[#31594d] dark:text-accent-foreground" />
                        <p className="text-[12px] leading-[19.2px] font-semibold text-[#203b33] dark:text-foreground">
                          Integrasi Zoom
                        </p>
                        <Badge variant={zoom.tone} className="gap-1.5">
                          <span className="size-1 rounded-full bg-current" />
                          {zoom.label}
                        </Badge>
                      </div>
                      <p className="mt-3 text-[11px] leading-[18px] text-[#68746d] dark:text-muted-foreground">
                        Status pembuatan meeting
                      </p>
                      <p className="mt-1 text-[12px] leading-[19.2px] text-[#203b33] dark:text-foreground">
                        {zoom.label === "Gagal"
                          ? "Meeting belum berhasil dibuat. Silakan coba menyiapkan ruang meeting kembali."
                          : zoom.label === "Siap"
                            ? "Meeting berhasil dibuat dan siap diakses peserta saat sesi aktif."
                            : "Meeting sedang disiapkan. Silakan periksa kembali beberapa saat lagi."}
                      </p>
                      <div className="my-3 h-px bg-[#dbe5da] dark:bg-border" />
                      <p className="text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                        Akses meeting hanya tersedia untuk pasien dan konselor
                        yang mengikuti sesi.
                      </p>
                    </div>
                  );
                })()
              ) : (
                <div className="mt-[25px] flex items-start gap-3 rounded-[10px] bg-[#eff6f2] p-4 dark:bg-accent">
                  <ShieldCheckLineIcon className="mt-0.5 size-5 shrink-0 text-[#31594d] dark:text-accent-foreground" />
                  <div>
                    <p className="text-[12px] leading-[19.2px] font-semibold text-[#203b33] dark:text-foreground">
                      Metadata operasional saja
                    </p>
                    <p className="mt-0.5 text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                      Isi percakapan tidak tersedia untuk admin.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
