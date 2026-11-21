"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react";
import { SessionDialog } from "@/components/session/session-dialog";
import { Badge } from "@/components/ui/badge";
import {
  ChatTrustIcon,
  MethodVideoIcon,
} from "@/components/ui/figma-icons";
import {
  METHOD_LABEL,
  SESSION_STATUS_LABEL,
  formatDate,
  formatTime,
  sessionStatusTone,
} from "@/lib/format";
import type { CounselingSession } from "@/lib/types/api";

export function RecentSessions({
  sessions,
  role,
}: {
  sessions: CounselingSession[];
  role: "patient" | "counselor";
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<CounselingSession | null>(null);

  return (
    <>
      <div className="space-y-3">
        {sessions.map((session) => {
          const isChat = session.booking.method === "chat";
          const other =
            role === "patient" ? session.counselor : session.patient;

          return (
            <div
              key={session.id}
              className="flex min-h-[123px] items-center gap-[18px] rounded-[12px] border border-[#e1e7e1] bg-white p-[22px] dark:border-border dark:bg-card"
            >
              <span
                className={`flex h-[57px] w-[53px] shrink-0 items-center justify-center rounded-[11px] ${
                  isChat
                    ? "bg-[#eff6f2] text-[#52796a] dark:bg-accent dark:text-accent-foreground"
                    : "bg-[#f3ede3] text-[#927d5e] dark:bg-accent dark:text-accent-foreground"
                }`}
              >
                {isChat ? (
                  <ChatTrustIcon className="size-[26px]" />
                ) : (
                  <MethodVideoIcon className="size-[26px]" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-[7px] text-[12px] leading-[19.2px] text-[#68746d] dark:text-muted-foreground">
                  <span>{session.booking.bookingCode}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    {isChat ? (
                      <ChatTrustIcon className="size-3" />
                    ) : (
                      <MethodVideoIcon className="size-3" />
                    )}
                    {METHOD_LABEL[session.booking.method]}
                  </span>
                </div>
                <p className="text-[13px] leading-[20.8px] font-semibold text-[#203b33] dark:text-foreground">
                  {session.booking.serviceName}
                </p>
                <p className="text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                  {other.fullName} ·{" "}
                  {formatDate(session.booking.scheduledStart)} ·{" "}
                  {formatTime(session.booking.scheduledStart)} WIB
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-[5px]">
                <Badge
                  variant={sessionStatusTone(session.status)}
                  className="gap-1.5"
                >
                  <span className="size-1 rounded-full bg-current" />
                  {SESSION_STATUS_LABEL[session.status]}
                </Badge>
                <button
                  type="button"
                  onClick={() => setDetail(session)}
                  className="inline-flex items-center gap-1 text-[12px] leading-[19.2px] font-semibold text-[#31594d] hover:underline dark:text-primary"
                >
                  Lihat detail
                  <ArrowRight className="size-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <SessionDialog
        session={detail}
        role={role}
        onClose={() => setDetail(null)}
        onChanged={() => router.refresh()}
      />
    </>
  );
}
