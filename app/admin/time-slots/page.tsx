import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { TimeSlotManager } from "@/components/schedule/time-slot-manager";

export const metadata: Metadata = {
  title: "Slot jadwal",
  description: "Kelola slot jadwal seluruh konselor.",
};

export const instant = false;

export default function AdminTimeSlotsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Ruang Admin"
        title="Jadwal"
        description="Kelola kebutuhanmu dengan lebih mudah di sini."
      />
      <TimeSlotManager mode="admin" />
    </div>
  );
}
