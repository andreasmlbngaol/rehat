import { describe, expect, it } from "vitest";
import { buildOpenApiDocument } from "@/lib/openapi/registry";

type Json = Record<string, unknown>;

const document = buildOpenApiDocument() as Json;

function collectRefs(value: unknown, refs: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) collectRefs(item, refs);
    return refs;
  }

  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value as Json)) {
      if (key === "$ref" && typeof child === "string") refs.push(child);
      else collectRefs(child, refs);
    }
  }

  return refs;
}

describe("buildOpenApiDocument", () => {
  it("memakai OpenAPI 3.1", () => {
    expect(document.openapi).toBe("3.1.0");
    expect((document.info as Json).title).toBe("REHAT API");
  });

  it("mendaftarkan seluruh tag yang dipakai", () => {
    const tagNames = new Set(
      (document.tags as Json[]).map((tag) => tag.name as string),
    );
    const paths = document.paths as Record<string, Record<string, Json>>;

    for (const [path, operations] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(operations)) {
        if (!["get", "post", "put", "patch", "delete"].includes(method)) {
          continue;
        }

        expect(operation.summary, `${method.toUpperCase()} ${path}`).toBeTruthy();
        expect(operation.responses, `${method.toUpperCase()} ${path}`).toBeTruthy();

        for (const tag of (operation.tags as string[] | undefined) ?? []) {
          expect(tagNames.has(tag), `tag "${tag}" pada ${path}`).toBe(true);
        }
      }
    }
  });

  it("tidak memiliki $ref yang menggantung", () => {
    const schemas = (document.components as Json).schemas as Json;
    const refs = collectRefs(document);

    expect(refs.length).toBeGreaterThan(0);

    for (const ref of refs) {
      const name = ref.replace("#/components/schemas/", "");
      expect(schemas[name], `schema "${name}" tidak ada`).toBeDefined();
    }
  });

  it("mendokumentasikan endpoint sistem yang baru", () => {
    const paths = document.paths as Json;

    expect(paths["/api/v1/health"]).toBeDefined();
    expect(paths["/api/v1/health/live"]).toBeDefined();
    expect(paths["/api/v1/health/ready"]).toBeDefined();
    expect(paths["/api/v1/client-errors"]).toBeDefined();
  });

  it("mendokumentasikan seluruh endpoint utama", () => {
    const paths = Object.keys(document.paths as Json);

    const required = [
      "/api/v1/auth/signup",
      "/api/v1/auth/login",
      "/api/v1/auth/oauth/google",
      "/api/v1/auth/logout",
      "/api/v1/auth/forgot-password",
      "/api/v1/auth/reset-password",
      "/api/v1/auth/resend-verification",
      "/api/v1/auth/email-hook",
      "/api/v1/profile",
      "/api/v1/profile/avatar",
      "/api/v1/services",
      "/api/v1/counselors",
      "/api/v1/time-slots",
      "/api/v1/bookings",
      "/api/v1/webhooks/midtrans",
      "/api/v1/sessions",
      "/api/v1/admin/stats",
      "/api/v1/admin/users",
      "/api/v1/admin/services",
      "/api/v1/admin/counselors",
      "/api/v1/admin/time-slots",
      "/api/v1/admin/bookings",
      "/api/v1/admin/payments",
      "/api/v1/admin/sessions",
      "/api/v1/health",
      "/api/docs",
    ];

    for (const path of required) {
      expect(paths, `path ${path} belum didokumentasikan`).toContain(path);
    }
  });

  it("respons sukses memakai envelope standar", () => {
    const paths = document.paths as Record<string, Record<string, Json>>;
    const health = paths["/api/v1/health"]!.get!;
    const response = (health.responses as Record<string, Json>)["200"]!;
    const content = response.content as Json;
    const schema = (content["application/json"] as Json).schema as Json;

    expect(schema.required).toEqual([
      "success",
      "data",
      "message",
      "errors",
      "code",
    ]);
    expect(Object.keys(schema.properties as Json)).toEqual([
      "success",
      "data",
      "message",
      "errors",
      "code",
    ]);
  });

  it("memakai server dari NEXT_PUBLIC_SITE_URL", () => {
    const servers = document.servers as Array<{ url: string }>;
    expect(servers[0]!.url).toBe("http://localhost:3000");
  });
});
