import type { Metadata } from "next";
import { ServicesManager } from "./services-manager";

export const metadata: Metadata = {
  title: "Layanan",
  description: "Kelola daftar layanan konseling REHAT.",
};

export const instant = false;

export default function AdminServicesPage() {
  return <ServicesManager />;
}
