import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { serverEnv } from "@/lib/env";

/**
 * Supabase client untuk Route Handler / Server Component.
 * Cookie dibaca dari request; penulisan cookie hanya berhasil di Route
 * Handler atau Proxy (di Server Component akan dilewati).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const env = serverEnv();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Dipanggil dari konteks yang tidak boleh menulis cookie.
          }
        },
      },
    },
  );
}
