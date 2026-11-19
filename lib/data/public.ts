import "server-only";
import { prisma } from "@/lib/prisma";
import {
  toPublicCounselorDto,
  toServiceDto,
} from "@/lib/dto/catalog";

export async function getPublicServices() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    include: { methods: true },
    orderBy: { name: "asc" },
  });

  return services.map(toServiceDto);
}

export async function getPublicService(id: string) {
  const service = await prisma.service.findFirst({
    where: { id, isActive: true },
    include: { methods: true },
  });

  return service ? toServiceDto(service) : null;
}

export async function getPublicCounselors(serviceId?: string) {
  const counselors = await prisma.profile.findMany({
    where: {
      role: "counselor",
      isActive: true,
      counselorProfile: { isNot: null },
      ...(serviceId
        ? { counselorServices: { some: { serviceId } } }
        : {}),
    },
    include: {
      counselorProfile: true,
      counselorServices: { include: { service: true } },
    },
    orderBy: { fullName: "asc" },
  });

  return counselors.map(toPublicCounselorDto);
}

export async function getPublicCounselor(id: string) {
  const counselor = await prisma.profile.findFirst({
    where: {
      id,
      role: "counselor",
      isActive: true,
      counselorProfile: { isNot: null },
    },
    include: {
      counselorProfile: true,
      counselorServices: { include: { service: true } },
    },
  });

  return counselor ? toPublicCounselorDto(counselor) : null;
}
