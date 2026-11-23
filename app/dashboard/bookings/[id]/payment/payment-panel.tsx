"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  CreditCard,
  SpinnerGap,
  ArrowsClockwise,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { startNavigationProgress } from "@/components/layout/navigation-progress";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineLoading, LoadingOverlay } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { DetailSkeleton } from "@/components/ui/page-skeleton";
import { apiFetch, errorMessage } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/use-api";
import {
  BOOKING_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  bookingStatusTone,
  formatDateTime,
  formatRupiah,
  paymentStatusTone,
} from "@/lib/format";
import type { Booking, Payment, PaymentAttempt } from "@/lib/types/api";

let snapPromise: Promise<void> | null = null;

function loadSnap(scriptUrl: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.snap) return Promise.resolve();
  if (snapPromise) return snapPromise;

  snapPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("midtrans-snap");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("snap")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "midtrans-snap";
    script.src = scriptUrl;
    script.setAttribute(
      "data-client-key",
      process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "",
    );
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("snap"));
    document.body.appendChild(script);
  });

  return snapPromise;
}

export function PaymentPanel({ snapScriptUrl }: { snapScriptUrl: string }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const booking = useApi<Booking>(id ? `/api/v1/bookings/${id}` : null);
  const payments = useApi<Payment[]>(
    id ? `/api/v1/bookings/${id}/payments` : null,
  );
  const [loading, setLoading] = useState(false);

  const refetchBooking = booking.refetch;
  const refetchPayments = payments.refetch;

  const refetchAll = useCallback(async () => {
    await Promise.all([refetchBooking(), refetchPayments()]);
  }, [refetchBooking, refetchPayments]);

  useEffect(() => {
    void loadSnap(snapScriptUrl).catch(() => undefined);
  }, [snapScriptUrl]);

  async function handlePay() {
    setLoading(true);

    try {
      const attempt = await apiFetch<PaymentAttempt>(
        `/api/v1/bookings/${id}/payments`,
        { method: "POST" },
      );

      try {
        await loadSnap(snapScriptUrl);
      } catch {
        if (attempt.redirectUrl) {
          window.location.href = attempt.redirectUrl;
          return;
        }
        throw new Error(
          "Halaman pembayaran gagal dimuat. Periksa koneksi lalu coba lagi.",
        );
      }

      if (!window.snap) {
        if (attempt.redirectUrl) {
          window.location.href = attempt.redirectUrl;
          return;
        }
        throw new Error("Halaman pembayaran tidak tersedia.");
      }

      window.snap.pay(attempt.snapToken, {
        onSuccess: () => {
          toast.success("Pembayaran berhasil. Status akan diperbarui otomatis.");
          startNavigationProgress(`/dashboard/bookings/${id}?paid=1`);
          router.push(`/dashboard/bookings/${id}?paid=1`);
          router.refresh();
        },
        onPending: () => {
          toast.info(
            "Pembayaran menunggu penyelesaian. Ikuti instruksi pada halaman pembayaran.",
          );
          void refetchAll();
        },
        onError: () => {
          toast.error("Pembayaran gagal. Coba lagi atau gunakan metode lain.");
          void refetchAll();
        },
        onClose: () => {
          void refetchAll();
        },
      });
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }

  if (booking.loading) {
    return <DetailSkeleton columns={2} />;
  }

  if (booking.error || !booking.data) {
    return (
      <EmptyState
        title="Pemesanan tidak ditemukan"
        description={booking.error ?? "Data pemesanan tidak tersedia."}
        action={
          <Button asChild>
            <Link href="/dashboard/bookings">Kembali</Link>
          </Button>
        }
      />
    );
  }

  const data = booking.data;
  const canPay = data.status === "pending_payment";
  const paid = data.status === "confirmed";

  return (
    <div
      className="space-y-6"
      aria-busy={booking.refreshing || payments.refreshing}
    >
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/dashboard/bookings/${data.id}`}>
          <ArrowLeft />
          Detail pemesanan
        </Link>
      </Button>

      <PageHeader
        date={false}
        eyebrow="Pembayaran"
        title="Pembayaran sesi"
        description="Periksa rincian tagihan sebelum mengonfirmasi pembayaran sesi."
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={booking.refreshing || payments.refreshing}
            onClick={() => void refetchAll()}
          >
            {booking.refreshing || payments.refreshing ? (
              <SpinnerGap className="animate-spin" />
            ) : (
              <ArrowsClockwise />
            )}
            {booking.refreshing || payments.refreshing
              ? "Memperbarui..."
              : "Perbarui status"}
          </Button>
        }
      />

      {paid ? (
        <Alert variant="success">
          <span className="flex items-center gap-2">
            <CheckCircle className="size-4" />
            Pembayaran sudah diterima. Sesi kamu terkonfirmasi.
          </span>
        </Alert>
      ) : null}

      {data.status === "expired" ? (
        <Alert variant="destructive">
          Batas waktu pembayaran sudah lewat. Slot telah dilepas. Silakan buat
          pemesanan baru.
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="text-sm text-muted-foreground">Total tagihan</p>
                <p className="font-heading text-3xl font-semibold">
                  {formatRupiah(data.price)}
                </p>
              </div>
              <Badge variant={bookingStatusTone(data.status)}>
                {BOOKING_STATUS_LABEL[data.status]}
              </Badge>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Kode pemesanan</p>
                <p className="font-mono">{data.bookingCode}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Konselor</p>
                <p className="font-medium">{data.counselor.fullName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Jadwal</p>
                <p className="font-medium">{formatDateTime(data.scheduledStart)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Batas pembayaran</p>
                <p className="font-medium">
                  {data.paymentExpiresAt
                    ? formatDateTime(data.paymentExpiresAt)
                    : "-"}
                </p>
              </div>
            </div>

            {canPay ? (
              <Button
                size="lg"
                className="w-full"
                disabled={loading}
                onClick={handlePay}
              >
                {loading ? (
                  <SpinnerGap className="animate-spin" />
                ) : (
                  <CreditCard />
                )}
                {loading ? "Menyiapkan pembayaran..." : "Bayar sekarang"}
              </Button>
            ) : null}

            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              Pembayaran diproses aman oleh Midtrans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Riwayat transaksi</CardTitle>
            {payments.refreshing ? <InlineLoading /> : null}
          </CardHeader>
          <CardContent className="space-y-3">
            {payments.loading ? (
              <div className="flex h-20 items-center justify-center">
                <InlineLoading label="Memuat transaksi..." />
              </div>
            ) : !payments.data || payments.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada transaksi.
              </p>
            ) : (
              payments.data.map((payment) => (
                <div key={payment.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs">
                      {payment.midtransOrderId}
                    </span>
                    <Badge variant={paymentStatusTone(payment.status)}>
                      {PAYMENT_STATUS_LABEL[payment.status]}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatRupiah(payment.grossAmount)}</span>
                    <span>{formatDateTime(payment.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      {loading ? (
        <LoadingOverlay label="Menyiapkan pembayaran..." />
      ) : null}
    </div>
  );
}
