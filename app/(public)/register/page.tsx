import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Buat akun REHAT dan mulai konseling daring.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
