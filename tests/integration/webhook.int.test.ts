import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  processMidtransNotification,
  type MidtransNotification,
} from "@/lib/services/webhook.service";
import { getMidtransTransactionStatus } from "@/lib/integrations/midtrans";
import {
  ensureTestSchema,
  hasTestDatabase,
  resetDatabase,
} from "../helpers/db";
import {
  createBookingScenario,
  createPayment,
} from "../helpers/factories";

const suite = hasTestDatabase() ? describe : describe.skip;
const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!;

vi.mock("@/lib/integrations/midtrans", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/integrations/midtrans")>();
  return { ...actual, getMidtransTransactionStatus: vi.fn() };
});

function sign(notification: MidtransNotification): string {
  return createHash("sha512")
    .update(
      `${notification.order_id}${notification.status_code}${notification.gross_amount}${SERVER_KEY}`,
    )
    .digest("hex");
}

function notification(
  orderId: string,
  overrides: Partial<MidtransNotification> = {},
): MidtransNotification {
  const base: MidtransNotification = {
    order_id: orderId,
    status_code: "200",
    gross_amount: "150000.00",
    transaction_status: "settlement",
    payment_type: "bank_transfer",
    transaction_id: `trx-${orderId}`,
    transaction_time: "2026-01-10 10:00:00",
  };

  const merged = { ...base, ...overrides };
  return { ...merged, signature_key: sign(merged) };
}

