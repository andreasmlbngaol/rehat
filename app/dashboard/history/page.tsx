import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { SessionsList } from "@/components/session/sessions-list";

export const metadata: Metadata = {
  title: "Riwayat",
  description: "Riwayat sesi konseling yang telah selesai.",
};

export const instant = false;

export default function PatientHistoryPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Ruang untuk dirimu"
        title="Riwayat"
        description="Kelola kebutuhanmu dengan lebih mudah di sini."
      />
      <SessionsList role="patient" history />
    </div>
  );
}
