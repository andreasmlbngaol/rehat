"use client";

/* eslint-disable react-hooks/set-state-in-effect -- initial server data is merged into realtime state. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  SpinnerGap,
  ChatTeardropText,
  PaperPlaneTilt,
  VideoCamera,
} from "@phosphor-icons/react/dist/ssr";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineLoading } from "@/components/ui/loading-state";
import { ChatSkeleton } from "@/components/ui/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ZoomJoinButton } from "@/components/session/zoom-join-button";
import { apiFetch, errorMessage } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/use-api";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  METHOD_LABEL,
  SESSION_STATUS_LABEL,
  formatDateTime,
  formatTime,
  sessionStatusTone,
} from "@/lib/format";
import type { ChatMessage, CounselingSession } from "@/lib/types/api";

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

export function SessionRoom({ role }: { role: "patient" | "counselor" }) {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const sessionApi = useApi<CounselingSession>(
    id ? `/api/v1/sessions/${id}` : null,
  );
  const initialMessages = useApi<MessagesResponse>(
    id ? `/api/v1/sessions/${id}/messages?limit=50` : null,
  );

  const session = sessionApi.data;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialMessages.data) return;
    setMessages(initialMessages.data.items);
    setHasMore(initialMessages.data.hasMore);
    setNextCursor(initialMessages.data.nextCursor);
  }, [initialMessages.data]);

  useEffect(() => {
    if (!session) return;

    const supabase = createSupabaseBrowserClient();
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    void (async () => {
      // Channel harus join setelah token sesi terpasang. Tanpa ini channel
      // bisa join sebagai anon sehingga RLS menolak semua event masuk.
      await supabase.realtime.setAuth();
      if (cancelled) return;

      channel = supabase
        .channel(`session-${session.id}`)
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
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [session]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const canSend = Boolean(
    session?.chat?.enabled &&
      !session.chat.readOnly &&
      session.status === "active",
  );

  const other = useMemo(() => {
    if (!session) return null;
    return role === "patient" ? session.counselor : session.patient;
  }, [session, role]);

  const meetingUrl =
    role === "counselor" ? session?.zoom?.startUrl : session?.zoom?.joinUrl;

  const loadOlder = useCallback(async () => {
    if (!id || !nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const result = await apiFetch<MessagesResponse>(
        `/api/v1/sessions/${id}/messages?limit=50&before=${encodeURIComponent(nextCursor)}`,
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
  }, [id, nextCursor, loadingOlder]);

  async function send() {
    const value = content.trim();
    if (!id || !value || sending) return;

    setSending(true);
    try {
      const message = await apiFetch<ChatMessage>(
        `/api/v1/sessions/${id}/messages`,
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

  if (sessionApi.loading) {
    return <ChatSkeleton />;
  }

  if (sessionApi.error || !session) {
    return (
      <EmptyState
        title="Sesi tidak ditemukan"
        description={sessionApi.error ?? "Sesi tidak tersedia."}
        action={
          <Button asChild>
            <Link
              href={role === "counselor" ? "/counselor/sessions" : "/dashboard/sessions"}
            >
              Kembali
            </Link>
          </Button>
        }
      />
    );
  }

  const backHref =
    role === "counselor" ? "/counselor/sessions" : "/dashboard/sessions";

  return (
    <div className="space-y-4" aria-busy={sessionApi.refreshing}>
      <Button variant="ghost" size="sm" asChild>
        <Link href={backHref}>
          <ArrowLeft />
          Semua sesi
        </Link>
      </Button>

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              src={other?.avatarUrl}
              name={other?.fullName ?? "Pengguna"}
              size="lg"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{session.booking.serviceName}</p>
                <Badge variant={sessionStatusTone(session.status)}>
                  {SESSION_STATUS_LABEL[session.status]}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  {session.booking.method === "chat" ? (
                    <ChatTeardropText className="size-3" />
                  ) : (
                    <VideoCamera className="size-3" />
                  )}
                  {METHOD_LABEL[session.booking.method]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {other?.fullName} · {formatDateTime(session.booking.scheduledStart)}
              </p>
              <p className="text-xs text-muted-foreground">
                {session.booking.bookingCode} · {session.booking.durationMinutes} menit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {sessionApi.refreshing ? <InlineLoading /> : null}
            {session.booking.method === "zoom" && session.zoom ? (
              <ZoomJoinButton
                zoom={session.zoom}
                href={meetingUrl}
                label={role === "counselor" ? "Mulai Zoom" : "Gabung Zoom"}
                onOpened={() => void sessionApi.refetch()}
              />
            ) : null}
          </div>
        </CardContent>
      </Card>

      {session.booking.method === "zoom" ? (
        <Card>
          <CardHeader>
            <CardTitle>Ruang Zoom</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {session.zoom?.status === "created" ? (
              <p>
                Tautan rapat dibuka 10 menit sebelum sesi dimulai
                {session.zoom.opensAt
                  ? ` (mulai ${formatTime(session.zoom.opensAt)} WIB)`
                  : ""}{" "}
                dan ditutup saat sesi berakhir.
              </p>
            ) : session.zoom?.status === "failed" ? (
              <Alert variant="destructive">
                Meeting Zoom gagal dibuat. Hubungi administrator agar meeting
                dibuat ulang.
                {role === "counselor" && session.zoom.lastError ? (
                  <span className="mt-1 block text-xs">
                    {session.zoom.lastError}
                  </span>
                ) : null}
              </Alert>
            ) : (
              <p>Meeting Zoom sedang disiapkan. Coba muat ulang beberapa saat lagi.</p>
            )}
            <p>
              Sesi dijadwalkan {formatDateTime(session.booking.scheduledStart)}–
              {formatTime(session.booking.scheduledEnd)} WIB.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="flex min-h-[28rem] flex-col overflow-hidden p-0">
          <CardHeader className="border-b border-[#e1e7e1] px-5 py-4 dark:border-border">
            <CardTitle className="flex items-center gap-2">
              <ChatTeardropText className="size-4 text-primary" />
              Ruang chat
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-3 p-0">
            {session.status === "scheduled" ? (
              <div className="border-b p-4">
                <Alert variant="info">
                  Sesi belum dimulai. Chat aktif pada{" "}
                  {formatDateTime(session.booking.scheduledStart)} WIB.
                </Alert>
              </div>
            ) : null}

            {session.status === "completed" ? (
              <div className="border-b p-4">
                <Alert variant="warning">
                  Sesi sudah berakhir. Riwayat chat tetap dapat dibaca.
                </Alert>
              </div>
            ) : null}

            <div
              ref={listRef}
              className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
              style={{ maxHeight: "26rem" }}
            >
              {initialMessages.loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-2/3" />
                  <Skeleton className="ml-auto h-12 w-1/2" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Belum ada pesan. Mulai percakapan dengan sopan.
                  </p>
                </div>
              ) : (
                <>
                  {hasMore ? (
                    <div className="flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadOlder}
                        disabled={loadingOlder}
                      >
                        {loadingOlder ? (
                          <SpinnerGap className="animate-spin" />
                        ) : null}
                        {loadingOlder ? "Memuat..." : "Muat pesan sebelumnya"}
                      </Button>
                    </div>
                  ) : null}

                  {messages.map((message) => {
                    const mine = message.senderId !== other?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}
                      >
                        {!mine ? (
                          <Avatar
                            src={message.sender.avatarUrl}
                            name={message.sender.fullName}
                            size="sm"
                          />
                        ) : null}
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                            mine
                              ? "rounded-br-sm bg-primary text-primary-foreground"
                              : "rounded-bl-sm bg-muted"
                          }`}
                        >
                          {!mine ? (
                            <p className="mb-0.5 text-xs font-medium opacity-80">
                              {message.sender.fullName}
                            </p>
                          ) : null}
                          <p className="whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          <p
                            className={`mt-1 text-right text-[10px] ${
                              mine
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            <div className="border-t p-3">
              <form
                className="flex items-end gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void send();
                }}
              >
                <Textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder={
                    canSend
                      ? "Tulis pesanmu di sini…"
                      : session.status === "scheduled"
                        ? "Chat aktif saat sesi dimulai"
                        : "Sesi sudah berakhir"
                  }
                  disabled={!canSend || sending}
                  rows={2}
                  maxLength={2000}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void send();
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!canSend || sending || !content.trim()}
                  aria-label={sending ? "Mengirim pesan" : "Kirim pesan"}
                >
                  {sending ? (
                    <SpinnerGap className="animate-spin" />
                  ) : (
                    <PaperPlaneTilt />
                  )}
                </Button>
              </form>
              <p className="mt-1 text-right text-[10px] text-muted-foreground">
                {content.length} / 2.000 karakter
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
