import "dotenv/config";
import { createHash } from "node:crypto";
import { Client } from "pg";

/**
 * Simulasi notifikasi Midtrans untuk pengujian lokal.
 *
 * Pemakaian:
 *   bun scripts/simulate-midtrans-webhook.ts --status success
 *   bun scripts/simulate-midtrans-webhook.ts --order-id RHT-...-1 --status expire
 *
 * Status: success | pending | expire | cancel | deny
 */

const STATUS_MAP: Record<
  string,
  { transaction_status: string; status_code: string; fraud_status?: string }
> = {
  success: {
    transaction_status: "settlement",
    status_code: "200",
    fraud_status: "accept",
  },
  pending: { transaction_status: "pending", status_code: "201" },
  expire: { transaction_status: "expire", status_code: "407" },
  cancel: { transaction_status: "cancel", status_code: "200" },
  deny: { transaction_status: "deny", status_code: "202" },
};

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

const statusArg = readArg("--status") ?? "success";
const mapped = STATUS_MAP[statusArg];

if (!mapped) {
  console.error(
    `Status tidak dikenal: ${statusArg}. Gunakan salah satu: ${Object.keys(STATUS_MAP).join(", ")}`,
  );
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
const serverKey = process.env.MIDTRANS_SERVER_KEY;
const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

if (!connectionString) throw new Error("DATABASE_URL belum diisi.");
if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY belum diisi.");

const isLocal = /(?:localhost|127\.0\.0\.1)/.test(connectionString);
const client = new Client({
  connectionString,
  ssl: isLocal ? undefined : { rejectUnauthorized: false },
});

await client.connect();

const orderId = readArg("--order-id");

const result = orderId
  ? await client.query(
      "select midtrans_order_id, gross_amount from payments where midtrans_order_id = $1",
      [orderId],
    )
  : await client.query(
      "select midtrans_order_id, gross_amount from payments order by created_at desc limit 1",
    );

await client.end();

const row = result.rows[0] as
  | { midtrans_order_id: string; gross_amount: string }
  | undefined;

if (!row) {
  console.error("Tidak ada transaksi pembayaran di database.");
  process.exit(1);
}

const grossAmount = Number(row.gross_amount).toFixed(2);
const signature = createHash("sha512")
  .update(
    `${row.midtrans_order_id}${mapped.status_code}${grossAmount}${serverKey}`,
  )
  .digest("hex");

const wib = new Date(Date.now() + 7 * 60 * 60 * 1000);
const transactionTime = wib.toISOString().slice(0, 19).replace("T", " ");

const payload = {
  order_id: row.midtrans_order_id,
  status_code: mapped.status_code,
  gross_amount: grossAmount,
  signature_key: signature,
  transaction_status: mapped.transaction_status,
  fraud_status: mapped.fraud_status,
  payment_type: "bank_transfer",
  transaction_id: `sim-${Date.now()}`,
  transaction_time: transactionTime,
};

console.log("→ Mengirim notifikasi", mapped.transaction_status, row.midtrans_order_id);

const response = await fetch(`${baseUrl}/api/v1/webhooks/midtrans`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

console.log(`HTTP ${response.status}`);
console.log(await response.text());
