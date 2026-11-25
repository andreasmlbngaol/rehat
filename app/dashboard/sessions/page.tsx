import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { SessionsList } from "@/components/session/sessions-list";

export const metadata: Metadata = {
  title: "Sesi",
  description: "Daftar sesi konseling yang terjadwal dan berlangsung.",
};

export const instant = false;

export default function SessionsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Ruang untuk dirimu"
        title="Sesi Saya"
        description="Kelola kebutuhanmu dengan lebih mudah di sini."
      />
      <SessionsList role="patient" />
    </div>
  );
}
