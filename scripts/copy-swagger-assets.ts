import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * Menyalin aset Swagger UI yang sudah dibangun ke `public/swagger-ui`.
 * Dipakai agar halaman /docs tidak bergantung pada bundler untuk pustaka
 * berat dan tetap berjalan di image Docker tanpa build native.
 */
const source = path.join(process.cwd(), "node_modules", "swagger-ui-dist");
const target = path.join(process.cwd(), "public", "swagger-ui");

const assets = [
  "swagger-ui-bundle.js",
  "swagger-ui-standalone-preset.js",
  "favicon-16x16.png",
  "favicon-32x32.png",
];

await mkdir(target, { recursive: true });

for (const asset of assets) {
  await copyFile(path.join(source, asset), path.join(target, asset));
}

console.log(`Aset Swagger UI disalin ke public/swagger-ui (${assets.length} berkas).`);
