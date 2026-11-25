import type { Metadata } from "next";
import { SessionRoom } from "@/components/session/session-room";

export const metadata: Metadata = {
  title: "Ruang sesi",
};

export const instant = false;

export default function SessionRoomPage() {
  return <SessionRoom role="patient" />;
}
