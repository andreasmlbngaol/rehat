import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { TimeSlotManager } from "@/components/schedule/time-slot-manager";

export const metadata: Metadata = {
  title: "Jadwal konselor",
  description: "Kelola slot jadwal yang dapat dipesan pasien.",
};

export const instant = false;

export default function CounselorSchedulePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Ruang kerja REHAT"
        title="Jadwal"
        description="Kelola kebutuhanmu dengan lebih mudah di sini."
      />
      <TimeSlotManager mode="counselor" />
    </div>
  );
}
