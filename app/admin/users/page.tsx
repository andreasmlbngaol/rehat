import type { Metadata } from "next";
import { UsersTable } from "./users-table";

export const metadata: Metadata = {
  title: "Pengguna",
  description: "Kelola akun pasien dan konselor REHAT.",
};

export const instant = false;

export default function AdminUsersPage() {
  return <UsersTable />;
}
