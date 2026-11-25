import { expect, test } from "@playwright/test";

test.describe("halaman publik", () => {
  test("beranda menampilkan hero, layanan, dan konselor", async ({ page }) => {
    const response = await page.goto("/");

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/REHAT/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /ruang aman untuk bercerita/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /mulai konseling/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /mulai dari yang paling sesuai/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /didampingi orang yang tepat/i }),
    ).toBeVisible();
  });

  test("menerapkan security headers", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers() ?? {};

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("daftar layanan dapat dibuka", async ({ page }) => {
    await page.goto("/services");

    await expect(
      page.getByRole("heading", { name: /pilih ruang yang paling nyaman/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/setiap layanan punya durasi dan metode berbeda/i),
    ).toBeVisible();
  });

  test("daftar konselor dapat dibuka", async ({ page }) => {
    await page.goto("/counselors");

    await expect(
      page.getByRole("heading", { name: /kenali pendampingmu/i }),
    ).toBeVisible();
  });

  test("halaman bantuan dan legal tersedia", async ({ page }) => {
    await page.goto("/faq");
    await expect(
      page.getByRole("heading", { name: /pertanyaan umum/i }),
    ).toBeVisible();

    await page.goto("/privacy");
    await expect(
      page.getByRole("heading", { name: /kebijakan privasi/i }),
    ).toBeVisible();
    await expect(page.getByText(/Perlindungan Data Pribadi/i).first()).toBeVisible();

    await page.goto("/terms");
    await expect(
      page.getByRole("heading", { name: /syarat & ketentuan/i }),
    ).toBeVisible();

    await page.goto("/contact");
    await expect(
      page.getByRole("heading", { name: /hubungi rehat/i }),
    ).toBeVisible();
    await expect(page.getByText(/119/).first()).toBeVisible();
  });

  test("halaman login menampilkan form dan opsi Google", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: /selamat datang kembali/i }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /masuk dengan google/i }),
    ).toHaveAttribute("href", "/api/v1/auth/oauth/google");
  });

  test("halaman tidak ditemukan menampilkan 404", async ({ page }) => {
    const response = await page.goto("/halaman-yang-tidak-ada");

    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: /halaman tidak ditemukan/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /kembali ke beranda/i }),
    ).toBeVisible();
  });
});
