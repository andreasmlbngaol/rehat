import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { SessionsList } from "@/components/session/sessions-list";

export const metadata: Metadata = {
  title: "Sesi konselor",
  description: "Daftar sesi pasien yang perlu ditangani.",
};

export const instant = false;

export default function CounselorSessionsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Ruang kerja REHAT"
        title="Sesi"
        description="Kelola kebutuhanmu dengan lebih mudah di sini."
      />
      <SessionsList role="counselor" />
    </div>
  );
}
