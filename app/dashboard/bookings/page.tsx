import type { Metadata } from "next";
import { BookingsList } from "./bookings-list";

export const metadata: Metadata = {
  title: "Pemesanan",
  description: "Riwayat dan status pemesanan sesi konselingmu.",
};

export const instant = false;

export default function BookingsPage() {
  return <BookingsList />;
}
