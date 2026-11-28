import type { Metadata } from "next";
import { ReportsView } from "./reports-view";

export const metadata: Metadata = {
  title: "Laporan Operasional",
  description: "Pantau pemesanan, pembayaran, dan sesi.",
};

export const instant = false;

export default function AdminReportsPage() {
  return <ReportsView />;
}
