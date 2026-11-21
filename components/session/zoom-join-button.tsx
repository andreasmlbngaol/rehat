"use client";

import { useEffect, useRef, useState } from "react";
import { VideoCamera } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import type { ZoomMeeting } from "@/lib/types/api";

export function formatJoinCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours} jam ${minutes} menit`;
  if (minutes > 0) return `${minutes} menit ${seconds} detik`;
  return `${seconds} detik`;
}

export function ZoomJoinButton({
  zoom,
  href,
  label,
  size = "default",
  variant = "default",
  onOpened,
}: {
  zoom: ZoomMeeting | null;
  href: string | null | undefined;
  label: string;
  size?: "default" | "sm";
  variant?: "default" | "outline";
  onOpened?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const requested = useRef(false);

  const opensAt = zoom?.opensAt ? Date.parse(zoom.opensAt) : null;
  const closesAt = zoom?.closesAt ? Date.parse(zoom.closesAt) : null;
  const joinable = Boolean(zoom?.joinable);
  const windowOpen = joinable || (opensAt !== null && now >= opensAt);
  const windowClosed = closesAt !== null && now >= closesAt;

  useEffect(() => {
    if (
      joinable ||
      opensAt === null ||
      windowClosed ||
      zoom?.status !== "created"
    )
      return;

    if (now >= opensAt) {
      if (!requested.current) {
        requested.current = true;
        onOpened?.();
      }
      return;
    }

    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [joinable, opensAt, windowClosed, now, onOpened, zoom?.status]);

  if (!zoom || zoom.status !== "created") return null;

  if (windowClosed) {
    return (
      <Button size={size} variant="outline" disabled>
        <VideoCamera />
        Sesi Zoom telah berakhir
      </Button>
    );
  }

  if (windowOpen && href) {
    return (
      <Button size={size} variant={variant} asChild>
        <a href={href} target="_blank" rel="noreferrer">
          <VideoCamera />
          {label}
        </a>
      </Button>
    );
  }

  if (windowOpen) {
    return (
      <Button size={size} variant="outline" disabled>
        <VideoCamera />
        Tautan belum tersedia
      </Button>
    );
  }

  return (
    <Button size={size} variant="outline" disabled>
      <VideoCamera />
      {opensAt === null
        ? label
        : `Tersedia dalam ${formatJoinCountdown(opensAt - now)}`}
    </Button>
  );
}
