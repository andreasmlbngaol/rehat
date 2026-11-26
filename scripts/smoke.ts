import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { Client } from "pg";
import { createClient } from "@supabase/supabase-js";

/**
 * Smoke test end-to-end terhadap server yang sedang berjalan.
 *
 * Prasyarat:
 *   - `bun run dev` (atau build produksi) aktif di SMOKE_BASE_URL
 *   - `.env` berisi kredensial Supabase, Midtrans, dan Zoom
 *
 * Skenario: login pasien & admin → pilih layanan → buat slot → booking →
 * Snap → webhook sukses → sesi aktif → kirim pesan → retry Zoom → stats admin.
 */

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const databaseUrl = process.env.DATABASE_URL;
const serverKey = process.env.MIDTRANS_SERVER_KEY;

if (!databaseUrl) throw new Error("DATABASE_URL belum diisi di .env");
if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY belum diisi di .env");

const runIp = `10.${Math.floor(Math.random() * 250)}.${Math.floor(
  Math.random() * 250,
)}.${Math.floor(Math.random() * 250)}`;

type ApiResult<T = unknown> = {
  status: number;
  body: {
    success: boolean;
    data: T;
    message: string | null;
    errors: Record<string, string[]> | null;
    code: string | null;
  } | null;
  text: string;
};

class ApiSession {
  private cookies = new Map<string, string>();

