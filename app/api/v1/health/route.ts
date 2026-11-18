import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { serverEnv } from "@/lib/env";
import { logError } from "@/lib/logger";

export const GET = apiRoute({}, async () => {
  const startedAt = Date.now();
  const env = serverEnv();

  let database: "ok" | "error" = "ok";
  try {
    await prisma.$queryRaw`select 1`;
  } catch (error) {
    database = "error";
    logError({ event: "health_database_failed", error });
  }

  const integrations = {
    supabase: Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRole: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
    midtrans: Boolean(env.MIDTRANS_SERVER_KEY),
    zoom: Boolean(
      env.ZOOM_ACCOUNT_ID && env.ZOOM_CLIENT_ID && env.ZOOM_CLIENT_SECRET,
    ),
    resend: Boolean(env.RESEND_API_KEY),
    r2: Boolean(
      env.R2_ACCOUNT_ID &&
        env.R2_ACCESS_KEY_ID &&
        env.R2_SECRET_ACCESS_KEY &&
        env.R2_BUCKET_NAME,
    ),
  };

  const healthy = database === "ok";

  return ok(
    {
      status: healthy ? "ok" : "degraded",
      database,
      integrations,
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    healthy ? "Layanan berjalan normal." : "Database tidak dapat dijangkau.",
    healthy ? 200 : 503,
  );
});
