import { describe, expect, it } from "vitest";

/**
 * Verifikasi RLS Supabase lewat PostgREST.
 *
 * Tes ini opt-in karena membutuhkan project Supabase sungguhan. Aktifkan dengan:
 *   RLS_SUPABASE_URL=https://xxx.supabase.co \
 *   RLS_SUPABASE_ANON_KEY=... \
 *   bunx vitest run tests/integration/rls.test.ts
 *
 * Semua tabel memakai RLS tanpa policy, sehingga kunci anon tidak boleh
 * melihat satu baris pun. Kalau RLS mati, tes ini akan gagal.
 */
const url = process.env.RLS_SUPABASE_URL;
const anonKey = process.env.RLS_SUPABASE_ANON_KEY;

const TABLES = [
  "profiles",
  "counselor_profiles",
  "services",
  "service_methods",
  "counselor_services",
  "time_slots",
  "bookings",
  "payments",
  "payment_webhook_events",
  "counseling_sessions",
  "chat_messages",
  "zoom_meetings",
];

const describeRls = url && anonKey ? describe : describe.skip;

describeRls("RLS Supabase", () => {
  for (const table of TABLES) {
    it(`menolak akses anonim ke ${table}`, async () => {
      const response = await fetch(
        `${url}/rest/v1/${table}?select=*&limit=1`,
        {
          headers: {
            apikey: anonKey!,
            Authorization: `Bearer ${anonKey}`,
          },
        },
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual([]);
    });
  }
});
