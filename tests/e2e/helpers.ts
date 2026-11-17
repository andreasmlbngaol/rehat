import type { Page } from "@playwright/test";

export type RoleCredentials = {
  email: string | undefined;
  password: string | undefined;
};

export const credentials = {
  patient: {
    email: process.env.E2E_PATIENT_EMAIL,
    password: process.env.E2E_PATIENT_PASSWORD,
  },
  counselor: {
    email: process.env.E2E_COUNSELOR_EMAIL,
    password: process.env.E2E_COUNSELOR_PASSWORD,
  },
  admin: {
    email: process.env.E2E_ADMIN_EMAIL,
    password: process.env.E2E_ADMIN_PASSWORD,
  },
} satisfies Record<string, RoleCredentials>;

export function hasCredentials(role: keyof typeof credentials): boolean {
  const value = credentials[role];
  return Boolean(value.email && value.password);
}

export function skipReason(role: keyof typeof credentials): string {
  const name = role.toUpperCase();
  return `Set E2E_${name}_EMAIL dan E2E_${name}_PASSWORD untuk menjalankan test ini.`;
}

export async function login(
  page: Page,
  role: keyof typeof credentials,
): Promise<void> {
  const value = credentials[role];

  await page.goto("/login");
  await page.getByLabel("Email").fill(value.email!);
  await page.getByLabel("Password", { exact: true }).fill(value.password!);
  await page.getByRole("button", { name: /^masuk$/i }).click();

  // Tunggu sampai redirect login selesai agar cookie sesi sudah tersimpan.
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 20_000,
  });
}

/**
 * Tanggal besok dalam format `YYYY-MM-DDTHH:mm` menurut WIB.
 * Dipakai untuk mengisi input datetime-local pada dialog slot.
 */
export function tomorrowWib(hour = 10, minute = 0, daysAhead = 1): string {
  const wib = new Date(
    Date.now() + 7 * 60 * 60 * 1000 + daysAhead * 24 * 60 * 60 * 1000,
  );
  const year = wib.getUTCFullYear();
  const month = String(wib.getUTCMonth() + 1).padStart(2, "0");
  const day = String(wib.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}T${String(hour).padStart(2, "0")}:${String(
    minute,
  ).padStart(2, "0")}`;
}
