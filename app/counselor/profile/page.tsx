import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { ProfileForm } from "@/components/profile/profile-form";

export const metadata: Metadata = {
  title: "Profil konselor",
  description: "Kelola profil profesional dan foto konselor.",
};

export const instant = false;

export default function CounselorProfilePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Ruang kerja REHAT"
        title="Profil Profesional"
        description="Kelola kebutuhanmu dengan lebih mudah di sini."
      />
      <ProfileForm />
    </div>
  );
}
