"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarCheck,
  CreditCard,
  SpinnerGap,
  ChatTeardropText,
  ArrowsClockwise,
  VideoCamera,
} from "@phosphor-icons/react/dist/ssr";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { DetailSkeleton } from "@/components/ui/page-skeleton";
import { useApi } from "@/lib/hooks/use-api";
import {
  BOOKING_STATUS_LABEL,
  METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  bookingStatusTone,
  formatDateTime,
  formatRupiah,
  paymentStatusTone,
} from "@/lib/format";
import type { Booking } from "@/lib/types/api";

export function BookingDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: booking, loading, refreshing, error, refetch } =
    useApi<Booking>(id ? `/api/v1/bookings/${id}` : null);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error || !booking) {
    return (
      <EmptyState
        title="Pemesanan tidak ditemukan"
        description={error ?? "Data pemesanan tidak tersedia."}
        action={
          <Button asChild>
            <Link href="/dashboard/bookings">Kembali</Link>
          </Button>
        }
      />
    );
  }

  const canPay = booking.status === "pending_payment";

  return (
    <div className="space-y-6" aria-busy={refreshing}>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/bookings">
          <ArrowLeft />
          Semua pemesanan
        </Link>
      </Button>

      <PageHeader
        date={false}
        eyebrow={booking.bookingCode}
        title={booking.serviceName}
        description={`${formatDateTime(booking.scheduledStart)} · ${booking.durationMinutes} menit`}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={refreshing}
              onClick={() => void refetch()}
            >
              {refreshing ? (
                <SpinnerGap className="animate-spin" />
              ) : (
                <ArrowsClockwise />
              )}
              {refreshing ? "Memperbarui..." : "Perbarui"}
            </Button>
            {canPay ? (
              <Button size="sm" asChild>
                <Link href={`/dashboard/bookings/${booking.id}/payment`}>
                  <CreditCard />
                  Bayar
                </Link>
              </Button>
            ) : null}
            {booking.session ? (
              <Button size="sm" asChild>
                <Link href={`/dashboard/sessions/${booking.session.id}`}>
                  Masuk sesi
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      {canPay && booking.paymentExpiresAt ? (
        <Alert variant="warning">
          Selesaikan pembayaran sebelum{" "}
          <strong>{formatDateTime(booking.paymentExpiresAt)}</strong>. Setelah
          batas waktu, slot akan dilepas otomatis.
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <CardHeader>
            <CardTitle>Detail sesi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge
                  variant={bookingStatusTone(booking.status)}
                  className="mt-1"
                >
                  {BOOKING_STATUS_LABEL[booking.status]}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Metode</p>
                <p className="mt-1 flex items-center gap-1.5 font-medium">
                  {booking.method === "chat" ? (
                    <ChatTeardropText className="size-4" />
                  ) : (
                    <VideoCamera className="size-4" />
                  )}
                  {METHOD_LABEL[booking.method]}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Konselor</p>
                <p className="mt-1 font-medium">{booking.counselor.fullName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Jadwal</p>
                <p className="mt-1 font-medium">
                  {formatDateTime(booking.scheduledStart)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Durasi</p>
                <p className="mt-1 font-medium">{booking.durationMinutes} menit</p>
              </div>
              <div>
                <p className="text-muted-foreground">Harga</p>
                <p className="mt-1 font-heading text-lg font-semibold">
                  {formatRupiah(booking.price)}
                </p>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <CalendarCheck className="size-4 text-primary" />
                Kode pemesanan
              </p>
              <p className="mt-1 font-mono text-sm">{booking.bookingCode}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {booking.payment ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={paymentStatusTone(booking.payment.status)}>
                    {PAYMENT_STATUS_LABEL[booking.payment.status]}
                  </Badge>
                </div>
                {booking.payment.grossAmount ? (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Jumlah</span>
                    <span className="font-medium">
                      {formatRupiah(booking.payment.grossAmount)}
                    </span>
                  </div>
                ) : null}
                {booking.payment.paymentType ? (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Metode</span>
                    <span className="font-medium">
                      {booking.payment.paymentType}
                    </span>
                  </div>
                ) : null}
                {booking.payment.transactionTime ? (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Waktu</span>
                    <span className="font-medium">
                      {formatDateTime(booking.payment.transactionTime)}
                    </span>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-muted-foreground">
                Belum ada transaksi pembayaran.
              </p>
            )}

            {canPay ? (
              <Button className="w-full" asChild>
                <Link href={`/dashboard/bookings/${booking.id}/payment`}>
                  <CreditCard />
                  Bayar sekarang
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
