import { config } from "dotenv";

// Muat konfigurasi lokal bila ada, lalu paksa nilai uji yang deterministik.
config({ path: ".env.test", quiet: true });
config({ path: ".env", quiet: true });

/**
 * Nilai environment khusus test.
 *
 * Tujuannya agar unit/API test tidak pernah memanggil layanan eksternal
 * sungguhan dan `serverEnv()` selalu lolos validasi.
 */
const TEST_ENV: Record<string, string> = {
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  BOOKING_PAYMENT_TTL_MINUTES: "60",
  NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  MIDTRANS_SERVER_KEY: "test-midtrans-server-key",
  NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: "test-midtrans-client-key",
  MIDTRANS_IS_PRODUCTION: "false",
  ZOOM_ACCOUNT_ID: "test-zoom-account",
  ZOOM_CLIENT_ID: "test-zoom-client",
  ZOOM_CLIENT_SECRET: "test-zoom-secret",
  RESEND_API_KEY: "re_test",
  RESEND_FROM_EMAIL: "REHAT <no-reply@test.local>",
  R2_ACCOUNT_ID: "test-r2-account",
  R2_ACCESS_KEY_ID: "test-r2-access-key",
  R2_SECRET_ACCESS_KEY: "test-r2-secret-key",
  R2_BUCKET_NAME: "rehat-test",
  R2_ENDPOINT: "https://test-account.r2.cloudflarestorage.com",
  R2_PUBLIC_URL: "https://cdn.test.local",
};

for (const [key, value] of Object.entries(TEST_ENV)) {
  process.env[key] = value;
}

/**
 * Integration test hanya berjalan bila TEST_DATABASE_URL diisi eksplisit.
 * Unit test memakai URL dummy agar tidak mungkin menyentuh database dev.
 */
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://test:test@127.0.0.1:5432/rehat_test";
