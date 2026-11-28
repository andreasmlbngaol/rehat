"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  MagnifyingGlass,
  SpinnerGap,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ChatTrustIcon,
  MethodVideoIcon,
  ShieldCheckLineIcon,
} from "@/components/ui/figma-icons";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/page-skeleton";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { apiFetch, errorMessage } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/use-api";
import {
  SESSION_STATUS_LABEL,
  formatDate,
  formatTime,
  sessionStatusTone,
} from "@/lib/format";
import type { CounselingSession, Paginated } from "@/lib/types/api";

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

function zoomState(session: CounselingSession): {
  label: string;
  tone: "success" | "destructive" | "info";
} {
  if (session.zoom?.status === "created") {
    return { label: "Siap", tone: "success" };
  }
  if (session.zoom?.status === "failed") {
    return { label: "Gagal", tone: "destructive" };
  }
  return { label: "Belum tersedia", tone: "info" };
}

export function SessionsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<CounselingSession | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setApplied(search.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const path = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (applied) params.set("q", applied);
    if (status) params.set("status", status);
    if (method) params.set("method", method);
    if (from) {
      params.set("from", new Date(`${from}T00:00:00+07:00`).toISOString());
    }
    if (to) {
      params.set("to", new Date(`${to}T23:59:59+07:00`).toISOString());
    }
    return `/api/v1/admin/sessions?${params.toString()}`;
  }, [page, applied, status, method, from, to]);

  const list = useApi<Paginated<CounselingSession>>(path);

  function reset() {
    setSearch("");
    setStatus("");
    setMethod("");
    setFrom("");
    setTo("");
    setPage(1);
  }

  async function retryZoom(session: CounselingSession) {
    setRetrying(true);
    try {
      await apiFetch(`/api/v1/admin/zoom/${session.id}/retry`, {
        method: "POST",
      });
      toast.success("Ruang Zoom berhasil dibuat ulang.");
      await list.refetch();
      setSelected(null);
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="space-y-6" aria-busy={list.refreshing}>
      <PageHeader
        eyebrow="Ruang Admin"
        title="Sesi"
        description="Kelola kebutuhanmu dengan lebih mudah di sini."
      />

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
          onChange={(event) => {
            setMethod(event.target.value);
            setPage(1);
          }}
          className="h-11 w-[127.5px] text-[12px]"
          aria-label="Filter metode"
        >
          <option value="">Semua metode</option>
          <option value="chat">Chat</option>
          <option value="zoom">Zoom</option>
        </Select>
        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="h-11 w-[177px] text-[12px]"
          aria-label="Filter status"
        >
          <option value="">Semua status</option>
          <option value="scheduled">Terjadwal</option>
          <option value="active">Berlangsung</option>
          <option value="completed">Selesai</option>
        </Select>
        <DateFilter label="Dari" value={from} onChange={setFrom} />
        <DateFilter label="Sampai" value={to} onChange={setTo} />
        {from || to || status || method || search ? (
          <button
            type="button"
            onClick={reset}
            className="ml-auto text-[11px] leading-[18px] font-semibold text-[#31594d] hover:underline dark:text-primary"
          >
            Reset filter
          </button>
        ) : null}
      </div>

      <p className="text-[12px] leading-[19.2px] text-[#68746d] dark:text-muted-foreground">
        {list.data?.total ?? 0} sesi ditemukan
      </p>

      {list.loading ? (
        <TableSkeleton rows={5} showHeader={false} showSearch={false} />
      ) : list.error ? (
        <EmptyState title="Gagal memuat sesi" description={list.error} />
      ) : !list.data || list.data.items.length === 0 ? (
        <EmptyState
          title="Tidak ada sesi"
          description="Coba ubah filter atau kata kunci."
        />
      ) : (
        <>
          <div className="space-y-3">
            {list.data.items.map((session) => {
              const isChat = session.booking.method === "chat";
              const zoom = !isChat ? zoomState(session) : null;

              return (
                <div
                  key={session.id}
                  className="rounded-[12px] border border-[#e1e7e1] bg-white p-[22px] dark:border-border dark:bg-card"
                >
                  <div className="flex items-start gap-[18px]">
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
                          {isChat ? "Chat" : "Zoom"}
                        </span>
                      </div>
                      <p className="text-[13px] leading-[20.8px] font-semibold text-[#203b33] dark:text-foreground">
                        {session.booking.serviceName}
                      </p>
                      <p className="text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                        {session.counselor.fullName} ·{" "}
                        {formatDate(session.booking.scheduledStart)} ·{" "}
                        {formatTime(session.booking.scheduledStart)} WIB
                      </p>

                      {zoom ? (
                        <div className="mt-3 flex items-center gap-2 text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                          Integrasi Zoom
                          <Badge variant={zoom.tone} className="gap-1.5">
                            <span className="size-1 rounded-full bg-current" />
                            {zoom.label}
                          </Badge>
                        </div>
                      ) : null}
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
                        onClick={() => setSelected(session)}
                        className="inline-flex items-center gap-1 text-[12px] leading-[19.2px] font-semibold text-[#31594d] hover:underline dark:text-primary"
                      >
                        Lihat detail
                        <ArrowRight className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {(list.data.totalPages ?? 1) > 1 ? (
            <Pagination
              page={list.data.page}
              totalPages={list.data.totalPages}
              total={list.data.total}
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[calc(100vh-2rem)] max-w-[calc(100%-2rem)] overflow-y-auto sm:max-w-[540px]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[#e1e7e1] pb-[18px] dark:border-border">
            <DialogTitle className="text-[18px] leading-[28.8px]">
              Detail sesi · {selected?.booking.bookingCode}
            </DialogTitle>
            <DialogClose asChild>
              <button
                type="button"
                aria-label="Tutup"
                className="-mt-1 flex size-11 shrink-0 items-center justify-center rounded-[8px] text-[#59645f] transition-colors hover:bg-[#f5f7f5] dark:text-muted-foreground dark:hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </DialogClose>
          </div>

          {selected ? (
            <div>
              <div className="mt-[22px]">
                <Badge
                  variant={sessionStatusTone(selected.status)}
                  className="gap-1.5"
                >
                  <span className="size-1 rounded-full bg-current" />
                  {SESSION_STATUS_LABEL[selected.status]}
                </Badge>
              </div>

              <p className="mt-[18px] text-[23px] leading-[36.8px] font-semibold text-[#203b33] dark:text-foreground">
                {selected.booking.serviceName}
              </p>

              <dl className="mt-[10px] divide-y divide-[#edf0eb] text-[12px] leading-[19.2px] dark:divide-border">
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    Pasien
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {selected.patient.fullName}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    Konselor
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {selected.counselor.fullName}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    Metode
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {selected.booking.method === "chat" ? "Chat" : "Zoom"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-[15px]">
                  <dt className="text-[#68746d] dark:text-muted-foreground">
                    Jadwal
                  </dt>
                  <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {formatDate(selected.booking.scheduledStart)}
                    <br />
                    {formatTime(selected.booking.scheduledStart)} WIB ·{" "}
                    {selected.booking.durationMinutes} menit
                  </dd>
                </div>
              </dl>

              {selected.booking.method === "zoom" ? (
                (() => {
                  const zoom = zoomState(selected);
                  return (
                    <div className="mt-[25px] rounded-[10px] bg-[#eff6f2] p-4 dark:bg-accent">
                      <div className="flex flex-wrap items-center gap-2">
                        <MethodVideoIcon className="size-5 text-[#31594d] dark:text-accent-foreground" />
                        <p className="text-[12px] leading-[19.2px] font-semibold text-[#203b33] dark:text-foreground">
                          Integrasi Zoom
                        </p>
                        <Badge variant={zoom.tone} className="gap-1.5">
                          <span className="size-1 rounded-full bg-current" />
                          {zoom.label}
                        </Badge>
                      </div>
                      <p className="mt-3 text-[11px] leading-[18px] text-[#68746d] dark:text-muted-foreground">
                        Status pembuatan meeting
                      </p>
                      <p className="mt-1 text-[12px] leading-[19.2px] text-[#203b33] dark:text-foreground">
                        {zoom.label === "Gagal"
                          ? "Meeting belum berhasil dibuat. Silakan coba menyiapkan ruang meeting kembali."
                          : zoom.label === "Siap"
                            ? "Meeting berhasil dibuat dan siap diakses peserta saat sesi aktif."
                            : "Meeting sedang disiapkan. Silakan periksa kembali beberapa saat lagi."}
                      </p>
                      {zoom.label === "Gagal" ? (
                        <Button
                          type="button"
                          className="mt-4 h-[43px] gap-[22px] rounded-[9px] px-5 text-[12px]"
                          onClick={() => retryZoom(selected)}
                          disabled={retrying}
                        >
                          {retrying ? (
                            <SpinnerGap className="animate-spin" />
                          ) : null}
                          {retrying
                            ? "Menyiapkan..."
                            : "Coba buat meeting lagi"}
                        </Button>
                      ) : null}
                      <div className="my-3 h-px bg-[#dbe5da] dark:bg-border" />
                      <p className="text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                        Akses meeting hanya tersedia untuk pasien dan konselor
                        yang mengikuti sesi.
                      </p>
                    </div>
                  );
                })()
              ) : (
                <div className="mt-[25px] flex items-start gap-3 rounded-[10px] bg-[#eff6f2] p-4 dark:bg-accent">
                  <ShieldCheckLineIcon className="mt-0.5 size-5 shrink-0 text-[#31594d] dark:text-accent-foreground" />
                  <div>
                    <p className="text-[12px] leading-[19.2px] font-semibold text-[#203b33] dark:text-foreground">
                      Metadata operasional saja
                    </p>
                    <p className="mt-0.5 text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                      Isi percakapan tidak tersedia untuk admin.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
