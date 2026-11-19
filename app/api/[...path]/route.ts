import { errors } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";

function notFound(): Response {
  return fail(errors.notFound("Endpoint API tidak ditemukan."));
}

export const GET = notFound;
export const POST = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;
export const HEAD = notFound;
export const OPTIONS = notFound;