suite("processMidtransNotification (integration)", () => {
  beforeAll(async () => {
    await ensureTestSchema();
  });

  beforeEach(async () => {
    await resetDatabase();
    vi.mocked(getMidtransTransactionStatus).mockReset();
  });

  async function pendingScenario(options: { method?: "chat" | "zoom" } = {}) {
    const scenario = await createBookingScenario({
      method: options.method ?? "chat",
    });
    const payment = await createPayment({
      bookingId: scenario.booking.id,
      grossAmount: 150000,
      status: "pending",
      snapToken: "snap-token",
    });

    return { ...scenario, payment };
  }

  it("settlement mengonfirmasi booking, slot, dan membuat sesi", async () => {
    const scenario = await pendingScenario();
    const payload = notification(scenario.payment.midtransOrderId);
    const rawBody = JSON.stringify(payload);

    const result = await processMidtransNotification(rawBody, payload);

    expect(result).toEqual({ duplicate: false, zoomSessionId: null });

    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: scenario.booking.id },
    });
    const payment = await prisma.payment.findUniqueOrThrow({
      where: { id: scenario.payment.id },
    });
    const slot = await prisma.timeSlot.findUniqueOrThrow({
      where: { id: scenario.slot.id },
    });
    const session = await prisma.counselingSession.findUnique({
      where: { bookingId: scenario.booking.id },
    });
    const event = await prisma.paymentWebhookEvent.findUnique({
      where: {
        eventHash: createHash("sha256").update(rawBody).digest("hex"),
      },
    });

    expect(booking.status).toBe("confirmed");
    expect(payment.status).toBe("success");
    expect(payment.paymentType).toBe("bank_transfer");
    expect(payment.midtransTransactionId).toBe(
      `trx-${scenario.payment.midtransOrderId}`,
    );
    expect(payment.transactionTime).not.toBeNull();
    expect(slot.status).toBe("booked");
    expect(session).not.toBeNull();
    expect(session?.status).toBe("scheduled");
    expect(event?.signatureValid).toBe(true);
    expect(event?.processedAt).not.toBeNull();
  });

  it("mengembalikan zoomSessionId untuk booking Zoom", async () => {
    const scenario = await pendingScenario({ method: "zoom" });
    const payload = notification(scenario.payment.midtransOrderId);

    const result = await processMidtransNotification(
      JSON.stringify(payload),
      payload,
    );

    expect(result.zoomSessionId).toBeTruthy();

    const session = await prisma.counselingSession.findUniqueOrThrow({
      where: { bookingId: scenario.booking.id },
    });
    expect(result.zoomSessionId).toBe(session.id);
  });

  it("mengabaikan webhook duplikat", async () => {
    const scenario = await pendingScenario();
    const payload = notification(scenario.payment.midtransOrderId);
    const rawBody = JSON.stringify(payload);

    const first = await processMidtransNotification(rawBody, payload);
    const second = await processMidtransNotification(rawBody, payload);

    expect(first.duplicate).toBe(false);
    expect(second).toEqual({ duplicate: true, zoomSessionId: null });

    expect(
      await prisma.paymentWebhookEvent.count({
        where: { midtransOrderId: scenario.payment.midtransOrderId },
      }),
    ).toBe(1);
  });

  it("menolak signature tidak valid tanpa mengubah data", async () => {
    const scenario = await pendingScenario();
    const payload = {
      ...notification(scenario.payment.midtransOrderId),
      signature_key: "deadbeef",
    };

    const result = await processMidtransNotification(
      JSON.stringify(payload),
      payload,
    );

    expect(result.duplicate).toBe(false);

    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: scenario.booking.id },
    });
    const payment = await prisma.payment.findUniqueOrThrow({
      where: { id: scenario.payment.id },
    });

    expect(booking.status).toBe("pending_payment");
    expect(payment.status).toBe("pending");
  });

  it("mengabaikan nominal yang tidak cocok", async () => {
    const scenario = await pendingScenario();
    const payload = notification(scenario.payment.midtransOrderId, {
      gross_amount: "1000.00",
    });

    await processMidtransNotification(JSON.stringify(payload), payload);

    const payment = await prisma.payment.findUniqueOrThrow({
      where: { id: scenario.payment.id },
    });
    expect(payment.status).toBe("pending");
  });

  it("expire mengubah payment dan booking menjadi expired serta melepas slot", async () => {
    const scenario = await pendingScenario();
    const payload = notification(scenario.payment.midtransOrderId, {
      transaction_status: "expire",
    });

    await processMidtransNotification(JSON.stringify(payload), payload);

    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: scenario.booking.id },
    });
    const payment = await prisma.payment.findUniqueOrThrow({
      where: { id: scenario.payment.id },
    });
    const slot = await prisma.timeSlot.findUniqueOrThrow({
      where: { id: scenario.slot.id },
    });

    expect(booking.status).toBe("expired");
    expect(payment.status).toBe("expired");
    expect(slot.status).toBe("available");
  });

  it("cancel membatalkan booking dan melepas slot", async () => {
    const scenario = await pendingScenario();
    const payload = notification(scenario.payment.midtransOrderId, {
      transaction_status: "cancel",
    });

    await processMidtransNotification(JSON.stringify(payload), payload);

    expect(
      (
        await prisma.booking.findUniqueOrThrow({
          where: { id: scenario.booking.id },
        })
      ).status,
    ).toBe("cancelled");
    expect(
      (
        await prisma.timeSlot.findUniqueOrThrow({
          where: { id: scenario.slot.id },
        })
      ).status,
    ).toBe("available");
  });

  it("deny menandai payment gagal dan booking expired", async () => {
    const scenario = await pendingScenario();
    const payload = notification(scenario.payment.midtransOrderId, {
      transaction_status: "deny",
    });

    await processMidtransNotification(JSON.stringify(payload), payload);

    expect(
      (
        await prisma.payment.findUniqueOrThrow({
          where: { id: scenario.payment.id },
        })
      ).status,
    ).toBe("failed");
    expect(
      (
        await prisma.booking.findUniqueOrThrow({
          where: { id: scenario.booking.id },
        })
      ).status,
    ).toBe("expired");
  });

  it("capture dengan fraud challenge tetap pending", async () => {
    const scenario = await pendingScenario();
    const payload = notification(scenario.payment.midtransOrderId, {
      transaction_status: "capture",
      fraud_status: "challenge",
    });

    await processMidtransNotification(JSON.stringify(payload), payload);

    const payment = await prisma.payment.findUniqueOrThrow({
      where: { id: scenario.payment.id },
    });
    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: scenario.booking.id },
    });

    expect(payment.status).toBe("pending");
    expect(booking.status).toBe("pending_payment");
  });

  it("pembayaran sukses kedua ditandai failed", async () => {
    const scenario = await pendingScenario();
    const secondPayment = await createPayment({
      bookingId: scenario.booking.id,
      status: "pending",
      snapToken: "snap-token-2",
    });

    const firstPayload = notification(scenario.payment.midtransOrderId);
    await processMidtransNotification(
      JSON.stringify(firstPayload),
      firstPayload,
    );

    const secondPayload = notification(secondPayment.midtransOrderId);
    await processMidtransNotification(
      JSON.stringify(secondPayload),
      secondPayload,
    );

    expect(
      (
        await prisma.payment.findUniqueOrThrow({
          where: { id: secondPayment.id },
        })
      ).status,
    ).toBe("failed");
  });

  it("webhook untuk order yang tidak dikenal tetap tercatat", async () => {
    const payload = notification("ORDER-TIDAK-ADA");

    const result = await processMidtransNotification(
      JSON.stringify(payload),
      payload,
    );

    expect(result).toEqual({ duplicate: false, zoomSessionId: null });
    expect(
      await prisma.paymentWebhookEvent.count({
        where: { midtransOrderId: "ORDER-TIDAK-ADA" },
      }),
    ).toBe(1);
  });

  it("signature tidak cocok diverifikasi ulang lewat Status API", async () => {
    const scenario = await pendingScenario();
    const payload = notification(scenario.payment.midtransOrderId);
    const invalid = { ...payload, signature_key: "0".repeat(128) };

    vi.mocked(getMidtransTransactionStatus).mockResolvedValue({
      status_code: "200",
      transaction_status: "capture",
      fraud_status: "accept",
      gross_amount: "150000.00",
      payment_type: "credit_card",
      transaction_id: "trx-status-api",
      transaction_time: "2026-01-10 10:00:00",
    });

    const result = await processMidtransNotification(
      JSON.stringify(invalid),
      invalid,
    );

    expect(result).toEqual({ duplicate: false, zoomSessionId: null });
    expect(getMidtransTransactionStatus).toHaveBeenCalledWith(
      scenario.payment.midtransOrderId,
    );

    const payment = await prisma.payment.findUniqueOrThrow({
      where: { id: scenario.payment.id },
    });
    expect(payment.status).toBe("success");
    expect(payment.paymentType).toBe("credit_card");

    const event = await prisma.paymentWebhookEvent.findFirstOrThrow({
      where: { midtransOrderId: scenario.payment.midtransOrderId },
    });
    expect(event.signatureValid).toBe(false);
    expect(event.processedAt).not.toBeNull();
  });
});
