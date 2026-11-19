import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseBody, readJson } from "@/lib/api/validation";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { errors } from "@/lib/api/errors";

export const POST = apiRoute({ auth: "required" }, async ({ request }) => {
  const input = parseBody(resetPasswordSchema, await readJson(request));
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw errors.unauthenticated("Sesi pemulihan tidak valid atau sudah berakhir.");
  }

  const { error } = await supabase.auth.updateUser({ password: input.password });

  if (error) {
    throw errors.validation(
      { password: ["Password tidak dapat diperbarui. Minta tautan pemulihan baru."] },
      "Password tidak dapat diperbarui.",
    );
  }

  return ok(null, "Password berhasil diperbarui. Silakan login kembali.");
});
