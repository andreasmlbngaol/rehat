import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function audit(page: Page, path: string): Promise<string[]> {
  await page.goto(path);
  await expect(page.locator("main")).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

  return results.violations.map(
    (violation) =>
      `${violation.id} [${violation.impact}]: ${violation.help} - ${violation.nodes
        .map((node) => node.target.join(" "))
        .join(", ")}`,
  );
}

const PUBLIC_PAGES = [
  { path: "/", label: "beranda" },
  { path: "/services", label: "daftar layanan" },
  { path: "/counselors", label: "daftar konselor" },
  { path: "/login", label: "login" },
  { path: "/register", label: "registrasi" },
  { path: "/faq", label: "FAQ" },
  { path: "/contact", label: "kontak" },
];

for (const { path, label } of PUBLIC_PAGES) {
  test(`${label} memenuhi WCAG 2.1 A/AA`, async ({ page }) => {
    expect(await audit(page, path)).toEqual([]);
  });
}

test.describe("halaman pasien", () => {
  test.use({ storageState: "tests/e2e/.auth/patient.json" });

  for (const { path, label } of [
    { path: "/dashboard", label: "dashboard pasien" },
    { path: "/dashboard/bookings", label: "riwayat pemesanan" },
    { path: "/dashboard/sessions", label: "daftar sesi pasien" },
    { path: "/dashboard/profile", label: "profil pasien" },
  ]) {
    test(`${label} memenuhi WCAG 2.1 A/AA`, async ({ page }) => {
      expect(await audit(page, path)).toEqual([]);
    });
  }
});

test.describe("halaman konselor", () => {
  test.use({ storageState: "tests/e2e/.auth/counselor.json" });

  for (const { path, label } of [
    { path: "/counselor", label: "dashboard konselor" },
    { path: "/counselor/schedule", label: "jadwal konselor" },
    { path: "/counselor/sessions", label: "sesi konselor" },
    { path: "/counselor/profile", label: "profil konselor" },
  ]) {
    test(`${label} memenuhi WCAG 2.1 A/AA`, async ({ page }) => {
      expect(await audit(page, path)).toEqual([]);
    });
  }
});

test.describe("halaman admin", () => {
  test.use({ storageState: "tests/e2e/.auth/admin.json" });

  for (const { path, label } of [
    { path: "/admin", label: "dashboard admin" },
    { path: "/admin/users", label: "kelola pengguna" },
    { path: "/admin/counselors", label: "kelola konselor" },
    { path: "/admin/services", label: "kelola layanan" },
    { path: "/admin/time-slots", label: "kelola slot jadwal" },
    { path: "/admin/bookings", label: "kelola pemesanan" },
    { path: "/admin/payments", label: "kelola pembayaran" },
    { path: "/admin/sessions", label: "kelola sesi" },
  ]) {
    test(`${label} memenuhi WCAG 2.1 A/AA`, async ({ page }) => {
      expect(await audit(page, path)).toEqual([]);
    });
  }
});
