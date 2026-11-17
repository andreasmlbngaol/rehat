import type { UserRole } from "@/lib/auth/roles";

export function homeForRole(role: UserRole): string {
  if (role === "admin") return "/admin";
  if (role === "counselor") return "/counselor";
  return "/dashboard";
}
