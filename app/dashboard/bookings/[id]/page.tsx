import type { Metadata } from "next";
import { BookingDetail } from "./booking-detail";

export const metadata: Metadata = {
  title: "Detail pemesanan",
};

export const instant = false;

export default function BookingDetailPage() {
  return <BookingDetail />;
}
