import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { ProfileForm } from "@/components/profile/profile-form";

export const metadata: Metadata = {
  title: "Profil",
  description: "Kelola data profil dan foto akun REHAT.",
};

export const instant = false;

export default function ProfilePage() {
  return (
    <div className="space-y-[38px]">
      <PageHeader
        eyebrow="Ruang untuk dirimu"
        title="Profil"
        description="Kelola kebutuhanmu dengan lebih mudah di sini."
      />
      <ProfileForm />
    </div>
  );
}
