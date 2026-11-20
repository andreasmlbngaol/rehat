import { CatalogSkeleton } from "@/components/ui/page-skeleton";

export default function ServicesLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <CatalogSkeleton cards={6} columns={3} />
    </div>
  );
}
