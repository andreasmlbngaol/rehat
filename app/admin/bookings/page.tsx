import type { Metadata } from "next";
import { BookingsTable } from "./bookings-table";

export const metadata: Metadata = {
  title: "Pemesanan",
  description: "Pantau seluruh pemesanan sesi konseling.",
};

export const instant = false;

export default function AdminBookingsPage() {
  return <BookingsTable />;
}
