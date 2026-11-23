import { Suspense } from "react";
import type { Metadata } from "next";
import { BookingWizard } from "./booking-wizard";

export const metadata: Metadata = {
  title: "Pesan sesi",
  description: "Pilih layanan, konselor, dan jadwal konseling.",
};

export const instant = false;

export default function NewBookingPage() {
  return (
    <Suspense fallback={null}>
      <BookingWizard />
    </Suspense>
  );
}
