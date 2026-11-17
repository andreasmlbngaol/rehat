import "server-only";
import { redirect } from "next/navigation";
import { getUser, type AuthUser } from "@/lib/auth/dal";
import type { UserRole } from "@/lib/auth/roles";
import { homeForRole } from "@/lib/roles";

/**
 * Penjaga halaman server-side. Otorisasi API tetap dilakukan Route Handler;
 * fungsi ini hanya mencegah halaman dirender untuk peran yang salah.
 */
export async function requirePageUser(
  roles?: UserRole[],
  options?: { next?: string },
): Promise<AuthUser> {
  const user = await getUser();

  if (!user) {
    const next = options?.next ? `?next=${encodeURIComponent(options.next)}` : "";
    redirect(`/login${next}`);
  }

  if (!user.emailConfirmed) {
    redirect("/verify-email");
  }

  if (!user.isActive) {
    redirect("/login?error=inactive");
  }

  if (roles && !roles.includes(user.role)) {
    redirect(homeForRole(user.role));
  }

  return user;
}
