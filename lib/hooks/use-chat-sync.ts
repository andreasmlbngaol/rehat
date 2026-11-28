"use client";

import { useCallback, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api/client";
import type { ChatMessage } from "@/lib/types/api";

type MessagesResponse = {
  items: ChatMessage[];
  hasMore: boolean;
  nextCursor: string | null;
};

const SYNC_INTERVAL_MS = 10_000;

/**
 * Jalur cadangan untuk chat. Realtime tetap jalur utama, tetapi pesan bisa
 * terlewat saat channel belum siap, koneksi putus, atau tab lama tidak aktif.
 * Karena itu pesan terbaru diambil ulang saat channel selesai subscribe, saat
 * tab kembali terlihat, saat jaringan pulih, dan secara berkala.
 */
export function useChatSync(
  sessionId: string | null,
  onMessages: (items: ChatMessage[]) => void,
) {
  const sessionIdRef = useRef(sessionId);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const inFlight = useRef(false);

  const sync = useCallback(async () => {
    if (!sessionId || inFlight.current) return;

    const requestedId = sessionId;
    inFlight.current = true;
    try {
      const result = await apiFetch<MessagesResponse>(
        `/api/v1/sessions/${requestedId}/messages?limit=50`,
      );
      if (sessionIdRef.current === requestedId) {
        onMessages(result.items);
      }
    } catch {
      // Diamkan. Realtime masih berjalan dan percobaan berikutnya menyusul.
    } finally {
      inFlight.current = false;
    }
  }, [sessionId, onMessages]);

  useEffect(() => {
    if (!sessionId) return;

    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") void sync();
    };

    const timer = window.setInterval(syncWhenVisible, SYNC_INTERVAL_MS);
    document.addEventListener("visibilitychange", syncWhenVisible);
    window.addEventListener("online", syncWhenVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", syncWhenVisible);
      window.removeEventListener("online", syncWhenVisible);
    };
  }, [sessionId, sync]);

  return sync;
}
