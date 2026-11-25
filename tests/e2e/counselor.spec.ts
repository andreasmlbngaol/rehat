import { expect, test } from "@playwright/test";
import {
  hasCredentials,
  skipReason,
  tomorrowWib,
} from "./helpers";

test.use({ storageState: "tests/e2e/.auth/counselor.json" });

test.describe("alur konselor", () => {
  test("menambah slot jadwal baru", async ({ page }) => {
    test.skip(!hasCredentials("counselor"), skipReason("counselor"));

    await page.goto("/counselor/schedule");
    await expect(
      page.getByRole("heading", { name: /jadwal saya/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /tambah slot/i }).first().click();
    await expect(
      page.getByRole("dialog").getByText(/tambah slot jadwal/i),
    ).toBeVisible();

    await page.getByLabel("Layanan").selectOption({ index: 1 });
    await page
      .getByLabel(/waktu mulai \(wib\)/i)
      .fill(
        tomorrowWib(
          9 + Math.floor(Math.random() * 11),
          Math.floor(Math.random() * 60),
          14 + Math.floor(Math.random() * 45),
        ),
      );

    await page.getByRole("button", { name: /simpan slot/i }).click();

    await expect(
      page.getByText(/slot jadwal berhasil dibuat/i),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("halaman sesi dan profil dapat dibuka", async ({ page }) => {
    test.skip(!hasCredentials("counselor"), skipReason("counselor"));

    await page.goto("/counselor/sessions");
    await expect(
      page.getByRole("heading", { name: /sesi pasien/i }),
    ).toBeVisible();

    await page.goto("/counselor/profile");
    await expect(
      page.getByRole("heading", { name: /profil konselor/i }),
    ).toBeVisible();
  });
});
