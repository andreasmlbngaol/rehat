import { DetailSkeleton } from "@/components/ui/page-skeleton";

export default function CounselorDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <DetailSkeleton />
    </div>
  );
}
