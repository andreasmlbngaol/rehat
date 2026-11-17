import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildOpenApiDocument } from "../lib/openapi/registry";

const document = buildOpenApiDocument();
const outputDir = path.join(process.cwd(), "public");
const outputFile = path.join(outputDir, "openapi.json");

await mkdir(outputDir, { recursive: true });
await writeFile(outputFile, `${JSON.stringify(document, null, 2)}\n`, "utf8");

const pathCount = Object.keys(document.paths).length;
const operationCount = Object.values(document.paths).reduce(
  (total, item) => total + Object.keys(item as object).length,
  0,
);

console.log(
  `OpenAPI ditulis ke public/openapi.json (${pathCount} path, ${operationCount} operasi).`,
);
