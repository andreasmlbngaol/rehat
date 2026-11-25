import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, CalendarCheck } from "@phosphor-icons/react/dist/ssr";
import { RecentSessions } from "@/components/session/recent-sessions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  CalendarTrustIcon,
  ChatTrustIcon,
  CheckLineIcon,
  ClockPrepIcon,
  LeafBannerIcon,
} from "@/components/ui/figma-icons";
import { PageHeader } from "@/components/ui/page-header";
import { requirePageUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import {
  reconcileSessionsForUser,
  sessionInclude,
} from "@/lib/services/session.service";
import { toSessionDto } from "@/lib/dto/session";

export const instant = false;

const stats = [
  { key: "upcoming", label: "Sesi mendatang", icon: CalendarTrustIcon },
  { key: "active", label: "Sesi aktif", icon: ChatTrustIcon },
  { key: "slots", label: "Slot tersedia", icon: ClockPrepIcon },
  { key: "completed", label: "Sesi selesai", icon: CheckLineIcon },
] as const;

export default async function CounselorDashboardPage() {
  await connection();
  const user = await requirePageUser(["counselor"]);

  await reconcileSessionsForUser(user);

  const now = new Date();

  const [availableSlots, upcoming, active, completed, sessions] =
    await Promise.all([
      prisma.timeSlot.count({
        where: { counselorId: user.id, status: "available", startTime: { gt: now } },
      }),
      prisma.counselingSession.count({
        where: { booking: { counselorId: user.id }, status: "scheduled" },
      }),
      prisma.counselingSession.count({
        where: { booking: { counselorId: user.id }, status: "active" },
      }),
      prisma.counselingSession.count({
        where: { booking: { counselorId: user.id }, status: "completed" },
      }),
      prisma.counselingSession.findMany({
        where: {
          booking: { counselorId: user.id },
          status: { in: ["scheduled", "active"] },
        },
        include: sessionInclude,
        orderBy: { booking: { scheduledStart: "asc" } },
        take: 4,
      }),
    ]);

  const values = {
    upcoming,
    active,
    slots: availableSlots,
    completed,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Ruang kerja REHAT"
        title={`Selamat datang, ${user.fullName.split(" ")[0]}.`}
        description="Semoga hari ini memberi ruang untuk hal-hal yang baik."
      />

      <section className="relative overflow-hidden rounded-[13px] bg-[#e8eee3] px-[30px] py-[28px] dark:bg-accent">
        <div className="relative z-10 max-w-[640px]">
          <p className="font-heading text-[24px] leading-[1.15] font-normal tracking-[-0.4px] text-[#203b33] sm:text-[29px] sm:leading-[33.35px] dark:text-foreground">
            Hadir sepenuhnya, satu sesi pada satu waktu.
          </p>
          <p className="mt-[9px] max-w-[481px] text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
            Lihat jadwal dan aktivitas layanan REHAT hari ini.
          </p>
        </div>
        <LeafBannerIcon className="pointer-events-none absolute top-1/2 right-[30px] hidden size-20 -translate-y-1/2 text-[#b9cbb6] sm:block dark:text-primary/30" />
      </section>

      <div className="grid gap-[15px] sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.key}
            className="rounded-xl border border-[#e1e7e1] bg-white p-[18px] dark:border-border dark:bg-card"
          >
            <span className="flex size-8 items-center justify-center rounded-[8px] bg-[#eff6f2] text-[#52796a] dark:bg-accent dark:text-accent-foreground">
              <item.icon className="size-5" />
            </span>
            <p className="mt-3.5 text-[12px] leading-[19.2px] text-[#68746d] dark:text-muted-foreground">
              {item.label}
            </p>
            <p className="font-sans text-[26px] leading-[33.8px] font-semibold text-[#203b33] dark:text-foreground">
              {values[item.key]}
            </p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] leading-[26px] font-semibold text-[#203b33] dark:text-foreground">
            Sesi untukmu
          </h2>
          <Link
            href="/counselor/sessions"
            className="inline-flex items-center gap-1 text-[12px] leading-[19.2px] font-semibold text-[#31594d] hover:underline dark:text-primary"
          >
            Lihat semua
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {sessions.length === 0 ? (
          <EmptyState
            title="Belum ada sesi mendatang"
            description="Tambahkan slot jadwal agar pasien dapat memesan."
            action={
              <Button asChild>
                <Link href="/counselor/schedule">Tambah jadwal</Link>
              </Button>
            }
            icon={<CalendarCheck className="size-6" />}
          />
        ) : (
          <RecentSessions
            sessions={sessions.map((session) =>
              toSessionDto(session, "counselor"),
            )}
            role="counselor"
          />
        )}
      </section>
    </div>
  );
}
