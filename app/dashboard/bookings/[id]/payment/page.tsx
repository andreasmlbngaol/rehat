import type { Metadata } from "next";
import { serverEnv } from "@/lib/env";
import { PaymentPanel } from "./payment-panel";

export const metadata: Metadata = {
  title: "Pembayaran",
};

export const instant = false;

export default function PaymentPage() {
  const snapScriptUrl = serverEnv().MIDTRANS_IS_PRODUCTION
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  return <PaymentPanel snapScriptUrl={snapScriptUrl} />;
}
