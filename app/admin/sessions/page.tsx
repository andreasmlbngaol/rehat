import type { Metadata } from "next";
import { SessionsTable } from "./sessions-table";

export const metadata: Metadata = {
  title: "Sesi",
  description: "Pantau sesi konseling dan integrasi Zoom.",
};

export const instant = false;

export default function AdminSessionsPage() {
  return <SessionsTable />;
}
