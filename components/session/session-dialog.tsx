"use client";

/* eslint-disable react-hooks/set-state-in-effect -- dialog view and chat state reset when the session changes. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PaperPlaneTilt, SpinnerGap, X } from "@phosphor-icons/react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChatTrustIcon,
  CheckLineIcon,
  ClockPrepIcon,
  MethodVideoIcon,
} from "@/components/ui/figma-icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, errorMessage } from "@/lib/api/client";
import { mergeMessages } from "@/lib/chat";
import { useChatSync } from "@/lib/hooks/use-chat-sync";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  METHOD_LABEL,
  SESSION_STATUS_LABEL,
  formatDate,
  formatTime,
  sessionStatusTone,
} from "@/lib/format";
import type { ChatMessage, CounselingSession } from "@/lib/types/api";

type View = "detail" | "chat" | "zoom";

type MessagesResponse = {
  items: ChatMessage[];
  hasMore: boolean;
  nextCursor: string | null;
};

type ChatMessageRow = {
  id: string;
  session_id: string;
  sender_id: string;
  content: string;
  client_message_id: string;
  created_at: string;
};

function toMessage(
  row: ChatMessageRow,
  session: CounselingSession,
): ChatMessage {
  const sender =
    row.sender_id === session.patient.id
      ? session.patient
      : row.sender_id === session.counselor.id
        ? session.counselor
        : { id: row.sender_id, fullName: "Pengguna", avatarUrl: null };

  return {
    id: row.id,
    sessionId: row.session_id,
    senderId: row.sender_id,
    content: row.content,
    clientMessageId: row.client_message_id,
    createdAt: row.created_at,
    sender,
  };
}

function paymentLabel(status: CounselingSession["booking"]["status"]) {
  switch (status) {
    case "confirmed":
      return "Berhasil";
    case "pending_payment":
      return "Menunggu";
    case "cancelled":
      return "Dibatalkan";
    default:
      return "Kedaluwarsa";
  }
}

function paymentVariant(
  status: CounselingSession["booking"]["status"],
): "success" | "warning" | "destructive" {
  if (status === "confirmed") return "success";
  if (status === "pending_payment") return "warning";
  return "destructive";
}

export function SessionDialog({
  session,
  role,
  onClose,
  onChanged,
}: {
  session: CounselingSession | null;
  role: "patient" | "counselor";
  onClose: () => void;
  onChanged?: () => void;
}) {
  const [view, setView] = useState<View>("detail");

  useEffect(() => {
    setView("detail");
  }, [session?.id]);

  if (!session) return null;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100vh-2rem)] max-w-[calc(100%-2rem)] gap-0 overflow-y-auto rounded-[17px] p-[27px] sm:max-w-[540px]"
      >
        {view === "detail" ? (
          <SessionDetail
            session={session}
            role={role}
            onChat={() => setView("chat")}
            onZoom={() => setView("zoom")}
          />
        ) : view === "chat" ? (
          <SessionChat
            session={session}
            role={role}
            onChanged={onChanged}
          />
        ) : (
          <SessionZoomRoom onBack={() => setView("detail")} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DialogHeading({ title }: { title: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#e1e7e1] pb-[18px] dark:border-border">
      <DialogTitle className="text-[18px] leading-[28.8px] font-semibold text-[#203b33] dark:text-foreground">
        {title}
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
  );
}

function SessionDetail({
  session,
  role,
  onChat,
  onZoom,
}: {
  session: CounselingSession;
  role: "patient" | "counselor";
  onChat: () => void;
  onZoom: () => void;
}) {
  const isChat = session.booking.method === "chat";
  const other = role === "patient" ? session.counselor : session.patient;
  const meetingUrl =
    role === "counselor" ? session.zoom?.startUrl : session.zoom?.joinUrl;
  const zoomReady = Boolean(session.zoom?.joinable && meetingUrl);
  const completed = session.status === "completed";
  const scheduled = session.status === "scheduled";

  const showPayment = !isChat || session.status === "active";

  return (
    <>
      <DialogHeading title={`Detail sesi · ${session.booking.bookingCode}`} />

      <div className="mt-[22px]">
        <Badge variant={sessionStatusTone(session.status)} className="gap-1.5">
          <span className="size-1 rounded-full bg-current" />
          {SESSION_STATUS_LABEL[session.status]}
        </Badge>
      </div>

      <p className="mt-[18px] text-[23px] leading-[36.8px] font-semibold text-[#203b33] dark:text-foreground">
        {session.booking.serviceName}
      </p>

      <dl className="mt-[10px] divide-y divide-[#edf0eb] text-[12px] leading-[19.2px] dark:divide-border">
        <div className="flex items-start justify-between gap-4 py-[15px]">
          <dt className="text-[#68746d] dark:text-muted-foreground">
            {role === "patient" ? "Konselor" : "Pasien"}
          </dt>
          <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
            {other.fullName}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4 py-[15px]">
          <dt className="text-[#68746d] dark:text-muted-foreground">Metode</dt>
          <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
            {METHOD_LABEL[session.booking.method]}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4 py-[15px]">
          <dt className="text-[#68746d] dark:text-muted-foreground">Jadwal</dt>
          <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
            {formatDate(session.booking.scheduledStart)}
            <br />
            {formatTime(session.booking.scheduledStart)} WIB ·{" "}
            {session.booking.durationMinutes} menit
          </dd>
        </div>
        {showPayment ? (
          <div className="flex items-start justify-between gap-4 py-[15px]">
            <dt className="text-[#68746d] dark:text-muted-foreground">
              {session.status === "active" ? "Status pembayaran" : "Pembayaran"}
            </dt>
            <dd className="text-right">
              <Badge
                variant={paymentVariant(session.booking.status)}
                className="gap-1.5"
              >
                <span className="size-1 rounded-full bg-current" />
                {paymentLabel(session.booking.status)}
              </Badge>
              {session.status === "active" &&
              session.booking.status === "confirmed" ? (
                <p className="mt-1 text-[11px] leading-[18px] text-[#68746d] dark:text-muted-foreground">
                  Sesi terkonfirmasi
                </p>
              ) : null}
            </dd>
          </div>
        ) : null}
      </dl>

      {isChat && scheduled ? (
        <div className="mt-[25px] flex items-start gap-3 rounded-[10px] bg-[#eff6f2] p-4 dark:bg-accent">
          <ClockPrepIcon className="mt-0.5 size-5 shrink-0 text-[#31594d] dark:text-accent-foreground" />
          <p className="text-[12px] leading-[19.2px] text-[#203b33] dark:text-foreground">
            Sesi dapat diakses pada{" "}
            {formatDate(session.booking.scheduledStart)}, pukul{" "}
            {formatTime(session.booking.scheduledStart)} WIB. Silakan kembali
            sesuai jadwal.
          </p>
        </div>
      ) : null}

      {!isChat && scheduled && session.zoom?.status === "created" ? (
        <div className="mt-[25px] rounded-[10px] bg-[#eff6f2] p-4 dark:bg-accent">
          <div className="flex flex-wrap items-center gap-2">
            <MethodVideoIcon className="size-5 text-[#31594d] dark:text-accent-foreground" />
            <p className="text-[12px] leading-[19.2px] font-semibold text-[#203b33] dark:text-foreground">
              Integrasi Zoom
            </p>
            <Badge variant="success" className="h-5 gap-1 px-1.5 text-[10px]">
              <span className="size-1 rounded-full bg-current" />
              Siap
            </Badge>
          </div>
          <p className="mt-3 text-[11px] leading-[18px] text-[#68746d] dark:text-muted-foreground">
            Status pembuatan meeting
          </p>
          <p className="mt-1 text-[12px] leading-[19.2px] text-[#203b33] dark:text-foreground">
            Meeting berhasil dibuat dan siap diakses peserta saat sesi aktif.
          </p>
          <div className="my-3 h-px bg-[#dbe5da] dark:bg-border" />
          <p className="text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
            Akses meeting hanya tersedia untuk pasien dan konselor yang
            mengikuti sesi.
          </p>
        </div>
      ) : null}

      {!isChat && (!scheduled || session.zoom?.status !== "created") ? (
        <div className="mt-[25px] flex items-start gap-3 rounded-[10px] bg-[#eff6f2] p-4 dark:bg-accent">
          <MethodVideoIcon className="mt-0.5 size-5 shrink-0 text-[#31594d] dark:text-accent-foreground" />
          <div>
            <p className="flex items-center gap-1.5 text-[12px] leading-[19.2px] font-semibold text-[#203b33] dark:text-foreground">
              {zoomReady && !completed ? (
                <span className="size-1 rounded-full bg-current" />
              ) : null}
              {completed
                ? "Sesi telah berakhir"
                : zoomReady
                  ? "Meeting siap"
                  : "Tautan Zoom belum tersedia"}
            </p>
            <p className="mt-0.5 text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
              {completed
                ? "Ruang meeting sudah ditutup. Informasi sesi tetap tersimpan di sini."
                : zoomReady
                  ? "Ruang Zoom siap. Pastikan perangkat dan koneksi internetmu sudah siap sebelum bergabung."
                  : "Ruang meeting sedang disiapkan. Silakan periksa kembali detail sesi beberapa saat lagi."}
            </p>
          </div>
        </div>
      ) : null}

      {isChat && !scheduled ? (
        <Button
          type="button"
          size="lg"
          className="mt-5 w-full gap-[22px]"
          onClick={onChat}
        >
          {completed ? "Lihat percakapan" : "Masuk ruang chat"}
          <ChatTrustIcon className="size-5" />
        </Button>
      ) : !isChat && zoomReady && !completed ? (
        <Button size="lg" className="mt-5 w-full gap-[22px]" asChild>
          <a
            href={meetingUrl ?? undefined}
            target="_blank"
            rel="noreferrer"
            onClick={onZoom}
          >
            {role === "counselor" ? "Mulai meeting" : "Gabung Zoom"}
            <MethodVideoIcon className="size-5" />
          </a>
        </Button>
      ) : null}
    </>
  );
}

function SessionChat({
  session,
  role,
  onChanged,
}: {
  session: CounselingSession;
  role: "patient" | "counselor";
  onChanged?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [ended, setEnded] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSyncedMessages = useCallback((items: ChatMessage[]) => {
    setMessages((current) => mergeMessages(current, items));
  }, []);

  const syncMessages = useChatSync(session.id, handleSyncedMessages);

  const other = role === "patient" ? session.counselor : session.patient;
  const status = ended ? "completed" : session.status;
  const canSend = Boolean(
    session.chat?.enabled &&
      !session.chat.readOnly &&
      status === "active" &&
      !ended,
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    apiFetch<MessagesResponse>(
      `/api/v1/sessions/${session.id}/messages?limit=50`,
    )
      .then((result) => {
        if (cancelled) return;
        setMessages(result.items);
        setHasMore(result.hasMore);
        setNextCursor(result.nextCursor);
      })
      .catch((cause) => {
        if (!cancelled) toast.error(errorMessage(cause));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session.id]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    void (async () => {
      // Channel harus join setelah token sesi terpasang. Tanpa ini channel
      // bisa join sebagai anon sehingga RLS menolak semua event masuk.
      await supabase.realtime.setAuth();
      if (cancelled) return;

      channel = supabase
        .channel(`session-dialog-${session.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `session_id=eq.${session.id}`,
          },
          (payload: { new: ChatMessageRow }) => {
            const row = payload.new;
            setMessages((current) =>
              current.some((message) => message.id === row.id)
                ? current
                : [...current, toMessage(row, session)],
            );
          },
        )
        .subscribe((status: string) => {
          if (status === "SUBSCRIBED") void syncMessages();
        });
    })();

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [session, syncMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const groups = useMemo(() => {
    const result: { date: string; items: ChatMessage[] }[] = [];
    for (const message of messages) {
      const date = formatDate(message.createdAt);
      const last = result[result.length - 1];
      if (last?.date === date) last.items.push(message);
      else result.push({ date, items: [message] });
    }
    return result;
  }, [messages]);

  const loadOlder = useCallback(async () => {
    if (!nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const result = await apiFetch<MessagesResponse>(
        `/api/v1/sessions/${session.id}/messages?limit=50&before=${encodeURIComponent(nextCursor)}`,
      );
      setMessages((current) => {
        const existing = new Set(current.map((message) => message.id));
        const older = result.items.filter((message) => !existing.has(message.id));
        return [...older, ...current];
      });
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setLoadingOlder(false);
    }
  }, [session.id, nextCursor, loadingOlder]);

  async function send() {
    const value = content.trim();
    if (!value || sending || !canSend) return;

    setSending(true);
    try {
      const message = await apiFetch<ChatMessage>(
        `/api/v1/sessions/${session.id}/messages`,
        {
          method: "POST",
          body: { content: value, clientMessageId: crypto.randomUUID() },
        },
      );
      setMessages((current) =>
        current.some((item) => item.id === message.id)
          ? current
          : [...current, message],
      );
      setContent("");
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setSending(false);
    }
  }

  async function end() {
    setEnding(true);
    try {
      await apiFetch(`/api/v1/sessions/${session.id}/end`, { method: "POST" });
      toast.success("Sesi telah diakhiri.");
      setEnded(true);
      setConfirmEnd(false);
      onChanged?.();
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setEnding(false);
    }
  }

  const readOnly = status === "completed";

  return (
    <>
      <DialogHeading title={readOnly ? "Riwayat percakapan" : "Ruang chat"} />

      <div className="mt-[22px] flex items-center gap-[11px]">
        <Avatar
          src={other.avatarUrl}
          name={other.fullName}
          size="md"
          className="size-[42px]"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] leading-[19.2px] font-semibold text-[#203b33] dark:text-foreground">
            {other.fullName}
          </p>
          <p className="truncate text-[12px] leading-[19.2px] text-[#68746d] dark:text-muted-foreground">
            {session.booking.serviceName} · {session.booking.bookingCode}
          </p>
        </div>
        <Badge variant={sessionStatusTone(status)} className="shrink-0 gap-1.5">
          <span className="size-1 rounded-full bg-current" />
          {SESSION_STATUS_LABEL[status]}
        </Badge>
      </div>

      {readOnly ? (
        <div className="mt-4 flex items-start gap-2.5 rounded-[10px] bg-[#eff6f2] px-4 py-4 dark:bg-accent">
          <CheckLineIcon className="mt-0.5 size-4 shrink-0 text-[#31594d] dark:text-accent-foreground" />
          <p className="text-[12px] leading-[19.2px] text-[#203b33] dark:text-foreground">
            Sesi selesai. Percakapan ini hanya dapat dibaca.
          </p>
        </div>
      ) : confirmEnd ? (
        <div className="mt-[10px] flex flex-wrap items-center gap-3 text-[12px] leading-[19.2px]">
          <span className="text-[#59645f] dark:text-muted-foreground">
            Akhiri sesi ini?
          </span>
          <button
            type="button"
            onClick={end}
            disabled={ending}
            className="inline-flex items-center gap-1 font-semibold text-[#9b3f3f] hover:underline disabled:opacity-60"
          >
            {ending ? <SpinnerGap className="size-3 animate-spin" /> : null}
            Ya, akhiri
          </button>
          <button
            type="button"
            onClick={() => setConfirmEnd(false)}
            className="text-[#68746d] hover:underline dark:text-muted-foreground"
          >
            Batal
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmEnd(true)}
          className="mt-[10px] inline-flex h-11 items-center text-[12px] leading-[19.2px] font-medium text-[#31594d] hover:underline dark:text-primary"
        >
          Akhiri sesi
        </button>
      )}

      <div className="h-[200px] overflow-y-auto rounded-[12px] bg-[#f6f8f4] px-3.5 py-5 dark:bg-muted">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="mx-auto h-4 w-28" />
            <Skeleton className="h-16 w-3/4 rounded-[10px]" />
            <Skeleton className="ml-auto h-12 w-1/2 rounded-[10px]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <p className="text-[12px] leading-[19.2px] text-[#68746d] dark:text-muted-foreground">
              Belum ada pesan. Mulai percakapan dengan sopan.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {hasMore ? (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={loadOlder}
                  disabled={loadingOlder}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#31594d] hover:underline disabled:opacity-60 dark:text-primary"
                >
                  {loadingOlder ? (
                    <SpinnerGap className="size-3 animate-spin" />
                  ) : null}
                  Muat pesan sebelumnya
                </button>
              </div>
            ) : null}

            {groups.map((group) => (
              <div key={group.date} className="space-y-3">
                <p className="text-center text-[12px] leading-[19.2px] text-[#68746d] dark:text-muted-foreground">
                  {group.date}
                </p>
                {group.items.map((message) => {
                  const mine = message.senderId !== other.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-[10px] border px-[15px] py-3 ${
                          mine
                            ? "border-[#d1e2d8] bg-[#dcece5] dark:border-border dark:bg-accent"
                            : "border-[#e1e7e1] bg-white dark:border-border dark:bg-card"
                        }`}
                      >
                        <p className="text-[12px] leading-[19.2px] whitespace-pre-wrap break-words text-[#203b33] dark:text-foreground">
                          {message.content}
                        </p>
                        <p className="mt-1 text-right text-[12px] leading-[19.2px] text-[#68746d] dark:text-muted-foreground">
                          {formatTime(message.createdAt)}
                          {mine ? " · Terkirim" : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {readOnly ? null : (
      <>
      <div className="mt-4 flex items-end gap-2.5">
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={
            canSend
              ? "Tulis pesanmu di sini…"
              : status === "scheduled"
                ? "Chat aktif saat sesi dimulai"
                : "Sesi sudah berakhir"
          }
          disabled={!canSend || sending}
          rows={2}
          maxLength={2000}
          className="h-[70px] min-h-[70px] flex-1 resize-none rounded-[9px] border-[#aab7af] text-[12px] dark:border-input"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send();
            }
          }}
        />
        <Button
          type="button"
          size="icon-lg"
          onClick={() => void send()}
          disabled={!canSend || sending || !content.trim()}
          aria-label={sending ? "Mengirim pesan" : "Kirim pesan"}
          className="shrink-0 rounded-[10px]"
        >
          {sending ? (
            <SpinnerGap className="animate-spin" />
          ) : (
            <PaperPlaneTilt className="size-5" />
          )}
        </Button>
      </div>
      <p className="mt-1 text-right text-[12px] leading-[19.2px] text-[#68746d] dark:text-muted-foreground">
        {content.length} / 2.000 karakter
      </p>
      </>
      )}
    </>
  );
}

function SessionZoomRoom({ onBack }: { onBack: () => void }) {
  return (
    <>
      <DialogHeading title="Ruang Zoom" />

      <div className="mt-[22px] rounded-[12px] px-6 py-8 text-center">
        <MethodVideoIcon className="mx-auto size-10 text-[#52796a] dark:text-primary" />
        <p className="mt-6 text-[17px] leading-[27.2px] font-semibold text-[#203b33] dark:text-foreground">
          Ruang sesi Zoom
        </p>
        <p className="mx-auto mt-2.5 max-w-[390px] text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
          Informasi jadwal dan peserta tersedia pada detail sesi. Hubungi
          konselor jika memerlukan bantuan untuk bergabung.
        </p>
        <Button
          type="button"
          size="lg"
          className="mt-[22px]"
          onClick={onBack}
        >
          Kembali ke detail sesi
        </Button>
      </div>
    </>
  );
}
