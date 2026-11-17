import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  // Set E2E_SKIP_GLOBAL_SETUP=1 to reuse the storage states in tests/e2e/.auth
  // (useful when the seeded accounts already have a valid session).
  globalSetup: process.env.E2E_SKIP_GLOBAL_SETUP
    ? undefined
    : "./tests/e2e/global-setup.ts",
  // Tests in the same file share one Supabase storage state. Running them in
  // parallel would rotate the same refresh token concurrently and log the
  // other worker out, so keep a file serial while different files still run
  // in parallel.
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.E2E_WORKERS
    ? Number(process.env.E2E_WORKERS)
    : process.env.CI
      ? 1
      : undefined,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  // Database staging berada jauh dari Vercel; beri ruang untuk skeleton data.
  expect: { timeout: 20_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Halaman publik tidak memakai sesi, sehingga aman dijalankan paralel
      // di beberapa browser tanpa berebut refresh token Supabase.
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
      testMatch: /public\.spec\.ts/,
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      testMatch: /public\.spec\.ts/,
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testMatch: /public\.spec\.ts/,
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "bun run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
