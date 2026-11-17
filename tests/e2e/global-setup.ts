import { mkdir, writeFile } from "node:fs/promises";
import { request } from "@playwright/test";
import { credentials } from "./helpers";

// Di luar test-results/ karena Playwright menghapus direktori output di awal
// setiap run; dengan begitu state bisa dipakai ulang lewat E2E_SKIP_GLOBAL_SETUP.
const AUTH_DIR = "tests/e2e/.auth";
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

async function saveStorageState(role: keyof typeof credentials): Promise<void> {
  const path = `${AUTH_DIR}/${role}.json`;
  const { email, password } = credentials[role];

  if (!email || !password) {
    await writeFile(path, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  const context = await request.newContext({ baseURL: BASE_URL });

  try {
    const response = await context.post("/api/v1/auth/login", {
      data: { email, password },
    });

    if (!response.ok()) {
      console.warn(
        `[e2e] Login ${role} gagal (${response.status()}); test terkait akan dilewati.`,
      );
      await writeFile(path, JSON.stringify({ cookies: [], origins: [] }));
      return;
    }

    await context.storageState({ path });
  } finally {
    await context.dispose();
  }
}

export default async function globalSetup(): Promise<void> {
  await mkdir(AUTH_DIR, { recursive: true });

  for (const role of ["patient", "counselor", "admin"] as const) {
    await saveStorageState(role);
  }
}
