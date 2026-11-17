import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../lib/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!connectionString) throw new Error("DATABASE_URL belum diisi.");
if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL belum diisi.");
if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diisi.");

const isLocal = /(?:localhost|127\.0\.0\.1)/.test(connectionString);

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    max: 2,
  }),
});

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type SeedUser = {
  id: string;
  email: string;
};

async function ensureAuthUser(input: {
  email: string;
  password: string;
  role: "admin" | "counselor" | "patient";
  fullName: string;
}): Promise<SeedUser> {
  const { data: created, error } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    app_metadata: { role: input.role },
    user_metadata: { full_name: input.fullName },
  });

  if (!error && created.user) {
    return { id: created.user.id, email: created.user.email ?? input.email };
  }

  const { data: list, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) throw listError;

  const existing = list.users.find(
    (user) => user.email?.toLowerCase() === input.email.toLowerCase(),
  );

  if (!existing) {
    throw error ?? new Error(`Gagal membuat user ${input.email}.`);
  }

  await supabase.auth.admin.updateUserById(existing.id, {
    password: input.password,
    app_metadata: { role: input.role },
    user_metadata: { full_name: input.fullName },
    email_confirm: true,
  });

  return { id: existing.id, email: existing.email ?? input.email };
}

function wibDate(dayOffset: number, hour: number, minute = 0): Date {
  const now = new Date();
  const wibNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);

  return new Date(
    Date.UTC(
      wibNow.getUTCFullYear(),
      wibNow.getUTCMonth(),
      wibNow.getUTCDate() + dayOffset,
      hour - 7,
      minute,
      0,
      0,
    ),
  );
}

const SERVICES = [
  {
    name: "Konseling Individu",
    description:
      "Sesi konseling tatap muka daring untuk membantu Anda memahami dan mengelola persoalan pribadi bersama konselor profesional.",
    durationMinutes: 60,
    price: "150000.00",
    methods: ["chat", "zoom"] as const,
  },
  {
    name: "Konseling Pasangan",
    description:
      "Sesi konseling untuk pasangan yang ingin membangun komunikasi dan menyelesaikan konflik bersama konselor.",
    durationMinutes: 90,
    price: "250000.00",
    methods: ["zoom"] as const,
  },
  {
    name: "Konseling Singkat",
    description:
      "Sesi konseling singkat melalui chat untuk membahas satu topik utama bersama konselor.",
    durationMinutes: 30,
    price: "75000.00",
    methods: ["chat"] as const,
  },
];

const COUNSELORS = [
  {
    email: "ayu.counselor@booroong.online",
    fullName: "Ayu Prameswari",
    specialization: "Kecemasan dan Manajemen Stres",
    bio: "Konselor dengan pengalaman mendampingi dewasa muda dalam mengelola kecemasan, stres akademik, dan transisi karier.",
    services: ["Konseling Individu", "Konseling Singkat"],
  },
  {
    email: "bima.counselor@booroong.online",
    fullName: "Bima Ardiansyah",
    specialization: "Relasi dan Keluarga",
    bio: "Konselor yang berfokus pada dinamika relasi, komunikasi pasangan, dan penguatan dukungan keluarga.",
    services: ["Konseling Individu", "Konseling Pasangan"],
  },
];

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const counselorPassword = process.env.SEED_COUNSELOR_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("SEED_ADMIN_EMAIL dan SEED_ADMIN_PASSWORD wajib diisi.");
  }
  if (!counselorPassword) {
    throw new Error("SEED_COUNSELOR_PASSWORD wajib diisi.");
  }

  console.log("→ Admin");
  const admin = await ensureAuthUser({
    email: adminEmail,
    password: adminPassword,
    role: "admin",
    fullName: "Administrator REHAT",
  });

  await prisma.profile.upsert({
    where: { id: admin.id },
    update: { email: admin.email, fullName: "Administrator REHAT", role: "admin", isActive: true },
    create: { id: admin.id, email: admin.email, fullName: "Administrator REHAT", role: "admin" },
  });

  // Pasien demo opsional untuk pengujian E2E.
  const patientEmail = process.env.SEED_PATIENT_EMAIL;
  const patientPassword = process.env.SEED_PATIENT_PASSWORD;

  if (patientEmail && patientPassword) {
    console.log("→ Pasien demo");
    const patient = await ensureAuthUser({
      email: patientEmail,
      password: patientPassword,
      role: "patient",
      fullName: "Pasien Demo",
    });

    await prisma.profile.upsert({
      where: { id: patient.id },
      update: { email: patient.email, fullName: "Pasien Demo", role: "patient", isActive: true },
      create: { id: patient.id, email: patient.email, fullName: "Pasien Demo", role: "patient" },
    });
  }

  console.log("→ Layanan");
  const serviceIds = new Map<string, string>();

  for (const service of SERVICES) {
    const existing = await prisma.service.findFirst({ where: { name: service.name } });

    const record = existing
      ? await prisma.service.update({
          where: { id: existing.id },
          data: {
            description: service.description,
            durationMinutes: service.durationMinutes,
            price: service.price,
            isActive: true,
            methods: {
              deleteMany: {},
              create: service.methods.map((method) => ({ method })),
            },
          },
        })
      : await prisma.service.create({
          data: {
            name: service.name,
            description: service.description,
            durationMinutes: service.durationMinutes,
            price: service.price,
            methods: { create: service.methods.map((method) => ({ method })) },
          },
        });

    serviceIds.set(service.name, record.id);
  }

  console.log("→ Konselor");
  for (const counselor of COUNSELORS) {
    const user = await ensureAuthUser({
      email: counselor.email,
      password: counselorPassword,
      role: "counselor",
      fullName: counselor.fullName,
    });

    await prisma.profile.upsert({
      where: { id: user.id },
      update: { email: user.email, fullName: counselor.fullName, role: "counselor", isActive: true },
      create: { id: user.id, email: user.email, fullName: counselor.fullName, role: "counselor" },
    });

    await prisma.counselorProfile.upsert({
      where: { counselorId: user.id },
      update: {
        specialization: counselor.specialization,
        bio: counselor.bio,
      },
      create: {
        counselorId: user.id,
        specialization: counselor.specialization,
        bio: counselor.bio,
      },
    });

    for (const serviceName of counselor.services) {
      const serviceId = serviceIds.get(serviceName);
      if (!serviceId) continue;

      await prisma.counselorService.upsert({
        where: { counselorId_serviceId: { counselorId: user.id, serviceId } },
        update: {},
        create: { counselorId: user.id, serviceId },
      });
    }

    console.log(`→ Time slot untuk ${counselor.fullName}`);
    const templates = [
      [9, 0, 10, 30],
      [11, 0, 12, 30],
      [13, 0, 14, 30],
      [15, 0, 16, 30],
    ] as const;

    for (let day = 1; day <= 7; day += 1) {
      for (const [startHour, startMinute, endHour, endMinute] of templates) {
        const startTime = wibDate(day, startHour, startMinute);
        const endTime = wibDate(day, endHour, endMinute);

        const existing = await prisma.timeSlot.findFirst({
          where: { counselorId: user.id, startTime },
        });

        if (existing) continue;

        await prisma.timeSlot.create({
          data: {
            counselorId: user.id,
            createdBy: user.id,
            startTime,
            endTime,
            status: "available",
          },
        });
      }
    }
  }

  console.log("Seed selesai.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
