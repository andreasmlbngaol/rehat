import { expect, test } from "@playwright/test";
import {
  credentials,
  hasCredentials,
  login,
  skipReason,
} from "./helpers";

test.describe("autentikasi", () => {
  test("menolak password yang salah dengan pesan generik", async ({ page }) => {
    test.skip(
      !hasCredentials("patient"),
      skipReason("patient"),
    );

    await page.goto("/login");
    await page.getByLabel("Email").fill(credentials.patient.email!);
    await page.getByLabel("Password", { exact: true }).fill("password-yang-salah");
    await page.getByRole("button", { name: /^masuk$/i }).click();

    await expect(page.getByText(/email atau password salah/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("pasien dapat masuk dan keluar", async ({ page }) => {
    test.skip(!hasCredentials("patient"), skipReason("patient"));

    await login(page, "patient");

    await expect(page).toHaveURL(/\/dashboard/);
    // Database staging jauh; skeleton bisa tampil lama sebelum data tiba.
    await expect(page.getByRole("heading", { name: /^halo,/i })).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("button", { name: "Keluar" }).first().click();

    await expect(page).toHaveURL(/\/login/);
  });

  test("konselor diarahkan ke dashboard konselor", async ({ page }) => {
    test.skip(!hasCredentials("counselor"), skipReason("counselor"));

    await login(page, "counselor");

    await expect(page).toHaveURL(/\/counselor/);
    await expect(
      page.getByText(/kelola jadwal dan sesi konselingmu/i),
    ).toBeVisible();
  });

  test("admin diarahkan ke dashboard admin", async ({ page }) => {
    test.skip(!hasCredentials("admin"), skipReason("admin"));

    await login(page, "admin");

    await expect(page).toHaveURL(/\/admin/);
    await expect(
      page.getByRole("heading", { name: /ringkasan operasional/i }),
    ).toBeVisible();
  });

  test("pasien tidak dapat membuka halaman admin", async ({ page }) => {
    test.skip(!hasCredentials("patient"), skipReason("patient"));

    await login(page, "patient");
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/admin");

    await expect(page).toHaveURL(/\/dashboard/);
  });
});
