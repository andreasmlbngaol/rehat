import type { Metadata } from "next";
import { VerifyEmailForm } from "./verify-email-form";

export const metadata: Metadata = {
  title: "Verifikasi email",
  description: "Kirim ulang tautan verifikasi email REHAT.",
};

export default function VerifyEmailPage() {
  return <VerifyEmailForm />;
}
