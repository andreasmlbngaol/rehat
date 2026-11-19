import "server-only";
import { logError } from "@/lib/logger";

type CaptureContext = {
  requestId?: string;
  path?: string;
  userId?: string | null;
  event?: string;
  context?: Record<string, unknown>;
};

/**
 * Titik integrasi error tracking. Saat ini menulis log terstruktur; jika
 * ERROR_REPORT_WEBHOOK_URL diisi, payload juga dikirim ke webhook (mis.
 * Slack, Better Stack, atau relay Sentry) tanpa menahan response.
 */
export function captureException(
  error: unknown,
  captureContext: CaptureContext = {},
): void {
  logError({
    event: captureContext.event ?? "server_error",
    error,
    requestId: captureContext.requestId,
    path: captureContext.path,
    userId: captureContext.userId,
    context: captureContext.context,
  });

  const webhook = process.env.ERROR_REPORT_WEBHOOK_URL;
  if (!webhook) return;

  const payload = {
    service: "rehat",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...captureContext,
  };

  void fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => undefined);
}
