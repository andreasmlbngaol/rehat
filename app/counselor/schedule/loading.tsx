import { ListSkeleton } from "@/components/ui/page-skeleton";

export default function Loading() {
  return <ListSkeleton rows={4} rowClassName="h-20" />;
}
