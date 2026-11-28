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

const DEFAULT_ADMIN_EMAIL = "admin@rehat.com";

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error("SEED_ADMIN_PASSWORD wajib diisi.");
  }

  console.log(`→ Admin (${adminEmail})`);
  const admin = await ensureAuthUser({
    email: adminEmail,
    password: adminPassword,
    role: "admin",
    fullName: "Administrator REHAT",
  });

  await prisma.profile.upsert({
    where: { id: admin.id },
    update: {
      email: admin.email,
      fullName: "Administrator REHAT",
      role: "admin",
      isActive: true,
    },
    create: {
      id: admin.id,
      email: admin.email,
      fullName: "Administrator REHAT",
      role: "admin",
    },
  });

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
