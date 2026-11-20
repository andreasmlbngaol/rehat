import { FullPageSpinner } from "@/components/ui/loading-state";

/**
 * Fallback untuk rute yang belum punya struktur konten pasti (auth, docs,
 * unauthorized). Halaman dengan layout yang diketahui memakai skeleton
 * di segmennya masing-masing.
 */
export default function Loading() {
  return <FullPageSpinner />;
}