  async request<T = unknown>(
    path: string,
    init: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
  ): Promise<ApiResult<T>> {
    const headers = new Headers(init.headers);
    headers.set("x-forwarded-for", runIp);

    if (init.body !== undefined) {
      headers.set("content-type", "application/json");
    }

    if (this.cookies.size > 0) {
      headers.set(
        "cookie",
        [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; "),
      );
    }

    const response = await fetch(`${baseUrl}${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      redirect: "manual",
    });

    const setCookies =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : [];

    for (const raw of setCookies) {
      const pair = raw.split(";")[0] ?? "";
      const index = pair.indexOf("=");
      if (index <= 0) continue;

      const name = pair.slice(0, index).trim();
      const value = pair.slice(index + 1);

      if (value.length === 0) {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }

    const text = await response.text();
    let body: ApiResult<T>["body"] = null;

    try {
      body = text ? (JSON.parse(text) as ApiResult<T>["body"]) : null;
    } catch {
      body = null;
    }

    return { status: response.status, body, text };
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function expectStatus(result: ApiResult, expected: number, label: string) {
  if (result.status !== expected) {
    throw new Error(
      `${label}: mengharapkan ${expected}, menerima ${result.status} — ${
        result.body?.message ?? result.text.slice(0, 300)
      }`,
    );
  }
}

const steps: string[] = [];

async function step<T>(label: string, run: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  const value = await run();
  steps.push(`✓ ${label} (${Date.now() - startedAt} ms)`);
  return value;
}

function midtransSignature(orderId: string, statusCode: string, grossAmount: string) {
  return createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");
}

function midtransTime(date: Date) {
  const wib = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(0, 19).replace("T", " ");
}

async function ensureSmokePatient() {
  const email = process.env.SMOKE_PATIENT_EMAIL ?? "smoke.patient@booroong.online";
  const password = process.env.SMOKE_PATIENT_PASSWORD ?? "SmokeTest123!";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Smoke Pasien" },
  });

  if (created.error) {
    const users = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = users.data.users.find((item) => item.email === email);

    if (!existing) {
      throw new Error(`Gagal menyiapkan akun smoke: ${created.error.message}`);
    }

    await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
  }

  return { email, password };
}

function findFreeSlotStart(): Date {
  // Cari waktu mulai bebas konflik dalam 3 hari ke depan, mulai pukul 20.00 WIB.
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + 1);
  start.setUTCHours(13, 0, 0, 0); // 20.00 WIB

  return start;
}

async function activateSessionForTest(bookingId: string) {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: /(?:localhost|127\.0\.0\.1)/.test(databaseUrl!)
      ? undefined
      : { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    await client.query(
      `update time_slots ts
          set start_time = now() - interval '5 minutes',
              end_time = now() + interval '25 minutes'
        from bookings b
       where b.id = $1 and ts.id = b.time_slot_id`,
      [bookingId],
    );

    await client.query(
      `update bookings
          set scheduled_start = now() - interval '5 minutes',
              scheduled_end = now() + interval '25 minutes'
        where id = $1`,
      [bookingId],
    );
  } finally {
    await client.end();
  }
}

async function main() {
  console.log(`Smoke test REHAT → ${baseUrl}\n`);

  const patientCredentials = await step("siapkan akun pasien smoke", () =>
    ensureSmokePatient(),
  );

  const patient = new ApiSession();
  const admin = new ApiSession();

  await step("login pasien", async () => {
    const result = await patient.request("/api/v1/auth/login", {
      method: "POST",
      body: patientCredentials,
    });
    expectStatus(result, 200, "login pasien");
  });

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  assert(adminEmail && adminPassword, "SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD belum diisi.");

  await step("login admin", async () => {
    const result = await admin.request("/api/v1/auth/login", {
      method: "POST",
      body: { email: adminEmail, password: adminPassword },
    });
    expectStatus(result, 200, "login admin");
  });

  const service = await step("pilih layanan Zoom", async () => {
    const result = await patient.request<
      Array<{ id: string; name: string; methods: string[]; durationMinutes: number }>
    >("/api/v1/services");
    expectStatus(result, 200, "daftar layanan");

    const found = result.body?.data.find((item) => item.methods.includes("zoom"));
    assert(found, "Tidak ada layanan dengan metode Zoom.");
    return found;
  });

  const counselor = await step("pilih konselor", async () => {
    const result = await admin.request<
      Array<{ id: string; fullName: string; services: Array<{ id: string }> }>
    >("/api/v1/admin/counselors");
    expectStatus(result, 200, "daftar konselor admin");

    const found = result.body?.data.find((item) =>
      item.services.some((linked) => linked.id === service.id),
    );
    assert(found, "Tidak ada konselor yang terhubung dengan layanan terpilih.");
    return found;
  });

  const slot = await step("buat slot jadwal", async () => {
    const start = findFreeSlotStart();
    let lastStatus = 0;
    let lastMessage = "";

    for (let attempt = 0; attempt < 16; attempt += 1) {
      const startTime = new Date(start.getTime() + attempt * 30 * 60_000);
      const result = await admin.request<{ id: string }>("/api/v1/admin/time-slots", {
        method: "POST",
        body: {
          counselorId: counselor.id,
          serviceId: service.id,
          startTime: startTime.toISOString(),
        },
      });

      if (result.status === 201) return result.body!.data;
      lastStatus = result.status;
      lastMessage = result.body?.message ?? result.text.slice(0, 200);
    }

    throw new Error(`Gagal membuat slot (${lastStatus}): ${lastMessage}`);
  });

  const booking = await step("buat booking", async () => {
    const result = await patient.request<{ id: string; bookingCode: string; status: string }>(
      "/api/v1/bookings",
      {
        method: "POST",
        headers: { "Idempotency-Key": randomUUID() },
        body: {
          timeSlotId: slot.id,
          serviceId: service.id,
          method: "zoom",
        },
      },
    );
    expectStatus(result, 201, "buat booking");
    return result.body!.data;
  });

  const payment = await step("buat transaksi Snap", async () => {
    const result = await patient.request<{
      midtransOrderId: string;
      snapToken: string;
      grossAmount: number;
    }>(`/api/v1/bookings/${booking.id}/payments`, { method: "POST" });

    expectStatus(result, 201, "buat pembayaran");
    assert(result.body?.data.snapToken, "snapToken tidak diterima.");
    return result.body.data;
  });

  await step("kirim webhook sukses", async () => {
    const grossAmount = payment.grossAmount.toFixed(2);
    const statusCode = "200";
    const payload = {
      order_id: payment.midtransOrderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: midtransSignature(
        payment.midtransOrderId,
        statusCode,
        grossAmount,
      ),
      transaction_status: "settlement",
      transaction_id: `smoke-${Date.now()}`,
      payment_type: "bank_transfer",
      transaction_time: midtransTime(new Date()),
    };

    const result = await patient.request("/api/v1/webhooks/midtrans", {
      method: "POST",
      body: payload,
    });
    expectStatus(result, 200, "webhook");
  });

  await step("verifikasi booking confirmed", async () => {
    const result = await patient.request<{ status: string; session: { id: string } | null }>(
      `/api/v1/bookings/${booking.id}`,
    );
    expectStatus(result, 200, "detail booking");
    assert(result.body?.data.status === "confirmed", "Status booking bukan confirmed.");
    assert(result.body.data.session, "Sesi konseling belum dibuat.");
    return result.body.data;
  });

  const session = await step("ambil sesi", async () => {
    const result = await patient.request<{
      items: Array<{ id: string; booking: { id: string } }>;
    }>("/api/v1/sessions?limit=50");
    expectStatus(result, 200, "daftar sesi");

    const found = result.body?.data.items.find((item) => item.booking.id === booking.id);
    assert(found, "Sesi untuk booking tidak ditemukan.");
    return found;
  });

  await step("aktifkan sesi untuk uji chat", async () => {
    await activateSessionForTest(booking.id);

    const result = await patient.request<{ status: string }>(
      `/api/v1/sessions/${session.id}`,
    );
    expectStatus(result, 200, "detail sesi");
    assert(result.body?.data.status === "active", "Status sesi bukan active.");
  });

  await step("kirim pesan (idempoten)", async () => {
    const clientMessageId = randomUUID();
    const body = { content: "Halo, ini pesan smoke test.", clientMessageId };

    const first = await patient.request<{ id: string }>(
      `/api/v1/sessions/${session.id}/messages`,
      { method: "POST", body },
    );
    expectStatus(first, 201, "kirim pesan");

    const second = await patient.request<{ id: string }>(
      `/api/v1/sessions/${session.id}/messages`,
      { method: "POST", body },
    );
    expectStatus(second, 200, "kirim pesan duplikat");
    assert(
      first.body?.data.id === second.body?.data.id,
      "Pesan duplikat menghasilkan id berbeda.",
    );
  });

  await step("retry Zoom (admin)", async () => {
    const result = await admin.request(`/api/v1/admin/zoom/${session.id}/retry`, {
      method: "POST",
    });
    expectStatus(result, 200, "retry Zoom");
  });

  await step("statistik admin", async () => {
    const result = await admin.request<{ bookings: { total: number } }>(
      "/api/v1/admin/stats",
    );
    expectStatus(result, 200, "stats admin");
    assert(
      (result.body?.data.bookings.total ?? 0) >= 1,
      "Statistik booking tidak masuk akal.",
    );
  });

  console.log(steps.join("\n"));
  console.log("\nSmoke test lulus.");
}

main().catch((error) => {
  console.error(steps.join("\n"));
  console.error(
    `\nSmoke test gagal: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
});
