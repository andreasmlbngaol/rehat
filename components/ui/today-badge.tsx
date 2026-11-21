"use client";

/* eslint-disable react-hooks/set-state-in-effect -- date is resolved after mount to avoid SSR/prerender mismatch. */

import { useEffect, useState } from "react";
import { cn } from "cn";
import { CalendarTrustIcon } from "@/components/ui/figma-icons";
import { formatDate } from "@/lib/format";

export function TodayBadge({ className }: { className?: string }) {
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(formatDate(new Date()));
  }, []);

  return (
    <span
      className={cn(
        "inline-flex h-10 min-w-[157px] items-center gap-2 rounded-[7px] border border-[#e1e7e1] px-3 text-[12px] leading-[19.2px] text-[#59645f] dark:border-border dark:text-muted-foreground",
        className,
      )}
    >
      <CalendarTrustIcon className="size-4 shrink-0" />
      {today || "\u00a0"}
    </span>
  );
}
