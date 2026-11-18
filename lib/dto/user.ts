import "server-only";
import type { Profile } from "@/lib/generated/prisma/client";
import { avatarPublicUrl } from "@/lib/integrations/r2";

export function toAdminUserDto(profile: Profile) {
  return {
    id: profile.id,
    fullName: profile.fullName,
    email: profile.email,
    role: profile.role,
    isActive: profile.isActive,
    avatarUrl: profile.avatarKey ? avatarPublicUrl(profile.avatarKey) : null,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}
