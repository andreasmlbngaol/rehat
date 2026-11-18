import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";

/**
 * Readiness: dependensi utama (database) siap melayani request.
 */
export const GET = apiRoute({}, async () => {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`select 1`;

    return ok({
      status: "ready",
      database: "ok",
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError({ event: "health_ready_failed", error });

    return ok(
      {
        status: "not_ready",
        database: "error",
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      "Database tidak dapat dijangkau.",
      503,
    );
  }
});
