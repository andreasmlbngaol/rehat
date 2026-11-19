import { AppError, errors, isAppError, type ErrorCode, type FieldErrors } from "@/lib/api/errors";
import { log } from "@/lib/logger";
import { captureException } from "@/lib/monitoring/server";

export type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  message: string | null;
  errors: FieldErrors | null;
  code: ErrorCode | null;
};

export function ok<T>(data: T, message?: string, status = 200): Response {
  const body: ApiEnvelope<T> = {
    success: true,
    data,
    message: message ?? null,
    errors: null,
    code: null,
  };

  return Response.json(body, { status });
}

export function fail(error: AppError): Response {
  const body: ApiEnvelope<never> = {
    success: false,
    data: null,
    message: error.message,
    errors: error.errors,
    code: error.code,
  };

  return Response.json(body, { status: error.status });
}

export function handleError(
  error: unknown,
  context: {
    requestId?: string;
    path?: string;
    userId?: string | null;
  } = {},
): Response {
  if (isAppError(error)) {
    log("warn", "api_error", {
      requestId: context.requestId,
      path: context.path,
      userId: context.userId,
      code: error.code,
      status: error.status,
      message: error.message,
    });
    return fail(error);
  }

  captureException(error, {
    requestId: context.requestId,
    path: context.path,
    userId: context.userId,
    event: "unhandled_api_error",
  });

  return fail(errors.internal());
}
