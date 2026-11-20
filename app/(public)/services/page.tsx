import type { Metadata } from "next";
import { connection } from "next/server";
import { PublicServiceCard } from "@/components/service/public-service-card";
import { EmptyState } from "@/components/ui/empty-state";
import { LeafLineIcon } from "@/components/ui/figma-icons";
import { formatRupiah } from "@/lib/format";
import { getPublicServices } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Layanan",
  description: "Pilih layanan konseling yang paling sesuai dengan kebutuhanmu.",
};

export const instant = false;

export default async function ServicesPage() {
  await connection();
  const services = await getPublicServices();

  return (
    <div className="bg-[#fdfdfb] dark:bg-background">
      <section className="mx-auto w-full max-w-[1200px] px-6 pt-14 pb-16 lg:px-0 lg:pt-[77px] lg:pb-[77px]">
        <div className="text-center">
          <p className="text-[12px] leading-[19.2px] font-semibold tracking-[1.8px] text-[#52796a] uppercase">
            Ruang untuk ceritamu
          </p>
          <h1 className="mt-[18px] font-heading text-[36px] leading-[1.1] font-normal tracking-[-1px] text-[#203b33] sm:text-[48px] sm:leading-[55.2px] dark:text-foreground">
            Mulai dari yang kamu butuhkan.
          </h1>
          <p className="mt-[14px] text-[12px] leading-[22.8px] text-[#59645f] dark:text-muted-foreground">
            Pilih layanan yang tepat. Kita jalani langkah selanjutnya bersama.
          </p>
        </div>

        {services.length === 0 ? (
          <div className="mt-[35px]">
            <EmptyState
              title="Belum ada layanan aktif"
              description="Layanan akan muncul di sini setelah tersedia."
            />
          </div>
        ) : (
          <div className="mt-[35px] grid gap-[22px] md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <PublicServiceCard
                key={service.id}
                name={service.name}
                description={service.description}
                durationMinutes={service.durationMinutes}
                methods={service.methods}
                price={formatRupiah(service.price)}
                index={index}
                href={`/services/${service.id}`}
              />
            ))}
          </div>
        )}

        <div className="mt-[32px] flex justify-center">
          <div className="flex w-full max-w-[760px] items-start gap-3 rounded-[10px] bg-[#eff6f2] p-4 text-[12px] leading-[21px] text-[#435e50] dark:bg-accent dark:text-accent-foreground">
            <LeafLineIcon className="mt-0.5 size-[18px] shrink-0 text-[#52796a]" />
            <p>
              Belum yakin memilih? Baca deskripsi setiap layanan dan pengantar
              konselor sebelum memesan. Kamu dapat meninjau pilihan sebelum
              pembayaran.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
