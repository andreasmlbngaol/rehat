import { describe, expect, it } from "vitest";
import { mergeMessages } from "@/lib/chat";
import type { ChatMessage } from "@/lib/types/api";

function message(id: string, createdAt: string): ChatMessage {
  return {
    id,
    sessionId: "session-1",
    senderId: "user-1",
    content: id,
    clientMessageId: `client-${id}`,
    createdAt,
    sender: { id: "user-1", fullName: "Pengguna", avatarUrl: null },
  };
}

describe("mergeMessages", () => {
  it("menambahkan pesan baru sesuai urutan waktu", () => {
    const current = [message("a", "2026-11-28T10:00:00.000Z")];
    const incoming = [message("c", "2026-11-28T10:02:00.000Z"), message("b", "2026-11-28T10:01:00.000Z")];

    expect(mergeMessages(current, incoming).map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  it("tidak menggandakan pesan yang sudah ada", () => {
    const current = [message("a", "2026-11-28T10:00:00.000Z")];
    const incoming = [message("a", "2026-11-28T10:00:00.000Z")];

    expect(mergeMessages(current, incoming)).toBe(current);
  });

  it("mempertahankan riwayat lama yang sudah dimuat", () => {
    const current = [message("old", "2026-11-28T09:00:00.000Z")];
    const incoming = [message("new", "2026-11-28T10:00:00.000Z")];

    expect(mergeMessages(current, incoming).map((item) => item.id)).toEqual(["old", "new"]);
  });
});
