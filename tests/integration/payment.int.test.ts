import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

const { createSnapTransactionMock } = vi.hoisted(() => ({
  createSnapTransactionMock: vi.fn(),
}));

vi.mock("@/lib/integrations/midtrans", () => ({
  createSnapTransaction: createSnapTransactionMock,
}));

import {
  createOrResumePayment,
  listPaymentsForBooking,
  listPaymentsForPatient,
} from "@/lib/services/payment.service";
import {
  ensureTestSchema,
  hasTestDatabase,
  resetDatabase,
} from "../helpers/db";
import {
  createBookingScenario,
  createPayment,
  createProfile,
  uid,
} from "../helpers/factories";

const suite = hasTestDatabase() ? describe : describe.skip;

async function expectAppError(
  promise: Promise<unknown>,
  code: string,
): Promise<AppError> {
  try {
    await promise;
    throw new Error(`Expected AppError ${code}`);
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe(code);
    return error as AppError;
  }
}

suite("payment.service (integration)", () => {
  beforeAll(async () => {
    await ensureTestSchema();
  });

  beforeEach(async () => {
    await resetDatabase();
    createSnapTransactionMock.mockReset();
    createSnapTransactionMock.mockResolvedValue({
      token: "snap-token-1",
      redirect_url: "https://snap.test/1",
    });
  });

  describe("createOrResumePayment", () => {
    it("membuat percobaan pembayaran pertama", async () => {
      const scenario = await createBookingScenario();

      const result = await createOrResumePayment({
        bookingId: scenario.booking.id,
        patientId: scenario.patient.id,
      });

      expect(result).toMatchObject({
        midtransOrderId: `${scenario.booking.bookingCode}-1`,
        snapToken: "snap-token-1",
        redirectUrl: "https://snap.test/1",
        grossAmount: 150000,
      });
      expect(result.expiresAt).toBe(
        scenario.booking.paymentExpiresAt!.toISOString(),
      );

      expect(createSnapTransactionMock).toHaveBeenCalledOnce();
      expect(createSnapTransactionMock.mock.calls[0]![0]).toMatchObject({
        orderId: `${scenario.booking.bookingCode}-1`,
        grossAmount: 150000,
        customer: {
          firstName: scenario.patient.fullName,
          email: scenario.patient.email,
        },
        itemName: "Layanan Uji",
      });

      const payment = await prisma.payment.findUniqueOrThrow({
        where: { id: result.paymentId },
      });
      expect(payment.status).toBe("pending");
      expect(payment.snapToken).toBe("snap-token-1");
    });

    it("mengembalikan percobaan aktif tanpa memanggil Midtrans lagi", async () => {
      const scenario = await createBookingScenario();

      const first = await createOrResumePayment({
        bookingId: scenario.booking.id,
        patientId: scenario.patient.id,
      });
      const second = await createOrResumePayment({
        bookingId: scenario.booking.id,
        patientId: scenario.patient.id,
      });

      expect(second.paymentId).toBe(first.paymentId);
      expect(second.midtransOrderId).toBe(first.midtransOrderId);
      expect(createSnapTransactionMock).toHaveBeenCalledOnce();
    });

    it("membuat percobaan baru setelah percobaan lama kedaluwarsa", async () => {
      const scenario = await createBookingScenario();
      const oldPayment = await createPayment({
        bookingId: scenario.booking.id,
        status: "pending",
        snapToken: "snap-lama",
        expiresAt: new Date(Date.now() - 60_000),
      });

      const result = await createOrResumePayment({
        bookingId: scenario.booking.id,
        patientId: scenario.patient.id,
      });

      expect(result.midtransOrderId).toBe(
        `${scenario.booking.bookingCode}-2`,
      );

      const old = await prisma.payment.findUniqueOrThrow({
        where: { id: oldPayment.id },
      });
      expect(old.status).toBe("expired");
    });

    it("menolak booking yang sudah dibayar", async () => {
      const scenario = await createBookingScenario({ status: "confirmed" });

      await expectAppError(
        createOrResumePayment({
          bookingId: scenario.booking.id,
          patientId: scenario.patient.id,
        }),
        "PAYMENT_ALREADY_SUCCESS",
      );
    });

    it("menolak booking yang sudah dibatalkan", async () => {
      const scenario = await createBookingScenario({ status: "cancelled" });

      await expectAppError(
        createOrResumePayment({
          bookingId: scenario.booking.id,
          patientId: scenario.patient.id,
        }),
        "BOOKING_NOT_PAYABLE",
      );
    });

    it("mengakhiri booking yang batas bayarnya lewat", async () => {
      const scenario = await createBookingScenario();

      await prisma.booking.update({
        where: { id: scenario.booking.id },
        data: { paymentExpiresAt: new Date(Date.now() - 60_000) },
      });

      await expectAppError(
        createOrResumePayment({
          bookingId: scenario.booking.id,
          patientId: scenario.patient.id,
        }),
        "BOOKING_NOT_PAYABLE",
      );

      const booking = await prisma.booking.findUniqueOrThrow({
        where: { id: scenario.booking.id },
      });
      const slot = await prisma.timeSlot.findUniqueOrThrow({
        where: { id: scenario.slot.id },
      });

      expect(booking.status).toBe("expired");
      expect(slot.status).toBe("available");
      expect(createSnapTransactionMock).not.toHaveBeenCalled();
    });

    it("menolak booking milik pasien lain", async () => {
      const scenario = await createBookingScenario();
      const stranger = await createProfile({ role: "patient" });

      await expectAppError(
        createOrResumePayment({
          bookingId: scenario.booking.id,
          patientId: stranger.id,
        }),
        "NOT_FOUND",
      );
    });

    it("menolak booking yang tidak ada", async () => {
      await expectAppError(
        createOrResumePayment({ bookingId: uid(), patientId: uid() }),
        "NOT_FOUND",
      );
    });
  });

  describe("listPaymentsForBooking", () => {
    it("mengembalikan pembayaran milik pasien", async () => {
      const scenario = await createBookingScenario();
      await createPayment({ bookingId: scenario.booking.id });
      await createPayment({ bookingId: scenario.booking.id });

      const payments = await listPaymentsForBooking({
        bookingId: scenario.booking.id,
        patientId: scenario.patient.id,
      });

      expect(payments).toHaveLength(2);
    });

    it("menolak pasien lain", async () => {
      const scenario = await createBookingScenario();
      const stranger = await createProfile({ role: "patient" });

      await expectAppError(
        listPaymentsForBooking({
          bookingId: scenario.booking.id,
          patientId: stranger.id,
        }),
        "NOT_FOUND",
      );
    });
  });

  describe("listPaymentsForPatient", () => {
    it("memfilter dan memaginasi pembayaran pasien", async () => {
      const first = await createBookingScenario();
      const second = await createBookingScenario();
      const stranger = await createBookingScenario();

      await createPayment({ bookingId: first.booking.id });
      await createPayment({ bookingId: first.booking.id });
      await createPayment({ bookingId: second.booking.id });
      await createPayment({ bookingId: stranger.booking.id });

      const page = await listPaymentsForPatient({
        patientId: first.patient.id,
        page: 1,
        limit: 1,
      });

      expect(page.total).toBe(2);
      expect(page.items).toHaveLength(1);
      expect(page.items[0]!.booking.id).toBe(first.booking.id);

      const all = await listPaymentsForPatient({
        patientId: first.patient.id,
        page: 1,
        limit: 20,
      });

      expect(all.total).toBe(2);
      expect(
        all.items.every((payment) => payment.booking.id === first.booking.id),
      ).toBe(true);
    });
  });
});
