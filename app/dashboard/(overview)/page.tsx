import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowRight,
  CalendarCheck,
  ChatTeardropText,
  CreditCard,
  VideoCamera,
} from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  CalendarTrustIcon,
  ChatTrustIcon,
  CheckLineIcon,
  ClockPrepIcon,
  LeafBannerIcon,
} from "@/components/ui/figma-icons";
import { requirePageUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { expireStaleBookings, bookingInclude } from "@/lib/services/booking.service";
import { reconcileSessionsForUser } from "@/lib/services/session.service";
import {
  BOOKING_STATUS_LABEL,
  METHOD_LABEL,
  SESSION_STATUS_LABEL,
  bookingStatusTone,
  formatDateTime,
  formatRupiah,
  sessionStatusTone,
} from "@/lib/format";

export const instant = false;

const stats = [
  { key: "upcoming", label: "Sesi mendatang", icon: CalendarTrustIcon },
  { key: "active", label: "Sesi aktif", icon: ChatTrustIcon },
  { key: "pending", label: "Menunggu pembayaran", icon: ClockPrepIcon },
  { key: "completed", label: "Sesi selesai", icon: CheckLineIcon },
] as const;

export default async function PatientDashboardPage() {
  await connection();
  const user = await requirePageUser(["patient"]);

  await Promise.all([expireStaleBookings(), reconcileSessionsForUser(user)]);

  const now = new Date();

  const [
    pendingBooking,
    bookings,
    upcomingCount,
    activeCount,
    completedCount,
    pendingCount,
  ] = await Promise.all([
    prisma.booking.findFirst({
      where: {
        patientId: user.id,
        status: "pending_payment",
        paymentExpiresAt: { gt: now },
      },
      include: bookingInclude,
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.findMany({
      where: {
        patientId: user.id,
        status: { in: ["pending_payment", "confirmed"] },
        OR: [
          { status: "pending_payment" },
          { session: { is: { status: { in: ["scheduled", "active"] } } } },
        ],
      },
      include: bookingInclude,
      orderBy: { scheduledStart: "asc" },
      take: 4,
    }),
    prisma.counselingSession.count({
      where: { booking: { patientId: user.id }, status: "scheduled" },
    }),
    prisma.counselingSession.count({
      where: { booking: { patientId: user.id }, status: "active" },
    }),
    prisma.counselingSession.count({
      where: { booking: { patientId: user.id }, status: "completed" },
    }),
    prisma.booking.count({
      where: { patientId: user.id, status: "pending_payment" },
    }),
  ]);

  const values = {
    upcoming: upcomingCount,
    active: activeCount,
    pending: pendingCount,
    completed: completedCount,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Ruang untuk dirimu"
        title={`Selamat datang, ${user.fullName.split(" ")[0]}.`}
        description="Semoga hari ini memberi ruang untuk hal-hal yang baik."
      />

      <section className="relative overflow-hidden rounded-[13px] bg-[#e8eee3] px-[30px] py-[28px] dark:bg-accent">
        <div className="relative z-10 max-w-[481px]">
          <p className="font-heading text-[24px] leading-[1.15] font-normal tracking-[-0.4px] text-[#203b33] sm:text-[29px] sm:leading-[33.35px] dark:text-foreground">
            Tidak perlu menjalani semuanya sendiri.
          </p>
          <p className="mt-[9px] max-w-[481px] text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
            Ambil jeda. Temukan ruang untuk bercerita, sesuai kebutuhanmu.
          </p>
          <Button className="mt-[18px] h-[43px] gap-[22px] px-6" asChild>
            <Link href="/dashboard/services">
              Temukan layanan
              <ArrowRight weight="bold" className="size-[18px]" />
            </Link>
          </Button>
        </div>
        <LeafBannerIcon className="pointer-events-none absolute top-1/2 right-[30px] hidden size-20 -translate-y-1/2 text-[#b9cbb6] sm:block dark:text-primary/30" />
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.key}
            className="rounded-xl border border-[#e1e7e1] bg-white p-[18px] dark:border-border dark:bg-card"
          >
            <span className="flex size-8 items-center justify-center rounded-[8px] bg-[#eff6f2] text-[#52796a] dark:bg-accent dark:text-accent-foreground">
              <item.icon className="size-5" />
            </span>
            <p className="mt-3.5 text-[12px] leading-[20px] text-[#68746d] dark:text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-0.5 font-sans text-[26px] leading-[34px] font-semibold text-[#203b33] dark:text-foreground">
              {values[item.key]}
            </p>
          </div>
        ))}
      </div>

      {pendingBooking ? (
        <div className="flex flex-col gap-4 rounded-xl border border-[#e1e7e1] bg-white p-5 sm:flex-row sm:items-center sm:justify-between dark:border-border dark:bg-card">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-[#f8f0dc] text-[#86651f] dark:bg-amber-500/15 dark:text-amber-300">
              <CreditCard className="size-4" />
            </span>
            <div>
              <p className="text-[13px] leading-[21px] font-semibold text-[#203b33] dark:text-foreground">
                Ada pembayaran yang belum selesai
              </p>
              <p className="mt-0.5 text-[11px] leading-[18px] text-[#68746d] dark:text-muted-foreground">
                {pendingBooking.serviceName} · {pendingBooking.bookingCode} ·{" "}
                {formatRupiah(Number(pendingBooking.price))}
              </p>
            </div>
          </div>
          <Button size="sm" asChild>
            <Link href={`/dashboard/bookings/${pendingBooking.id}/payment`}>
              Lanjutkan pembayaran
              <ArrowRight />
            </Link>
          </Button>
        </div>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] leading-[26px] font-semibold text-[#203b33] dark:text-foreground">
            Sesi untukmu
          </h2>
          <Link
            href="/dashboard/sessions"
            className="text-[12px] leading-[19px] font-semibold text-[#31594d] hover:underline dark:text-primary"
          >
            Lihat semua
          </Link>
        </div>

        {bookings.length === 0 ? (
          <EmptyState
            title="Belum ada sesi"
            description="Sesi akan muncul setelah pemesanan dikonfirmasi."
            action={
              <Button asChild>
                <Link href="/dashboard/services">Pesan sesi</Link>
              </Button>
            }
            icon={<CalendarCheck className="size-6" />}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#e1e7e1] bg-white dark:border-border dark:bg-card">
            {bookings.map((booking, index) => {
              const session = booking.session;
              const pending = booking.status === "pending_payment";
              const status = session?.status;
              const tone = pending
                ? bookingStatusTone(booking.status)
                : status
                  ? sessionStatusTone(status)
                  : bookingStatusTone(booking.status);
              const label = pending
                ? BOOKING_STATUS_LABEL[booking.status]
                : status
                  ? SESSION_STATUS_LABEL[status]
                  : BOOKING_STATUS_LABEL[booking.status];
              const href = session
                ? `/dashboard/sessions/${session.id}`
                : `/dashboard/bookings/${booking.id}`;

              return (
                <div
                  key={booking.id}
                  className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
                    index > 0 ? "border-t border-[#e9eee7] dark:border-border" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-[#68746d] dark:text-muted-foreground">
                        {booking.bookingCode}
                      </span>
                      <span className="text-[#c4cec5]">·</span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#68746d] dark:text-muted-foreground">
                        {booking.method === "chat" ? (
                          <ChatTeardropText className="size-3" />
                        ) : (
                          <VideoCamera className="size-3" />
                        )}
                        {METHOD_LABEL[booking.method]}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] leading-[21px] font-semibold text-[#203b33] dark:text-foreground">
                      {booking.serviceName}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-[18px] text-[#68746d] dark:text-muted-foreground">
                      {booking.counselor.fullName} ·{" "}
                      {formatDateTime(booking.scheduledStart)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge variant={tone} className="gap-1.5">
                      <span className="size-1 rounded-full bg-current" />
                      {label}
                    </Badge>
                    <Link
                      href={href}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#31594d] hover:underline dark:text-primary"
                    >
                      Lihat detail
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
