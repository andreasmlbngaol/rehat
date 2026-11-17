import "server-only";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { errors } from "@/lib/api/errors";
import { isUserRole, type UserRole } from "@/lib/auth/roles";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  emailConfirmed: boolean;
  fullName: string;
  avatarKey: string | null;
};

/**
 * Membaca user dari cookie Supabase lalu memuat profil aplikasi.
 * `getUser()` memvalidasi token ke server Supabase, bukan sekadar decode JWT.
 */
export async function getUser(): Promise<AuthUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      fullName: true,
      avatarKey: true,
    },
  });

  if (!profile || !isUserRole(profile.role)) return null;

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    isActive: profile.isActive,
    emailConfirmed: Boolean(user.email_confirmed_at),
    fullName: profile.fullName,
    avatarKey: profile.avatarKey,
  };
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getUser();
  if (!user) throw errors.unauthenticated();
  if (!user.emailConfirmed) throw errors.emailNotVerified();
  if (!user.isActive) throw errors.accountInactive();
  return user;
}

export async function requireRole(...roles: UserRole[]): Promise<AuthUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw errors.forbidden();
  return user;
}
