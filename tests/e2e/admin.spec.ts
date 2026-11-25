import { expect, test } from "@playwright/test";
import { hasCredentials, skipReason } from "./helpers";

test.use({ storageState: "tests/e2e/.auth/admin.json" });

test.describe("alur admin", () => {
  test("semua halaman administrasi dapat dibuka", async ({ page }) => {
    test.skip(!hasCredentials("admin"), skipReason("admin"));

    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: /ringkasan operasional/i }),
    ).toBeVisible();

    const pages: Array<{ path: string; heading: RegExp }> = [
      { path: "/admin/users", heading: /pengguna/i },
      { path: "/admin/services", heading: /layanan/i },
      { path: "/admin/counselors", heading: /konselor/i },
      { path: "/admin/time-slots", heading: /slot jadwal/i },
      { path: "/admin/bookings", heading: /pemesanan/i },
      { path: "/admin/payments", heading: /pembayaran/i },
      { path: "/admin/sessions", heading: /sesi/i },
    ];

    for (const item of pages) {
      await page.goto(item.path);
      await expect(
        page.getByRole("heading", { name: item.heading }),
      ).toBeVisible();
    }
  });

  test("sidebar tetap setinggi viewport dan tombol keluar terlihat", async ({
    page,
  }) => {
    test.skip(!hasCredentials("admin"), skipReason("admin"));

    await page.setViewportSize({ width: 1440, height: 520 });
    await page.goto("/admin/users");
    await expect(
      page.getByRole("heading", { name: /pengguna/i }),
    ).toBeVisible();

    const aside = page.locator("aside").first();
    const box = await aside.boundingBox();
    expect(box?.height).toBeLessThanOrEqual(521);

    const position = await aside.evaluate(
      (element) => getComputedStyle(element).position,
    );
    expect(position).toBe("sticky");

    await expect(
      page.getByRole("button", { name: /^keluar$/i }),
    ).toBeInViewport();
  });

  test("pencarian pengguna berfungsi", async ({ page }) => {
    test.skip(!hasCredentials("admin"), skipReason("admin"));

    await page.goto("/admin/users");
    await expect(
      page.getByRole("heading", { name: /pengguna/i }),
    ).toBeVisible();

    const search = page.getByPlaceholder(/cari nama atau email/i);
    await expect(search).toBeVisible();

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/admin/users") &&
        response.url().includes("q=ayu.counselor"),
    );

    await search.fill("ayu.counselor");
    await page.getByRole("button", { name: /^cari$/i }).click();

    const response = await responsePromise;
    expect(response.status()).toBe(200);

    await expect(
      page.getByText("ayu.counselor@booroong.online").first(),
    ).toBeVisible({ timeout: 20_000 });
  });
});
