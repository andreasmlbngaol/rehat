"use client";

export type FieldErrors = Record<string, string[]>;

type Envelope<T> = {
  success: boolean;
  data: T | null;
  message: string | null;
  errors: FieldErrors | null;
  code: string | null;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly fieldErrors: FieldErrors | null;

  constructor(
    message: string,
    options: { status: number; code?: string | null; fieldErrors?: FieldErrors | null },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code ?? null;
    this.fieldErrors = options.fieldErrors ?? null;
  }
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  formData?: FormData;
};

/**
 * Memanggil API internal dan membuka envelope `{ success, data, ... }`.
 * Semua request membawa cookie sesi Supabase.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { body, formData, headers, ...rest } = options;

  const requestHeaders = new Headers(headers);

  let requestBody: BodyInit | undefined;

  if (formData) {
    requestBody = formData;
  } else if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(path, {
    ...rest,
    headers: requestHeaders,
    body: requestBody,
    credentials: "include",
    cache: "no-store",
  });

  let envelope: Envelope<T> | null = null;

  try {
    envelope = (await response.json()) as Envelope<T>;
  } catch {
    envelope = null;
  }

  if (!response.ok || !envelope?.success) {
    throw new ApiError(
      envelope?.message ?? "Terjadi kesalahan. Coba lagi beberapa saat lagi.",
      {
        status: response.status,
        code: envelope?.code,
        fieldErrors: envelope?.errors,
      },
    );
  }

  return envelope.data as T;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Terjadi kesalahan. Coba lagi beberapa saat lagi.";
}

export function fieldError(
  error: unknown,
  field: string,
): string | undefined {
  if (!(error instanceof ApiError)) return undefined;
  return error.fieldErrors?.[field]?.[0];
}
