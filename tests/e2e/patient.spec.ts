import { expect, test } from "@playwright/test";
import { hasCredentials, skipReason } from "./helpers";

test.use({ storageState: "tests/e2e/.auth/patient.json" });

test.describe("alur pasien", () => {
  test("membuat pemesanan sampai halaman pembayaran", async ({ page }) => {
    test.skip(!hasCredentials("patient"), skipReason("patient"));

    await page.goto("/dashboard/bookings/new");
    await expect(
      page.getByRole("heading", { name: /pesan sesi konseling/i }),
    ).toBeVisible();

    // Langkah 1: pilih layanan pertama yang tersedia.
    const serviceButton = page
      .locator("main button")
      .filter({ hasText: /menit/i })
      .first();
    await expect(serviceButton).toBeVisible({ timeout: 20_000 });
    await serviceButton.click();

    // Langkah 2: pilih konselor pertama.
    const counselorButton = page
      .locator("main button")
      .filter({ hasText: /Ayu|Bima|Konselor/i })
      .first();
    await expect(counselorButton).toBeVisible({ timeout: 20_000 });
    await counselorButton.click();

    // Langkah 3: pilih slot pertama pada tanggal aktif.
    const slotButton = page
      .getByRole("button", { name: /^\d{2}\.\d{2}$/ })
      .first();
    await expect(slotButton).toBeVisible({ timeout: 20_000 });
    await slotButton.click();

    // Langkah 4: pilih metode dan lanjut.
    await expect(
      page.getByText(/konfirmasi pemesanan/i).first(),
    ).toBeVisible();

    const chatButton = page.getByRole("button", { name: "Chat", exact: true });
    const zoomButton = page.getByRole("button", { name: "Zoom", exact: true });

    if (await chatButton.count()) {
      await chatButton.first().click();
    } else {
      await zoomButton.first().click();
    }

    await page
      .getByRole("button", { name: /lanjut ke pembayaran/i })
      .click();

    await expect(page).toHaveURL(/\/dashboard\/bookings\/[0-9a-f-]+\/payment/);
    await expect(
      page.getByRole("button", { name: /bayar sekarang/i }),
    ).toBeVisible({ timeout: 20_000 });

    // Regresi: kembali ke wizard setelah membuat pesanan harus mulai dari
    // langkah 1, bukan mempertahankan state Konfirmasi dari bfcache.
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard\/bookings\/new/);
    await expect(page.getByText(/konfirmasi pemesanan/i)).toHaveCount(0);
    await expect(
      page.locator("main button").filter({ hasText: /menit/i }).first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("halaman riwayat dan sesi dapat dibuka", async ({ page }) => {
    test.skip(!hasCredentials("patient"), skipReason("patient"));

    await page.goto("/dashboard/bookings");
    await expect(
      page.getByRole("heading", { name: /pemesanan saya/i }),
    ).toBeVisible();

    await page.goto("/dashboard/sessions");
    await expect(
      page.getByRole("heading", { name: /sesi konseling/i }),
    ).toBeVisible();

    await page.goto("/dashboard/profile");
    await expect(
      page.getByRole("heading", { name: /profil saya/i }),
    ).toBeVisible();
  });

  test("tombol bayar memanggil Snap (mock)", async ({ page }) => {
    test.skip(
      process.env.E2E_PAYMENT !== "true",
      "Set E2E_PAYMENT=true untuk menguji integrasi Snap (butuh kredensial Midtrans sandbox).",
    );
    test.skip(!hasCredentials("patient"), skipReason("patient"));

    await page.route(
      "https://app.sandbox.midtrans.com/snap/snap.js",
      async (route) => {
        await route.fulfill({
          contentType: "application/javascript",
          body: `
            window.snap = {
              pay: function (token, callbacks) {
                window.__snapToken = token;
                if (callbacks && callbacks.onSuccess) {
                  callbacks.onSuccess({ order_id: "e2e", transaction_status: "settlement" });
                }
              }
            };
          `,
        });
      },
    );

    await page.goto("/dashboard/bookings/new");
    await expect(
      page.getByRole("heading", { name: /pesan sesi konseling/i }),
    ).toBeVisible();

    await page
      .locator("main button")
      .filter({ hasText: /menit/i })
      .first()
      .click();
    await page
      .locator("main button")
      .filter({ hasText: /Ayu|Bima|Konselor/i })
      .first()
      .click();
    await page
      .getByRole("button", { name: /^\d{2}\.\d{2}$/ })
      .first()
      .click();

    const chatButton = page.getByRole("button", { name: "Chat", exact: true });
    if (await chatButton.count()) await chatButton.first().click();
    else await page.getByRole("button", { name: "Zoom", exact: true }).first().click();

    await page
      .getByRole("button", { name: /lanjut ke pembayaran/i })
      .click();
    await expect(page).toHaveURL(/\/payment/);

    await page.getByRole("button", { name: /bayar sekarang/i }).click();

    await expect(
      page.getByText(/pembayaran berhasil/i),
    ).toBeVisible({ timeout: 30_000 });
  });
});
