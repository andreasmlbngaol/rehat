const FALLBACK = "/dashboard";

/**
 * Allows only same-origin absolute paths. Rejects protocol-relative URLs,
 * backslashes (browsers normalize them to "/"), encoded backslashes, and
 * control characters that could alter navigation.
 */
export function safeRedirectPath(
  value: string | null | undefined,
  fallback = FALLBACK,
): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("\\") || /%5c/i.test(value)) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;

  try {
    const base = "https://rehat.invalid";
    const url = new URL(value, base);
    if (url.origin !== base) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
