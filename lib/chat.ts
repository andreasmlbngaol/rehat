import type { ChatMessage } from "@/lib/types/api";

/**
 * Gabungkan pesan baru ke daftar yang sudah ada tanpa menghapus riwayat
 * yang sudah dimuat. Urutan akhir mengikuti waktu kirim.
 */
export function mergeMessages(
  current: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  const known = new Set(current.map((message) => message.id));
  const hasNew = incoming.some((message) => !known.has(message.id));
  if (!hasNew) return current;

  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) {
    byId.set(message.id, message);
  }

  return [...byId.values()].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
}
