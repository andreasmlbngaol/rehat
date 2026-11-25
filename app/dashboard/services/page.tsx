import type { Metadata } from "next";
import { connection } from "next/server";
import { PublicServiceCard } from "@/components/service/public-service-card";
import { TodayBadge } from "@/components/ui/today-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRupiah } from "@/lib/format";
import { getPublicServices } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Layanan",
  description: "Pilih layanan konseling yang paling sesuai dengan kebutuhanmu.",
};

export const instant = false;

export default async function DashboardServicesPage() {
  await connection();
  const services = await getPublicServices();

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] leading-[19.2px] font-semibold tracking-[1.4px] text-[#52796a] uppercase">
            Ruang untuk dirimu
          </p>
          <h1 className="font-sans text-[26px] leading-[36.4px] font-semibold tracking-[-0.7px] text-[#203b33] dark:text-foreground">
            Layanan
          </h1>
          <p className="text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
            Kelola kebutuhanmu dengan lebih mudah di sini.
          </p>
        </div>
        <TodayBadge className="mt-[19px] hidden shrink-0 sm:inline-flex" />
      </div>

      {services.length === 0 ? (
        <EmptyState
          title="Belum ada layanan aktif"
          description="Layanan akan muncul di sini setelah tersedia."
        />
      ) : (
        <div className="grid gap-[22px] md:grid-cols-2 xl:grid-cols-3">
          {services.map((service, index) => (
            <PublicServiceCard
              key={service.id}
              name={service.name}
              description={service.description}
              durationMinutes={service.durationMinutes}
              methods={service.methods}
              price={formatRupiah(service.price)}
              index={index}
              href={`/dashboard/bookings/new?serviceId=${service.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
