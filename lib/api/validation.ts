import { z } from "zod";
import { errors, type FieldErrors } from "@/lib/api/errors";

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_";
    (result[key] ??= []).push(issue.message);
  }

  return result;
}

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw errors.validation(toFieldErrors(result.error));
  }
  return result.data;
}

export function parseQuery<T>(schema: z.ZodType<T>, searchParams: URLSearchParams): T {
  const raw: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    raw[key] = value;
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    throw errors.validation(toFieldErrors(result.error), "Parameter pencarian tidak valid.");
  }
  return result.data;
}

export function parseParam<T>(
  schema: z.ZodType<T>,
  value: string,
  field = "id",
): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw errors.validation({ [field]: ["Format tidak valid."] });
  }
  return result.data;
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw errors.validation({ _: ["Body harus berupa JSON yang valid."] });
  }
}
