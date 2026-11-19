import { buildOpenApiDocument } from "@/lib/openapi/registry";

export function GET() {
  return Response.json(buildOpenApiDocument(), {
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
}
