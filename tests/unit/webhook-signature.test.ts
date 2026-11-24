import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { verifyMidtransSignature } from "@/lib/services/webhook.service";

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!;

function sign(orderId: string, statusCode: string, grossAmount: string): string {
  return createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${SERVER_KEY}`)
    .digest("hex");
}

describe("verifyMidtransSignature", () => {
  const base = {
    order_id: "RHT-260101-ABCD1234-1",
    status_code: "200",
    gross_amount: "150000.00",
    transaction_status: "settlement",
  };

  it("menerima signature yang benar", () => {
    expect(
      verifyMidtransSignature({
        ...base,
        signature_key: sign(base.order_id, base.status_code, base.gross_amount),
      }),
    ).toBe(true);
  });

  it("menolak signature yang salah", () => {
    expect(
      verifyMidtransSignature({ ...base, signature_key: "deadbeef" }),
    ).toBe(false);
  });

  it("menolak signature kosong", () => {
    expect(verifyMidtransSignature(base)).toBe(false);
  });

  it("menolak bila nominal diubah", () => {
    const signature = sign(base.order_id, base.status_code, base.gross_amount);

    expect(
      verifyMidtransSignature({
        ...base,
        gross_amount: "1000.00",
        signature_key: signature,
      }),
    ).toBe(false);
  });

  it("menolak bila order id diubah", () => {
    const signature = sign(base.order_id, base.status_code, base.gross_amount);

    expect(
      verifyMidtransSignature({
        ...base,
        order_id: "ORDER-LAIN",
        signature_key: signature,
      }),
    ).toBe(false);
  });

  it("tidak melempar untuk signature berpanjang berbeda", () => {
    expect(() =>
      verifyMidtransSignature({ ...base, signature_key: "x" }),
    ).not.toThrow();
  });
});
