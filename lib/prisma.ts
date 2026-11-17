import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { serverEnv } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  rehatPrisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const connectionString = serverEnv().DATABASE_URL;
  const isLocal = /(?:localhost|127\.0\.0\.1)/.test(connectionString);
  // Di Vercel setiap instance function membuka pool sendiri. Supabase pooler
  // (session mode) membatasi total client, jadi batasi pool per instance.
  const isServerless = Boolean(process.env.VERCEL);

  const adapter = new PrismaPg({
    connectionString,
    // Supabase pooler memakai certificate chain yang tidak ada di trust store
    // Node. TLS tetap aktif, hanya validasi chain yang dilewati.
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    max: isServerless ? 1 : 5,
    idleTimeoutMillis: isServerless ? 5_000 : 30_000,
    connectionTimeoutMillis: 10_000,
  });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.rehatPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.rehatPrisma = prisma;
}
