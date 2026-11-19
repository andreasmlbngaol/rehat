import "server-only";
import type { CounselorProfile, Profile } from "@/lib/generated/prisma/client";
import { avatarPublicUrl } from "@/lib/integrations/r2";

export function toProfileDto(
  profile: Profile & { counselorProfile: CounselorProfile | null },
) {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    role: profile.role,
    avatarKey: profile.avatarKey,
    avatarUrl: profile.avatarKey ? avatarPublicUrl(profile.avatarKey) : null,
    isActive: profile.isActive,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
    counselorProfile: profile.counselorProfile
      ? {
          specialization: profile.counselorProfile.specialization,
          bio: profile.counselorProfile.bio,
          createdAt: profile.counselorProfile.createdAt.toISOString(),
          updatedAt: profile.counselorProfile.updatedAt.toISOString(),
        }
      : null,
  };
}
