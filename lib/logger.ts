import "server-only";

type Level = "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

const REDACTED_KEYS = new Set([
  "authorization",
  "cookie",
  "password",
  "token",
  "secret",
  "key",
  "signature",
]);

function redact(fields: LogFields): LogFields {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => {
      if (REDACTED_KEYS.has(key.toLowerCase())) {
        return [key, "[redacted]"];
      }
      return [key, value];
    }),
  );
}

/**
 * Logger terstruktur tanpa dependency. Output JSON satu baris agar mudah
 * dikirim ke log drain (Vercel/Axiom/Better Stack).
 */
export function log(level: Level, event: string, fields: LogFields = {}): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...redact(fields),
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export function logRequest(input: {
  requestId: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  userId?: string | null;
  ip?: string;
}): void {
  log(input.status >= 500 ? "error" : "info", "http_request", input);
}

export function logError(input: {
  event: string;
  error: unknown;
  requestId?: string;
  path?: string;
  userId?: string | null;
  context?: LogFields;
}): void {
  const error = input.error;
  log("error", input.event, {
    requestId: input.requestId,
    path: input.path,
    userId: input.userId,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...input.context,
  });
}
