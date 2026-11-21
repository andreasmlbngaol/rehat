import type { Metadata } from "next";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Atur ulang password",
  description: "Buat password baru untuk akun REHAT.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
