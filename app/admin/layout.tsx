import { connection } from "next/server";
import { requirePageUser } from "@/lib/auth/guards";
import { SessionProvider } from "@/components/providers/session-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { avatarPublicUrl } from "@/lib/integrations/r2";
import type { SessionUser } from "@/lib/types/api";

export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const user = await requirePageUser(["admin"]);

  const initialUser: SessionUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    avatarUrl: user.avatarKey ? avatarPublicUrl(user.avatarKey) : null,
    isActive: user.isActive,
    emailConfirmed: user.emailConfirmed,
  };


  return (
    <SessionProvider initialUser={initialUser}>
      <DashboardShell>{children}</DashboardShell>
    </SessionProvider>
  );
}
