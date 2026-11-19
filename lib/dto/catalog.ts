import "server-only";
import type {
  CounselorProfile,
  CounselorService,
  Profile,
  Service,
  ServiceMethod,
} from "@/lib/generated/prisma/client";
import { avatarPublicUrl } from "@/lib/integrations/r2";

export function toServiceDto(service: Service & { methods: ServiceMethod[] }) {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    durationMinutes: service.durationMinutes,
    price: Number(service.price),
    isActive: service.isActive,
    methods: service.methods.map((item) => item.method),
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  };
}

type CounselorWithRelations = Profile & {
  counselorProfile: CounselorProfile | null;
  counselorServices: Array<CounselorService & { service: Service }>;
};

export function toPublicCounselorDto(counselor: CounselorWithRelations) {
  return {
    id: counselor.id,
    fullName: counselor.fullName,
    avatarUrl: counselor.avatarKey ? avatarPublicUrl(counselor.avatarKey) : null,
    specialization: counselor.counselorProfile?.specialization ?? null,
    bio: counselor.counselorProfile?.bio ?? null,
    services: counselor.counselorServices.map((link) => ({
      id: link.service.id,
      name: link.service.name,
    })),
  };
}

export function toAdminCounselorDto(counselor: CounselorWithRelations) {
  return {
    ...toPublicCounselorDto(counselor),
    email: counselor.email,
    isActive: counselor.isActive,
    createdAt: counselor.createdAt.toISOString(),
    updatedAt: counselor.updatedAt.toISOString(),
  };
}
