"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CaretRight,
  List,
  SignOut,
  SpinnerGap,
  X,
} from "@phosphor-icons/react";
import { cn } from "cn";
import { useSession } from "@/components/providers/session-provider";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  CalendarTrustIcon,
  ChatTrustIcon,
  ClockPrepIcon,
  LeafLineIcon,
  ShieldCheckLineIcon,
  SquaresFourLineIcon,
  UserLineIcon,
} from "@/components/ui/figma-icons";
import { Logo } from "@/components/layout/logo";
import { startNavigationProgress } from "@/components/layout/navigation-progress";
import { ROLE_LABEL } from "@/lib/format";
import type { SessionUser, UserRole } from "@/lib/types/api";

type NavItem = { href: string; label: string; icon: React.ReactNode; exact?: boolean };

const navigation: Record<UserRole, NavItem[]> = {
  patient: [
    { href: "/dashboard", label: "Ringkasan", icon: <SquaresFourLineIcon />, exact: true },
    { href: "/dashboard/services", label: "Layanan", icon: <LeafLineIcon /> },
    { href: "/dashboard/sessions", label: "Sesi Saya", icon: <ChatTrustIcon /> },
    { href: "/dashboard/history", label: "Riwayat", icon: <ClockPrepIcon /> },
    { href: "/dashboard/profile", label: "Profil", icon: <UserLineIcon /> },
  ],
  counselor: [
    { href: "/counselor", label: "Ringkasan", icon: <SquaresFourLineIcon />, exact: true },
    { href: "/counselor/schedule", label: "Jadwal", icon: <CalendarTrustIcon /> },
    { href: "/counselor/sessions", label: "Sesi", icon: <ChatTrustIcon /> },
    { href: "/counselor/history", label: "Riwayat", icon: <ClockPrepIcon /> },
    { href: "/counselor/profile", label: "Profil Profesional", icon: <UserLineIcon /> },
  ],
  admin: [
    { href: "/admin", label: "Ringkasan", icon: <SquaresFourLineIcon />, exact: true },
    { href: "/admin/users", label: "Pengguna", icon: <CalendarTrustIcon /> },
    { href: "/admin/services", label: "Layanan", icon: <ChatTrustIcon /> },
    { href: "/admin/counselors", label: "Konselor", icon: <ClockPrepIcon /> },
    { href: "/admin/time-slots", label: "Jadwal", icon: <UserLineIcon /> },
    { href: "/admin/bookings", label: "Pemesanan", icon: <SquaresFourLineIcon /> },
    { href: "/admin/payments", label: "Pembayaran", icon: <CalendarTrustIcon /> },
    { href: "/admin/sessions", label: "Sesi", icon: <ChatTrustIcon /> },
    { href: "/admin/reports", label: "Laporan Operasional", icon: <ClockPrepIcon /> },
  ],
};

const sectionLabels: Record<UserRole, string> = {
  patient: "Ruang Pasien",
  counselor: "Ruang Konselor",
  admin: "Ruang Admin",
};

const rootLabels: Record<UserRole, string> = {
  patient: "Ruang Pasien",
  counselor: "Ruang Konselor",
  admin: "Ruang Admin",
};

function breadcrumbFor(pathname: string, role: UserRole): { root: string; current: string } {
  const root = rootLabels[role];
  if (role === "patient") {
    if (pathname === "/dashboard") return { root, current: "Ringkasan" };
    if (pathname === "/dashboard/services") return { root, current: "Layanan" };
    if (pathname === "/dashboard/bookings/new") return { root, current: "Pemesanan" };
    if (/^\/dashboard\/bookings\/[^/]+\/payment/.test(pathname)) return { root, current: "Pembayaran" };
    if (/^\/dashboard\/bookings\/[^/]+/.test(pathname)) return { root, current: "Detail pemesanan" };
    if (pathname === "/dashboard/bookings") return { root, current: "Pemesanan" };
    if (/^\/dashboard\/sessions\/[^/]+/.test(pathname)) return { root, current: "Detail sesi" };
    if (pathname === "/dashboard/sessions") return { root, current: "Sesi Saya" };
    if (pathname === "/dashboard/history") return { root, current: "Riwayat" };
    if (pathname === "/dashboard/profile") return { root, current: "Profil" };
  }
  if (role === "counselor") {
    if (pathname === "/counselor") return { root, current: "Ringkasan" };
    if (pathname === "/counselor/schedule") return { root, current: "Jadwal" };
    if (/^\/counselor\/sessions\/[^/]+/.test(pathname)) return { root, current: "Detail sesi" };
    if (pathname === "/counselor/sessions") return { root, current: "Sesi" };
    if (pathname === "/counselor/history") return { root, current: "Riwayat" };
    if (pathname === "/counselor/profile") return { root, current: "Profil Profesional" };
  }
  if (role === "admin") {
    const map: Record<string, string> = {
      "/admin": "Ringkasan",
      "/admin/users": "Pengguna",
      "/admin/services": "Layanan",
      "/admin/counselors": "Konselor",
      "/admin/time-slots": "Jadwal",
      "/admin/bookings": "Pemesanan",
      "/admin/payments": "Pembayaran",
      "/admin/sessions": "Sesi",
      "/admin/reports": "Laporan Operasional",
    };
    return { root, current: map[pathname] ?? "Ringkasan" };
  }
  return { root, current: "Ringkasan" };
}

function isNavActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavList({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-[5px] overflow-y-auto overscroll-contain px-5">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "flex h-[45px] items-center gap-3 rounded-[8px] px-[13px] text-[12px] leading-[19px] transition-colors",
            isNavActive(item, pathname)
              ? "bg-[#eaf2ec] font-semibold text-[#203b33] dark:bg-accent dark:text-foreground"
              : "font-medium text-[#68746d] hover:bg-[#f5f7f5] hover:text-[#203b33] dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground",
          )}
        >
          <span className="[&>svg]:size-5">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function SidebarBody({
  items,
  pathname,
  user,
  loggingOut,
  onLogout,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  user: SessionUser;
  loggingOut: boolean;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="px-5 pt-8 pb-6">
        <Logo />
      </div>
      <div className="px-5 pb-2.5 text-[12px] leading-[19px] font-semibold tracking-[1.4px] text-[#52796a] uppercase dark:text-muted-foreground">
        {sectionLabels[user.role]}
      </div>
      <NavList items={items} pathname={pathname} onNavigate={onNavigate} />
      <div className="space-y-4 px-5 pt-5 pb-5">
        <div className="rounded-[11px] bg-[#eff3eb] p-[18px] dark:bg-accent">
          <LeafLineIcon className="size-5 text-[#6b7c62] dark:text-accent-foreground" />
          <p className="mt-[13px] font-quote text-[18px] leading-[23.4px] text-[#6b7c62] dark:text-accent-foreground">
            Satu langkah kecil. Satu ruang untuk dirimu.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Avatar src={user.avatarUrl} name={user.fullName} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] leading-[19px] font-semibold text-[#203b33] dark:text-foreground">
              {user.fullName}
            </p>
            <p className="truncate text-[10px] leading-[16px] text-[#68746d] dark:text-muted-foreground">
              {ROLE_LABEL[user.role]}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={loggingOut ? "Sedang keluar" : "Keluar"}
            disabled={loggingOut}
            onClick={onLogout}
          >
            {loggingOut ? <SpinnerGap className="animate-spin" /> : <SignOut />}
          </Button>
        </div>
      </div>
    </>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null;

  const items = navigation[user.role];
  const breadcrumb = breadcrumbFor(pathname, user.role);
  const showFooter = !/^\/dashboard\/(bookings\/new|bookings\/[^/]+|sessions\/[^/]+|history\/[^/]+)/.test(
    pathname,
  );

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      startNavigationProgress("/login");
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="flex min-h-svh w-full bg-[#f5f7f5] dark:bg-background">
      <aside className="hidden w-[234px] shrink-0 border-r border-[#e1e7e1] bg-white lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:overflow-hidden dark:border-border dark:bg-card">
        <SidebarBody
          items={items}
          pathname={pathname}
          user={user}
          loggingOut={loggingOut}
          onLogout={handleLogout}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[79px] items-center gap-4 border-b border-[#e1e7e1] bg-white px-5 backdrop-blur sm:px-8 dark:border-border dark:bg-card/95">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            aria-label="Buka navigasi"
            onClick={() => setOpen(true)}
          >
            <List />
          </Button>
          <div className="lg:hidden">
            <Logo />
          </div>

          <div className="hidden min-w-0 items-center gap-2 text-[12px] leading-[19.2px] lg:flex">
            <span className="shrink-0 text-[#59645f] dark:text-muted-foreground">
              {breadcrumb.root}
            </span>
            <CaretRight className="size-3 shrink-0 text-[#929b96]" />
            <span className="truncate font-medium text-[#203b33] dark:text-foreground">
              {breadcrumb.current}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <Avatar src={user.avatarUrl} name={user.fullName} size="sm" />
              <div className="hidden sm:block">
                <p className="text-[12px] leading-[19px] font-semibold text-[#203b33] dark:text-foreground">
                  {user.fullName}
                </p>
                <p className="text-[10px] leading-[16px] text-[#68746d] dark:text-muted-foreground">
                  {ROLE_LABEL[user.role]}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1206px] flex-1 px-5 py-6 sm:px-8 lg:px-[38px] lg:py-[34px]">
          {children}
          {showFooter ? (
            <footer className="mt-10 border-t border-[#e1e7e1] pt-4 dark:border-border">
              <p className="flex items-center gap-1.5 text-[11px] leading-[18px] text-[#68746d] dark:text-muted-foreground">
                <ShieldCheckLineIcon className="size-3.5" />
                REHAT · Ruang Emosional untuk Hidup Aman dan Tenang
              </p>
            </footer>
          ) : null}
        </main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-[#0f1a16]/40"
            aria-label="Tutup navigasi"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex h-full w-[280px] max-w-[85%] flex-col border-r border-[#e1e7e1] bg-white shadow-xl dark:border-border dark:bg-card">
            <div className="absolute top-4 right-4">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Tutup"
                onClick={() => setOpen(false)}
              >
                <X />
              </Button>
            </div>
            <SidebarBody
              items={items}
              pathname={pathname}
              user={user}
              loggingOut={loggingOut}
              onLogout={handleLogout}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
