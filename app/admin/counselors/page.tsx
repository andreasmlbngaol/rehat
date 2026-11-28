import type { Metadata } from "next";
import { CounselorsManager } from "./counselors-manager";

export const metadata: Metadata = {
  title: "Konselor",
  description: "Kelola akun dan profil konselor REHAT.",
};

export const instant = false;

export default function AdminCounselorsPage() {
  return <CounselorsManager />;
}
