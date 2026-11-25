import { after } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { errors } from "@/lib/api/errors";
import {
  processMidtransNotification,
  type MidtransNotification,
} from "@/lib/services/webhook.service";
import { ensureZoomMeeting } from "@/lib/services/zoom.service";

export const POST = apiRoute({ auth: "none" }, async ({ request }) => {
  const rawBody = await request.text();

  let notification: MidtransNotification;

  try {
    notification = JSON.parse(rawBody) as MidtransNotification;
  } catch {
    throw errors.validation({ _: ["Payload notifikasi bukan JSON yang valid."] });
  }

  if (
    !notification.order_id ||
    !notification.transaction_status ||
    !notification.status_code ||
    !notification.gross_amount
  ) {
    throw errors.validation({ _: ["Payload notifikasi tidak lengkap."] });
  }

  const result = await processMidtransNotification(rawBody, notification);

  if (result.zoomSessionId) {
    const sessionId = result.zoomSessionId;

    after(async () => {
      try {
        await ensureZoomMeeting(sessionId);
      } catch (error) {
        console.error("[zoom] gagal membuat meeting:", error);
      }
    });
  }

  return ok({ received: true }, "Notifikasi pembayaran diterima.");
});
