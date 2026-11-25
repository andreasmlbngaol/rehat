import "server-only";
import midtransClient from "midtrans-client";
import { serverEnv } from "@/lib/env";

export type SnapTransactionResult = {
  token: string;
  redirect_url: string;
};

type SnapParameter = midtransClient.SnapTransactionParameters & {
  item_details?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
  customer_details?: {
    first_name: string;
    email: string;
  };
  expiry?: {
    start_time: string;
    unit: "minutes" | "hours" | "days";
    duration: number;
  };
};

let snap: midtransClient.Snap | null = null;

function getSnap(): midtransClient.Snap {
  if (!snap) {
    const env = serverEnv();
    snap = new midtransClient.Snap({
      isProduction: env.MIDTRANS_IS_PRODUCTION,
      serverKey: env.MIDTRANS_SERVER_KEY,
      clientKey: env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
    });
  }
  return snap;
}

function formatMidtransDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${value("year")}-${value("month")}-${value("day")} ${value("hour")}:${value("minute")}:${value("second")} +0700`;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("MIDTRANS_TIMEOUT"));
    }, ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export type MidtransTransactionStatus = {
  status_code: string;
  transaction_status: string;
  fraud_status?: string;
  gross_amount: string;
  payment_type?: string;
  transaction_id?: string;
  transaction_time?: string;
  expiry_time?: string;
  status_message?: string;
};

/**
 * Mengambil status transaksi langsung dari Midtrans.
 *
 * Dipakai sebagai verifikasi cadangan saat signature notifikasi tidak cocok
 * (misalnya server key sudah dirotasi). Respons API ini otentik karena
 * diambil server-ke-server dengan Basic Auth memakai server key.
 */
export async function getMidtransTransactionStatus(
  orderId: string,
): Promise<MidtransTransactionStatus | null> {
  const env = serverEnv();
  const base = env.MIDTRANS_IS_PRODUCTION
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com";
  const auth = Buffer.from(`${env.MIDTRANS_SERVER_KEY}:`).toString("base64");

  try {
    const response = await withTimeout(
      fetch(`${base}/v2/${encodeURIComponent(orderId)}/status`, {
        headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
        cache: "no-store",
      }),
      10_000,
    );

    if (!response.ok) return null;

    const body = (await response.json()) as MidtransTransactionStatus;

    if (!body || body.status_code === "404") return null;

    return body;
  } catch {
    return null;
  }
}

export async function createSnapTransaction(input: {
  orderId: string;
  grossAmount: number;
  customer: { firstName: string; email: string };
  itemName: string;
  expiresAt: Date;
}): Promise<SnapTransactionResult> {
  const durationMinutes = Math.max(
    1,
    Math.round((input.expiresAt.getTime() - Date.now()) / 60_000),
  );

  const parameter: SnapParameter = {
    transaction_details: {
      order_id: input.orderId,
      gross_amount: input.grossAmount,
    },
    item_details: [
      {
        id: "konseling",
        price: input.grossAmount,
        quantity: 1,
        name: input.itemName.slice(0, 50),
      },
    ],
    customer_details: {
      first_name: input.customer.firstName.slice(0, 50),
      email: input.customer.email,
    },
    expiry: {
      start_time: formatMidtransDate(new Date()),
      unit: "minutes",
      duration: durationMinutes,
    },
  };

  const result = await withTimeout(
    getSnap().createTransaction(parameter as midtransClient.SnapTransactionParameters),
    12_000,
  );

  return result;
}
