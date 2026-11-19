import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const POST = apiRoute({ auth: "optional" }, async () => {
  const supabase = await createSupabaseServerClient();
  // Scope lokal: keluar dari browser ini saja tanpa mencabut sesi di perangkat
  // lain milik pengguna yang sama.
  await supabase.auth.signOut({ scope: "local" });

  return ok(null, "Logout berhasil.");
});
