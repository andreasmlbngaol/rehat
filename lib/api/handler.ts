import type { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { getUser, type AuthUser } from "@/lib/auth/dal";
import { errors } from "@/lib/api/errors";
import { handleError } from "@/lib/api/response";
import { clientIp, consume } from "@/lib/api/rate-limit";
import { logRequest } from "@/lib/logger";
import type { UserRole } from "@/lib/auth/roles";

export type RouteContext<P extends Record<string, string>> = {
  request: NextRequest;
  params: P;
  user: AuthUser | null;
  searchParams: URLSearchParams;
};

type RateLimit = { limit: number; windowMs: number };

/**
 * `roles` is only meaningful for authenticated routes, so the type prevents
 * accidentally exposing a role-protected handler to anonymous requests.
 */
type RouteOptions =
  | { auth?: "none" | "optional"; roles?: never; rateLimit?: RateLimit }
  | { auth: "required"; roles?: UserRole[]; rateLimit?: RateLimit };

type RouteHandler<P extends Record<string, string>> = (
  context: RouteContext<P>,
) => Promise<Response>;

/**
 * Wrapper Route Handler: rate limit, autentikasi, otorisasi peran, logging,
 * dan pemetaan error ke envelope yang konsisten.
 */
export function apiRoute<P extends Record<string, string> = Record<string, never>>(
  options: RouteOptions,
  handler: RouteHandler<P>,
) {
  return async (
    request: NextRequest,
    context: { params: Promise<P> },
  ): Promise<Response> => {
    const requestId = request.headers.get("x-request-id") ?? randomUUID();
    const startedAt = Date.now();
    const path = request.nextUrl.pathname;
    let user: AuthUser | null = null;

    function finish(response: Response): Response {
      response.headers.set("x-request-id", requestId);
      logRequest({
        requestId,
        method: request.method,
        path,
        status: response.status,
        durationMs: Date.now() - startedAt,
        userId: user?.id ?? null,
        ip: clientIp(request),
      });
      return response;
    }

    try {
      if (options.rateLimit) {
        const key = `${clientIp(request)}:${path}`;
        const result = consume(key, options.rateLimit.limit, options.rateLimit.windowMs);
        if (!result.allowed) {
          const response = handleError(errors.rateLimited(), {
            requestId,
            path,
          });
          response.headers.set("Retry-After", String(result.retryAfterSeconds));
          return finish(response);
        }
      }

      const params = ((await context.params) ?? {}) as P;
      const authMode = options.auth ?? "none";

      if (authMode !== "none") {
        user = await getUser();
      }

      if (authMode === "required" && !user) {
        throw errors.unauthenticated();
      }

      if (user && !user.emailConfirmed) {
        throw errors.emailNotVerified();
      }

      if (user && !user.isActive) {
        throw errors.accountInactive();
      }

      if (options.roles && user && !options.roles.includes(user.role)) {
        throw errors.forbidden();
      }

      return finish(
        await handler({
          request,
          params,
          user,
          searchParams: request.nextUrl.searchParams,
        }),
      );
    } catch (error) {
      return finish(
        handleError(error, {
          requestId,
          path,
          userId: user?.id ?? null,
        }),
      );
    }
  };
}
