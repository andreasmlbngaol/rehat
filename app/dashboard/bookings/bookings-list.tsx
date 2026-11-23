"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CreditCard,
  ChatTeardropText,
  Plus,
  VideoCamera,
} from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { ListSkeleton } from "@/components/ui/page-skeleton";
import { Select } from "@/components/ui/select";
import { useApi } from "@/lib/hooks/use-api";
import {
  BOOKING_STATUS_LABEL,
  METHOD_LABEL,
  bookingStatusTone,
  formatDateTime,
  formatRupiah,
} from "@/lib/format";
import type { Booking, Paginated } from "@/lib/types/api";

const statusOptions = [
  { value: "", label: "Semua status" },
  { value: "pending_payment", label: "Menunggu pembayaran" },
  { value: "confirmed", label: "Terkonfirmasi" },
  { value: "cancelled", label: "Dibatalkan" },
  { value: "expired", label: "Kedaluwarsa" },
];

export function BookingsList() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const path = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (status) params.set("status", status);
    return `/api/v1/bookings?${params.toString()}`;
  }, [page, status]);

  const { data, loading, error } = useApi<Paginated<Booking>>(path);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ruang untuk dirimu"
        title="Pemesanan"
        description="Kelola kebutuhanmu dengan lebih mudah di sini."
        actions={
          <Button asChild>
            <Link href="/dashboard/bookings/new">
              <Plus />
              Pesan sesi
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="w-56"
          aria-label="Filter status"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <ListSkeleton
          rows={4}
          rowClassName="h-24"
          showHeader={false}
          showFilter={false}
        />
      ) : error ? (
        <EmptyState title="Gagal memuat pemesanan" description={error} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="Belum ada pemesanan"
          description="Mulai dengan memilih layanan dan jadwal yang tersedia."
          action={
            <Button asChild>
              <Link href="/dashboard/bookings/new">Pesan sesi</Link>
            </Button>
          }
          icon={<CalendarCheck className="size-8" />}
        />
      ) : (
        <>
          <div className="space-y-3">
            {data.items.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/dashboard/bookings/${booking.id}`}
                        className="font-medium hover:underline"
                      >
                        {booking.serviceName}
                      </Link>
                      <Badge variant={bookingStatusTone(booking.status)}>
                        {BOOKING_STATUS_LABEL[booking.status]}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        {booking.method === "chat" ? (
                          <ChatTeardropText className="size-3" />
                        ) : (
                          <VideoCamera className="size-3" />
                        )}
                        {METHOD_LABEL[booking.method]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(booking.scheduledStart)} ·{" "}
                      {booking.durationMinutes} menit
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {booking.bookingCode} · {booking.counselor.fullName} ·{" "}
                      {formatRupiah(booking.price)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {booking.status === "pending_payment" ? (
                      <Button size="sm" asChild>
                        <Link href={`/dashboard/bookings/${booking.id}/payment`}>
                          <CreditCard />
                          Bayar
                        </Link>
                      </Button>
                    ) : null}
                    {booking.session ? (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/sessions/${booking.session.id}`}>
                          Masuk sesi
                        </Link>
                      </Button>
                    ) : null}
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/dashboard/bookings/${booking.id}`}>
                        Detail
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
