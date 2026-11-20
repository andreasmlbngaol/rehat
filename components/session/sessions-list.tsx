"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  ChatTeardropText,
  MagnifyingGlass,
  VideoCamera,
} from "@phosphor-icons/react";
import { SessionDialog } from "@/components/session/session-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ChatTrustIcon,
  MethodVideoIcon,
} from "@/components/ui/figma-icons";
import { Input } from "@/components/ui/input";
import { InlineLoading } from "@/components/ui/loading-state";
import { ListSkeleton } from "@/components/ui/page-skeleton";
import { Select } from "@/components/ui/select";
import { useApi } from "@/lib/hooks/use-api";
import {
  METHOD_LABEL,
  SESSION_STATUS_LABEL,
  formatDate,
  formatDateInput,
  formatTime,
  sessionStatusTone,
} from "@/lib/format";
import type { CounselingSession, Paginated } from "@/lib/types/api";

const statusOptions = [
  { value: "", label: "Semua status" },
  { value: "scheduled", label: "Terjadwal" },
  { value: "active", label: "Berlangsung" },
];

function DateFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <label className="flex items-center gap-[7px] text-[12px] leading-[19.2px] text-[#68746d] dark:text-muted-foreground">
      {label}
      <span className="relative inline-flex">
        <button
          type="button"
          onClick={() => {
            const input = ref.current;
            if (!input) return;
            if (typeof input.showPicker === "function") input.showPicker();
            else input.focus();
          }}
          className="h-11 w-[127.5px] rounded-[9px] border border-[#c4cec5] bg-white px-3 text-left text-[12px] whitespace-nowrap text-[#203b33] dark:border-border dark:bg-card dark:text-foreground"
        >
          {value ? formatDate(`${value}T00:00:00+07:00`) : ""}
        </button>
        <input
          ref={ref}
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="sr-only"
          tabIndex={-1}
          aria-label={`${label} tanggal`}
        />
      </span>
    </label>
  );
}

export function SessionsList({
  role,
  history = false,
}: {
  role: "patient" | "counselor";
  history?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("");
  const [status, setStatus] = useState(history ? "completed" : "");
  const [from, setFrom] = useState("");
  const [detail, setDetail] = useState<CounselingSession | null>(null);
  const [to, setTo] = useState("");

  const { data, loading, refreshing, error, refetch } = useApi<
    Paginated<CounselingSession>
  >("/api/v1/sessions?limit=50");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (data?.items ?? []).filter((session) => {
      if (history) {
        if (session.status !== "completed") return false;
      } else if (session.status === "completed") {
        return false;
      }
      if (method && session.booking.method !== method) return false;
      if (status && session.status !== status) return false;
      const date = formatDateInput(session.booking.scheduledStart);
      if (from && date < from) return false;
      if (to && date > to) return false;
      if (!query) return true;
      const other =
        role === "patient" ? session.counselor : session.patient;
      return (
        session.booking.serviceName.toLowerCase().includes(query) ||
        other.fullName.toLowerCase().includes(query) ||
        session.booking.bookingCode.toLowerCase().includes(query)
      );
    });
  }, [data, method, status, from, to, search, role, history]);

  function reset() {
    setSearch("");
    setMethod("");
    setStatus(history ? "completed" : "");
    setFrom("");
    setTo("");
  }

  return (
    <div className="space-y-4" aria-busy={refreshing}>
      <div className="flex flex-wrap items-center gap-[10px] lg:flex-nowrap">
        <div className="relative w-full min-w-[240px] sm:w-[449px] sm:flex-none">
          <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-[13px] size-[18px] -translate-y-1/2 text-[#68746d]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari layanan atau konselor..."
            className="h-11 pl-10 text-[12px]"
          />
        </div>
        <Select
          value={method}
          onChange={(event) => setMethod(event.target.value)}
          className="h-11 w-[127.5px] text-[12px]"
          aria-label="Filter metode"
        >
          <option value="">Semua metode</option>
          <option value="chat">Chat</option>
          <option value="zoom">Zoom</option>
        </Select>
        {!history ? (
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-11 w-[177px] text-[12px]"
            aria-label="Filter status"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        ) : null}
        <DateFilter label="Dari" value={from} onChange={setFrom} />
        <DateFilter label="Sampai" value={to} onChange={setTo} />
        {refreshing ? <InlineLoading /> : null}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[12px] leading-[19.2px] text-[#68746d] dark:text-muted-foreground">
          {filtered.length} sesi ditemukan
        </p>
        <button
          type="button"
          onClick={reset}
          className="text-[11px] leading-[18px] font-semibold text-[#31594d] hover:underline dark:text-primary"
        >
          Reset filter
        </button>
      </div>

      {loading ? (
        <ListSkeleton rows={3} rowClassName="h-24" showHeader={false} showFilter={false} />
      ) : error ? (
        <EmptyState
          title="Gagal memuat sesi"
          description={error}
          action={<Button onClick={() => void refetch()}>Coba lagi</Button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={history ? "Belum ada riwayat" : "Belum ada sesi"}
          description={
            history
              ? "Sesi yang sudah selesai akan muncul di sini."
              : role === "patient"
                ? "Sesi akan muncul setelah pemesanan dikonfirmasi."
                : "Sesi pasien akan muncul di sini setelah pembayaran berhasil."
          }
          icon={<CalendarCheck className="size-6" />}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((session) => {
            const other = role === "patient" ? session.counselor : session.patient;
            const isChat = session.booking.method === "chat";
            return (
              <div
                key={session.id}
                className="flex min-h-[123px] flex-col gap-[18px] rounded-xl border border-[#e1e7e1] bg-white p-[22px] sm:flex-row sm:items-center dark:border-border dark:bg-card"
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
                        <ChatTeardropText className="size-3" />
                      ) : (
                        <VideoCamera className="size-3" />
                      )}
                      {METHOD_LABEL[session.booking.method]}
                    </span>
                  </div>
                  <p className="text-[13px] leading-[20.8px] font-semibold text-[#203b33] dark:text-foreground">
                    {session.booking.serviceName}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-[19.2px] text-[#68746d] dark:text-muted-foreground">
                    {other.fullName} ·{" "}
                    {formatDate(session.booking.scheduledStart)} ·{" "}
                    {formatTime(session.booking.scheduledStart)} WIB
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-[5px]">
                  <Badge variant={sessionStatusTone(session.status)} className="gap-1.5">
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
      )}

      <SessionDialog
        session={detail}
        role={role}
        onClose={() => setDetail(null)}
        onChanged={() => void refetch()}
      />
    </div>
  );
}
