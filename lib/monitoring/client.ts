"use client";

/**
 * Melaporkan error sisi klien ke endpoint internal. Dipakai error boundary
 * agar kegagalan render tidak hilang begitu saja di browser pengguna.
 */
export function reportClientError(
  error: Error & { digest?: string },
  context: Record<string, unknown> = {},
): void {
  const payload = JSON.stringify({
    message: error.message.slice(0, 2000),
    stack: error.stack?.slice(0, 10_000),
    digest: error.digest,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    context,
  });

  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    const blob = new Blob([payload], { type: "application/json" });
    if (navigator.sendBeacon("/api/v1/client-errors", blob)) return;
  }

  void fetch("/api/v1/client-errors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}
