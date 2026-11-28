import { createHmac, timingSafeEqual } from "node:crypto";
import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { errors } from "@/lib/api/errors";
import { serverEnv } from "@/lib/env";
import { sendEmail } from "@/lib/integrations/resend";

type HookPayload = {
  user?: {
    email?: string;
    user_metadata?: { full_name?: string };
  };
  email_data?: {
    token?: string;
    token_hash?: string;
    redirect_to?: string;
    email_action_type?: string;
    site_url?: string;
  };
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Verifikasi signature Standard Webhooks yang dipakai Supabase Auth Hooks.
 * Format secret: `v1,whsec_<base64>`.
 */
function verifyStandardWebhook(
  rawBody: string,
  headers: Headers,
  secret: string,
): boolean {
  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatureHeader = headers.get("webhook-signature");

  if (!id || !timestamp || !signatureHeader) return false;

  const now = Math.floor(Date.now() / 1000);
  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt) || Math.abs(now - sentAt) > 300) return false;

  const withoutVersion = secret.startsWith("v1,") ? secret.slice(3) : secret;
  const base64Key = withoutVersion.startsWith("whsec_")
    ? withoutVersion.slice(6)
    : withoutVersion;

  const key = Buffer.from(base64Key, "base64");
  const expected = Buffer.from(
    createHmac("sha256", key)
      .update(`${id}.${timestamp}.${rawBody}`)
      .digest("base64"),
  );

  return signatureHeader.split(" ").some((part) => {
    const comma = part.indexOf(",");
    if (comma === -1) return false;

    const version = part.slice(0, comma);
    const signature = Buffer.from(part.slice(comma + 1));

    return (
      version === "v1" &&
      signature.length === expected.length &&
      timingSafeEqual(signature, expected)
    );
  });
}

function buildEmail(action: string, link: string, name: string) {
  const safeName = escapeHtml(name);
  const safeLink = escapeHtml(link);

  const templates: Record<string, { subject: string; intro: string; cta: string }> = {
    signup: {
      subject: "Verifikasi Email REHAT",
      intro:
        "Terima kasih telah mendaftar di REHAT. Klik tombol di bawah untuk memverifikasi alamat email Anda.",
      cta: "Verifikasi Email",
    },
    recovery: {
      subject: "Atur Ulang Password REHAT",
      intro:
        "Kami menerima permintaan untuk mengatur ulang password akun REHAT Anda. Klik tombol di bawah untuk membuat password baru.",
      cta: "Atur Ulang Password",
    },
    invite: {
      subject: "Aktivasi Akun Konselor REHAT",
      intro:
        "Akun Konselor REHAT Anda telah dibuat oleh administrator. Klik tombol di bawah untuk mengaktifkan akun dan membuat password.",
      cta: "Aktivasi Akun",
    },
    email_change: {
      subject: "Konfirmasi Perubahan Email REHAT",
      intro:
        "Kami menerima permintaan perubahan alamat email pada akun REHAT Anda. Klik tombol di bawah untuk mengonfirmasi.",
      cta: "Konfirmasi Perubahan Email",
    },
    magiclink: {
      subject: "Tautan Masuk REHAT",
      intro:
        "Klik tombol di bawah untuk masuk ke akun REHAT Anda. Tautan ini hanya berlaku untuk waktu terbatas.",
      cta: "Masuk ke REHAT",
    },
  };

  const template = templates[action] ?? templates.signup;

  const html = `<!doctype html>
<html lang="id">
  <body style="margin:0;padding:0;background:#f5f7f6;">
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1f2937;">
      <p style="font-size:20px;font-weight:700;letter-spacing:0.08em;color:#2f6f5e;margin:0 0 24px;">REHAT</p>
      <div style="background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
        <p style="margin:0 0 12px;">Halo ${safeName},</p>
        <p style="margin:0 0 24px;line-height:1.6;">${template.intro}</p>
        <p style="margin:0 0 24px;">
          <a href="${safeLink}" style="display:inline-block;background:#2f6f5e;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">${template.cta}</a>
        </p>
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Jika tombol tidak berfungsi, salin tautan berikut:</p>
        <p style="margin:0 0 24px;font-size:13px;word-break:break-all;color:#2f6f5e;">${safeLink}</p>
        <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">Abaikan email ini jika Anda tidak merasa melakukan permintaan tersebut.</p>
      </div>
      <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;text-align:center;">REHAT - layanan pendukung konseling, bukan layanan darurat.</p>
    </div>
  </body>
</html>`;

  const text = `Halo ${name},\n\n${template.intro}\n\n${template.cta}: ${link}\n\nAbaikan email ini jika Anda tidak merasa melakukan permintaan tersebut.\n\n- Tim REHAT`;

  return { subject: template.subject, html, text };
}

export const POST = apiRoute({ auth: "none" }, async ({ request }) => {
  const secret = serverEnv().SUPABASE_SEND_EMAIL_HOOK_SECRET;
  if (!secret) {
    throw errors.external("Hook email belum dikonfigurasi pada server.");
  }

  const rawBody = await request.text();

  if (!verifyStandardWebhook(rawBody, request.headers, secret)) {
    throw errors.unauthenticated("Signature hook email tidak valid.");
  }

  let payload: HookPayload;
  try {
    payload = JSON.parse(rawBody) as HookPayload;
  } catch {
    throw errors.validation({ _: ["Payload hook bukan JSON yang valid."] });
  }

  const email = payload.user?.email;
  const data = payload.email_data;

  if (!email || !data?.token_hash || !data.email_action_type) {
    throw errors.validation({ _: ["Payload hook tidak lengkap."] });
  }

  const link = new URL("/auth/confirm", serverEnv().NEXT_PUBLIC_SITE_URL);
  link.searchParams.set("token_hash", data.token_hash);
  link.searchParams.set("type", data.email_action_type);
  link.searchParams.set(
    "next",
    data.email_action_type === "recovery"
      ? "/reset-password"
      : data.email_action_type === "invite"
        ? "/counselor"
        : "/dashboard",
  );

  const name = payload.user?.user_metadata?.full_name ?? email.split("@")[0]!;
  const template = buildEmail(data.email_action_type, link.toString(), name);

  await sendEmail({ to: email, ...template });

  return ok({ received: true });
});
