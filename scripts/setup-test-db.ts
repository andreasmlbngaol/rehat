import "dotenv/config";
import { spawnSync } from "node:child_process";

/**
 * Menyiapkan database uji: menjalankan migrasi Prisma terhadap
 * TEST_DATABASE_URL (bukan DATABASE_URL aplikasi).
 */
const url = process.env.TEST_DATABASE_URL;

if (!url) {
  console.error(
    "TEST_DATABASE_URL belum diisi. Contoh:\n" +
      '  TEST_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/rehat_test"',
  );
  process.exit(1);
}

const result = spawnSync("bunx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: url },
});

process.exit(result.status ?? 1);
