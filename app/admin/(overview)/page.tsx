import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import {
  CalendarTrustIcon,
  ChatTrustIcon,
  CheckLineIcon,
  ClockPrepIcon,
  LeafBannerIcon,
  MethodVideoIcon,
} from "@/components/ui/figma-icons";
import { PageHeader } from "@/components/ui/page-header";
import { requirePageUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getAdminStats } from "@/lib/services/admin.service";
import { bookingInclude } from "@/lib/services/booking.service";
import {
  BOOKING_STATUS_LABEL,
  METHOD_LABEL,
  SESSION_STATUS_LABEL,
  bookingStatusTone,
  formatDate,
  formatTime,
  sessionStatusTone,
} from "@/lib/format";

export const instant = false;

export default async function AdminDashboardPage() {
  await connection();
  await requirePageUser(["admin"]);

  const [stats, recentBookings] = await Promise.all([
    getAdminStats(),
    prisma.booking.findMany({
      where: { status: { in: ["pending_payment", "confirmed"] } },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: bookingInclude,
    }),
  ]);

  const cards = [
    {
      label: "Layanan aktif",
      value: `${stats.services.active}`,
      icon: CalendarTrustIcon,
      href: "/admin/services",
    },
    {
      label: "Konselor aktif",
      value: `${stats.counselors.active}`,
      icon: ChatTrustIcon,
      href: "/admin/counselors",
    },
    {
      label: "Pemesanan",
      value: `${stats.bookings.total}`,
      icon: ClockPrepIcon,
      href: "/admin/bookings",
    },
    {
      label: "Transaksi berhasil",
      value: `${stats.payments.success}`,
      icon: CheckLineIcon,
      href: "/admin/payments?status=success",
    },
    {
      label: "Sesi terjadwal",
      value: `${stats.sessions.scheduled}`,
      icon: CalendarTrustIcon,
      href: "/admin/sessions",
    },
    {
      label: "Sesi aktif / selesai",
      value: `${stats.sessions.active} / ${stats.sessions.completed}`,
      icon: ChatTrustIcon,
      href: "/admin/sessions",
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Ruang kerja REHAT"
        title="Selamat datang, Admin."
        description="Semoga hari ini memberi ruang untuk hal-hal yang baik."
      />

      <section className="relative overflow-hidden rounded-[13px] bg-[#e8eee3] px-[30px] py-[28px] dark:bg-accent">
        <div className="relative z-10 max-w-[520px]">
          <p className="font-heading text-[24px] leading-[1.15] font-normal tracking-[-0.4px] text-[#203b33] sm:text-[29px] sm:leading-[33.35px] dark:text-foreground">
            Ruang yang tertata, layanan yang terjaga.
          </p>
          <p className="mt-[9px] max-w-[481px] text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
            Lihat jadwal dan aktivitas layanan REHAT hari ini.
          </p>
        </div>
        <LeafBannerIcon className="pointer-events-none absolute top-1/2 right-[30px] hidden size-20 -translate-y-1/2 text-[#b9cbb6] sm:block dark:text-primary/30" />
      </section>

      <div className="grid gap-[15px] sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="block">
            <div className="h-full rounded-xl border border-[#e1e7e1] bg-white p-[18px] transition-colors hover:border-[#c4cec5] dark:border-border dark:bg-card">
              <span className="flex size-8 items-center justify-center rounded-[8px] bg-[#eff6f2] text-[#52796a] dark:bg-accent dark:text-accent-foreground">
                <card.icon className="size-5" />
              </span>
              <p className="mt-3.5 text-[12px] leading-[19.2px] text-[#68746d] dark:text-muted-foreground">
                {card.label}
              </p>
              <p className="mt-0.5 font-sans text-[26px] leading-[33.8px] font-semibold text-[#203b33] dark:text-foreground">
                {card.value}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] leading-[25.6px] font-semibold text-[#203b33] dark:text-foreground">
            Aktivitas sesi terbaru
          </h2>
          <Link
            href="/admin/sessions"
            className="inline-flex items-center gap-1 text-[12px] leading-[19.2px] font-semibold text-[#31594d] hover:underline dark:text-primary"
          >
            Lihat semua
            <ArrowRight weight="bold" className="size-3.5" />
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="rounded-xl border border-[#e1e7e1] bg-white px-5 py-8 text-center text-[12px] text-[#68746d] dark:border-border dark:bg-card dark:text-muted-foreground">
            Belum ada aktivitas sesi.
          </div>
        ) : (
          <div className="space-y-3">
            {recentBookings.map((booking) => {
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
              const href = session ? "/admin/sessions" : "/admin/bookings";
              const isChat = booking.method === "chat";

              return (
                <div
                  key={booking.id}
                  className="flex min-h-[123px] items-center gap-[18px] rounded-[12px] border border-[#e1e7e1] bg-white p-[22px] dark:border-border dark:bg-card"
                >
                  <span
                    className={`flex h-[57px] w-[53px] shrink-0 items-center justify-center rounded-[11px] ${
                      pending || !isChat
                        ? "bg-[#f3ede3] text-[#927d5e] dark:bg-accent dark:text-accent-foreground"
                        : "bg-[#eff6f2] text-[#52796a] dark:bg-accent dark:text-accent-foreground"
                    }`}
                  >
                    {isChat ? (
                      <ChatTrustIcon className="size-[26px]" />
                    ) : (
                      <MethodVideoIcon className="size-[26px]" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-[7px] text-[12px] leading-[19.2px] text-[#68746d] dark:text-muted-foreground">
                      <span>{booking.bookingCode}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        {isChat ? (
                          <ChatTrustIcon className="size-3" />
                        ) : (
                          <MethodVideoIcon className="size-3" />
                        )}
                        {METHOD_LABEL[booking.method]}
                      </span>
                    </div>
                    <p className="text-[13px] leading-[20.8px] font-semibold text-[#203b33] dark:text-foreground">
                      {booking.serviceName}
                    </p>
                    <p className="text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                      {booking.patient.fullName} ·{" "}
                      {formatDate(booking.scheduledStart)} ·{" "}
                      {formatTime(booking.scheduledStart)} WIB
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-[5px]">
                    <Badge variant={tone} className="gap-1.5">
                      <span className="size-1 rounded-full bg-current" />
                      {label}
                    </Badge>
                    <Link
                      href={href}
                      className="inline-flex items-center gap-1 text-[12px] leading-[19.2px] font-semibold text-[#31594d] hover:underline dark:text-primary"
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
