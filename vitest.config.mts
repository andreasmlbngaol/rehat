import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": root,
      // `server-only` melempar error di luar React Server Component.
      // Untuk test Node, ganti dengan modul kosong.
      "server-only": fileURLToPath(
        new URL("./tests/mocks/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    globals: false,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/api/**/*.test.ts", "tests/integration/**/*.test.ts"],
    exclude: ["tests/e2e/**", "node_modules/**"],
    // Integration test memakai satu database; jangan jalankan file paralel.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    reporters: process.env.CI ? ["default", "junit"] : ["default"],
    outputFile: process.env.CI ? { junit: "./test-results/vitest-junit.xml" } : undefined,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: [
        "lib/api/**/*.ts",
        "lib/validation/**/*.ts",
        "lib/services/**/*.ts",
        "lib/dto/**/*.ts",
        "lib/format.ts",
        "lib/time.ts",
        "lib/roles.ts",
        "lib/logger.ts",
        "lib/monitoring/**/*.ts",
        "lib/openapi/**/*.ts",
      ],
      exclude: ["lib/generated/**", "**/*.d.ts"],
    },
  },
});
