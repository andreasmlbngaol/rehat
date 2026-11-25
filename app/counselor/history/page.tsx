import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { SessionsList } from "@/components/session/sessions-list";

export const metadata: Metadata = {
  title: "Riwayat sesi",
  description: "Riwayat sesi yang telah ditangani.",
};

export const instant = false;

export default function CounselorHistoryPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Ruang kerja REHAT"
        title="Riwayat"
        description="Kelola kebutuhanmu dengan lebih mudah di sini."
      />
      <SessionsList role="counselor" history />
    </div>
  );
}
