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
import {
  PAYMENT_STATUS_LABEL,
  formatDate,
  formatRupiah,
  formatTime,
  paymentStatusTone,
} from "@/lib/format";
import type { Paginated, Payment } from "@/lib/types/api";

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

export function PaymentsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<Payment | null>(null);

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
    return `/api/v1/admin/payments?${params.toString()}`;
  }, [page, applied, status, from, to]);

  const list = useApi<Paginated<Payment>>(path);

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
        title="Pembayaran"
        description="Kelola kebutuhanmu dengan lebih mudah di sini."
      />

      <div className="flex flex-wrap items-center gap-[10px] lg:flex-nowrap">
        <div className="relative w-full min-w-[240px] sm:w-[449px] sm:flex-none">
          <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-[13px] size-[18px] -translate-y-1/2 text-[#68746d]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari pembayaran..."
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
          <option value="pending">Menunggu</option>
          <option value="success">Berhasil</option>
          <option value="failed">Gagal</option>
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
        {list.data?.total ?? 0} pembayaran ditemukan
      </p>

      {list.loading ? (
        <TableSkeleton rows={6} showHeader={false} showSearch={false} />
      ) : list.error ? (
        <EmptyState title="Gagal memuat pembayaran" description={list.error} />
      ) : !list.data || list.data.items.length === 0 ? (
        <EmptyState
          title="Tidak ada pembayaran"
          description="Coba ubah filter atau kata kunci."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-[13px] border border-[#e1e7e1] bg-white dark:border-border dark:bg-card">
            <Table>
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
                {list.data.items.map((payment) => (
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
                        onClick={() => setSelected(payment)}
                        className="text-[12px] leading-[19.2px] font-medium text-[#31594d] hover:underline dark:text-primary"
                      >
                        Lihat detail
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
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
              Detail pembayaran
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
                  variant={paymentStatusTone(selected.status)}
                  className="gap-1.5"
                >
                  <span className="size-1 rounded-full bg-current" />
                  {PAYMENT_STATUS_LABEL[selected.status]}
                </Badge>
              </div>

              <p className="mt-[18px] text-[23px] leading-[36.8px] font-semibold text-[#203b33] dark:text-foreground">
                {formatRupiah(selected.grossAmount)}
              </p>

              <dl className="mt-[10px] divide-y divide-[#edf0eb] text-[12px] leading-[19.2px] dark:divide-border">
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    ID transaksi
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {selected.midtransOrderId}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    Pemesanan
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {selected.booking?.bookingCode ?? "-"}
                    <br />
                    {selected.booking?.serviceName ?? ""}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    Pasien
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {selected.patient?.fullName ?? "-"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    Metode
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {paymentMethodLabel(selected.paymentType)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    Waktu transaksi
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {selected.transactionTime
                      ? `${formatDate(selected.transactionTime)}, ${formatTime(selected.transactionTime)} WIB`
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
