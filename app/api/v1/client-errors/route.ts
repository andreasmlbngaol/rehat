import { z } from "zod";
import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseBody, readJson } from "@/lib/api/validation";
import { log } from "@/lib/logger";

const clientErrorSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  stack: z.string().max(10_000).optional(),
  digest: z.string().max(200).optional(),
  url: z.string().max(500).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

export const POST = apiRoute(
  { auth: "none", rateLimit: { limit: 20, windowMs: 60_000 } },
  async ({ request }) => {
    const input = parseBody(clientErrorSchema, await readJson(request));

    log("error", "client_error", {
      message: input.message,
      stack: input.stack,
      digest: input.digest,
      url: input.url,
      context: input.context,
    });

    return ok(null, "Laporan diterima.", 202);
  },
);
