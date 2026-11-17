import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";

let adminClient: SupabaseClient | null = null;

/**
 * Client dengan service role. Hanya untuk operasi administratif
 * (membuat akun konselor, menghapus user, membaca data auth).
 * Jangan pernah diimpor dari kode client.
 */
export function createSupabaseAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;

  const env = serverEnv();
  adminClient = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );

  return adminClient;
}
