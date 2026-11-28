import type { Metadata } from "next";
import { PaymentsTable } from "./payments-table";

export const metadata: Metadata = {
  title: "Pembayaran",
  description: "Pantau seluruh transaksi pembayaran Midtrans.",
};

export const instant = false;

export default function AdminPaymentsPage() {
  return <PaymentsTable />;
}
