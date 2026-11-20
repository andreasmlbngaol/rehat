"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  List,
  SignOut,
  SpinnerGap,
  SquaresFour,
  User,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "cn";
import { useSession } from "@/components/providers/session-provider";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/layout/logo";
import { startNavigationProgress } from "@/components/layout/navigation-progress";
import { homeForRole } from "@/lib/roles";

const links = [
  { href: "/", label: "Beranda" },
  { href: "/services", label: "Layanan" },
  { href: "/cara-kerja", label: "Cara Kerja" },
];

export function PublicHeader() {
  const { user, logout } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const isAuthRoute = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ].includes(pathname);

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
    <header className="sticky top-0 z-40 border-b border-[#e1e7e1] bg-white/95 backdrop-blur dark:border-border dark:bg-background/95">
      <div className="mx-auto flex h-[96px] w-full max-w-[1200px] items-center gap-8 px-6 lg:px-0">
        <Logo />

        <nav
          className={cn(
            "hidden items-center gap-[35px] md:flex",
            isAuthRoute ? "ml-auto" : "flex-1 justify-center md:pl-[50px]",
          )}
        >
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative py-2 text-[13px] leading-[20.8px] transition-colors",
                  active
                    ? "font-semibold text-[#203b33] after:absolute after:bottom-[1px] after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-[#203b33] dark:text-foreground dark:after:bg-foreground"
                    : "text-[#59645f] hover:text-[#203b33] dark:text-muted-foreground dark:hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div
          className={cn(
            "flex items-center gap-[26px]",
            isAuthRoute ? "md:hidden" : "ml-auto",
          )}
        >
          {user ? (
            <>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
                <Link href={homeForRole(user.role)}>
                  <SquaresFour />
                  Dashboard
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50"
                    aria-label="Menu akun"
                  >
                    <Avatar src={user.avatarUrl} name={user.fullName} size="sm" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="px-2 py-1.5">
                    <span className="block truncate text-sm font-medium">
                      {user.fullName}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={homeForRole(user.role)}>
                      <SquaresFour />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={
                        user.role === "admin"
                          ? "/admin"
                          : user.role === "counselor"
                            ? "/counselor/profile"
                            : "/dashboard/profile"
                      }
                    >
                      <User />
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={loggingOut}
                    onClick={handleLogout}
                  >
                    {loggingOut ? (
                      <SpinnerGap className="animate-spin" />
                    ) : (
                      <SignOut />
                    )}
                    {loggingOut ? "Keluar..." : "Keluar"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : isAuthRoute ? null : (
            <div className="hidden items-center gap-[26px] sm:flex">
              <Link
                href="/login"
                className="px-2 text-[13px] leading-[20.8px] font-medium text-[#202725] transition-colors hover:text-[#31594d] dark:text-foreground"
              >
                Masuk
              </Link>
              <Button
                className="h-[43px] gap-[20px] px-[21px] text-[12px]"
                asChild
              >
                <Link href="/register">
                  Daftar
                  <ArrowRight weight="bold" className="size-4" />
                </Link>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label="Buka menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X /> : <List />}
          </Button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-[#e1e7e1] bg-white md:hidden dark:border-border dark:bg-background">
          <nav className="mx-auto flex max-w-[1206px] flex-col gap-1 px-6 py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#203b33] hover:bg-[#eff6f2] dark:text-foreground dark:hover:bg-accent"
              >
                {link.label}
              </Link>
            ))}
            {!user ? (
              <div className="mt-3 flex gap-2 border-t border-[#e1e7e1] pt-4 dark:border-border">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    Masuk
                  </Link>
                </Button>
                <Button className="flex-1" asChild>
                  <Link href="/register" onClick={() => setOpen(false)}>
                    Daftar
                  </Link>
                </Button>
              </div>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
