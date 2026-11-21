import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ArrowRight, CaretRight, Heart } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { LeafMark } from "@/components/ui/leaf-mark";
import {
  CalendarTrustIcon,
  ChatTrustIcon,
  LeafLineIcon,
  LockTrustIcon,
  MethodChatIcon,
  MethodVideoIcon,
  PlusLineIcon,
  ShieldCheckLineIcon,
  XLineIcon,
} from "@/components/ui/figma-icons";

const methods = [
  {
    icon: MethodChatIcon,
    title: "Konseling lewat chat",
    description:
      "Tuangkan cerita dalam tulisan, tanpa perlu menyalakan kamera. Percakapan langsung di ruang chat REHAT.",
    className: "bg-[#eff4ed]",
    iconBoxClassName: "bg-[#dfe9db]",
    iconClassName: "text-[#60775d]",
  },
  {
    icon: MethodVideoIcon,
    title: "Sesi melalui Zoom",
    description:
      "Berbincang tatap muka secara online. Bangun percakapan yang lebih dekat dari ruang nyamanmu.",
    className: "bg-[#f5f1eb]",
    iconBoxClassName: "bg-[#eae2d5]",
    iconClassName: "text-[#927d5e]",
  },
];

const faqs = [
  {
    question: "Apakah saya harus punya masalah besar untuk konseling?",
    answer:
      "Tidak. Kamu boleh datang untuk memahami perasaan, mengenali diri, atau sekadar membicarakan hal yang terasa berat. Tidak ada cerita yang terlalu kecil.",
  },
  {
    question: "Bagaimana cara memilih konselor yang tepat?",
    answer:
      "Kenali bidang keahlian, pendekatan, dan deskripsi profesional setiap konselor. Kamu bisa membaca profil mereka terlebih dahulu, lalu memilih yang paling terasa nyaman.",
  },
  {
    question: "Apa yang perlu disiapkan sebelum sesi?",
    answer:
      "Cari tempat yang tenang dan privat, siapkan koneksi internet yang stabil, dan luangkan waktu sekitar 45–60 menit. Untuk sesi Zoom, pastikan aplikasi Zoom sudah tersedia.",
  },
  {
    question: "Apakah percakapan saya bersifat pribadi?",
    answer:
      "Ya. Percakapan konseling hanya dapat diakses oleh kamu dan konselor yang menangani sesi. Admin tidak memiliki akses ke isi percakapan.",
  },
];

export const instant = false;


export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string }>;
}) {
  await connection();
  const params = await searchParams;

  // Supabase falls back to the Site URL when the requested redirect is not
  // allowlisted. Forward the OAuth code so the session exchange still happens.
  if (params.code) {
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}`);
  }
  if (params.error) {
    redirect("/login?error=oauth_failed");
  }

  return (
    <div className="bg-[#fdfdfb] dark:bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#fdfdfb] dark:bg-background">
        <div className="mx-auto grid w-full max-w-[1200px] gap-14 px-6 pt-14 pb-16 lg:grid-cols-[572.5px_572.5px] lg:items-center lg:gap-[55px] lg:px-0 lg:pt-[77px] lg:pb-[76px]">
          <div className="max-w-[572.5px]">
            <p className="flex items-center gap-[9px] text-[12px] leading-[19.2px] font-semibold tracking-[1.8px] text-[#52796a] uppercase">
              <span className="size-[6px] rounded-full bg-[#52796a]" />
              Konseling Online
            </p>
            <div className="relative mt-[26px]">
              <h1 className="font-heading text-[44px] leading-[1.02] font-medium tracking-[-1.6px] text-[#203b33] sm:text-[64px] sm:leading-[64px] sm:tracking-[-2.3px] dark:text-foreground">
                Ruang aman
                <br />
                untuk mulai
                <br />
                <span className="italic text-[#65816b] dark:text-primary">
                  bercerita.
                </span>
              </h1>
              <svg
                viewBox="0 0 43 47"
                aria-hidden
                className="pointer-events-none absolute top-[7px] left-[330px] hidden size-[43px] -rotate-[7deg] sm:block"
                fill="none"
                stroke="#c7a77a"
                strokeWidth="1.7917"
                strokeLinecap="round"
              >
                <g transform="translate(4.5 2)">
                  <path d="M 1.7917 25.9792 L 20.6042 10.75 M 14.3333 34.0417 L 33.1458 28.6667 M 0 12.5417 L 4.4792 0" />
                </g>
              </svg>
            </div>
            <p className="mt-[23px] max-w-[572.5px] text-[16px] leading-[29.6px] text-[#59645f] dark:text-muted-foreground">
              Pilih layanan, temukan konselor, dan jadwalkan{" "}
              <br className="hidden sm:block" />
              sesi yang sesuai untukmu.
            </p>
            <div className="mt-[28px] flex flex-wrap items-center">
              <Button size="lg" className="gap-[22px] px-6" asChild>
                <Link href="/services">
                  Lihat layanan
                  <ArrowRight weight="bold" className="size-5" />
                </Link>
              </Button>
              <Link
                href="/cara-kerja"
                className="inline-flex h-[50px] items-center gap-[10px] px-4 text-[13px] leading-[18.2px] font-semibold text-[#203b33] transition-colors hover:text-[#31594d] dark:text-foreground"
              >
                Cara kerja
                <CaretRight weight="bold" className="size-4" />
              </Link>
            </div>
            <p className="mt-[27px] flex items-center gap-2 text-[12px] leading-[19.2px] text-[#68746d] dark:text-muted-foreground">
              <ShieldCheckLineIcon className="size-4 shrink-0 text-[#52796a]" />
              Cerita kamu berharga. Kami siap mendengarkan.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-[572.5px] lg:mx-0 lg:mt-4 lg:pb-[72px]">
            <div
              aria-hidden
              className="absolute -top-[6px] -left-[9px] hidden h-[550px] w-[595px] rotate-[7deg] rounded-[257px_257px_240px_275px] bg-[#e8efe6] lg:block dark:bg-accent/40"
            />

            <div className="relative mt-4 lg:mt-[15px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hero-counseling.jpg"
                alt="Dua orang berbincang di ruang konseling"
                className="relative block aspect-[572.5/381.66] w-full rounded-[20px] bg-[#dce2de] object-cover"
              />
              <span className="absolute -top-[24px] right-[15px] flex size-[51px] -rotate-12 items-center justify-center rounded-full bg-[#e9e0d4]">
                <LeafLineIcon className="size-[25px] text-[#203b33]" />
              </span>
            </div>

            <div className="relative mt-3 flex items-center justify-end gap-[7px] text-[12px] leading-[19.2px] text-[#68746d] dark:text-muted-foreground">
              <span className="h-px w-[17px] bg-[#929b96]" />
              Suasana konseling
            </div>

            <svg
              viewBox="0 0 96 60"
              aria-hidden
              className="absolute top-[444.65px] right-[9px] hidden h-[60px] w-[96px] rotate-[10deg] text-[#81957d] lg:block"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2857"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <g transform="translate(3.4286 6.8571)">
                <path d="M 0 34.2857 C 17.1429 49.7143 46.2857 43.7143 42 20.5714 C 38.5714 2.5714 19.7143 8.5714 30.8571 22.2857 C 41.1429 35.1429 66 30.8571 81.4286 2.5714" />
                <path d="M 70.2857 4.2857 L 83.1429 0 L 82.2857 13.7143" />
              </g>
            </svg>

            <div className="mt-4 w-full rotate-0 rounded-[12px] border border-[#e1e7e1] bg-white p-[17px] px-[21px] shadow-[0_7px_30px_rgba(32,59,51,0.04)] lg:absolute lg:top-[417px] lg:-left-[28px] lg:mt-0 lg:w-[322px] lg:rotate-[2deg] dark:border-border dark:bg-card">
              <div className="flex items-start gap-3">
                <span className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-[#eff6f2] text-[#52796a] dark:bg-accent dark:text-accent-foreground">
                  <Heart className="size-5" />
                </span>
                <div>
                  <p className="text-[12px] leading-[19.2px] font-semibold text-[#203b33] dark:text-foreground">
                    Tidak harus baik-baik saja.
                  </p>
                  <p className="text-[12px] leading-[19.2px] tracking-[-0.3px] text-[#68746d] dark:text-muted-foreground">
                    Di sini, kamu bisa menjadi dirimu sendiri.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-[#e1e7e1] bg-[#f5f7f2] dark:border-border dark:bg-accent/50">
        <div className="mx-auto grid w-full max-w-[1200px] gap-3 px-6 py-4 sm:grid-cols-3 sm:gap-0 sm:py-0 lg:h-[65px] lg:items-center lg:px-0">
          {[
            { icon: LockTrustIcon, label: "Ruang yang menjaga privasimu" },
            { icon: ChatTrustIcon, label: "Cerita tanpa merasa dihakimi" },
            { icon: CalendarTrustIcon, label: "Jadwal yang menyesuaikanmu" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-center gap-[11px] text-[12px] leading-[19.2px] text-[#526353] dark:text-muted-foreground"
            >
              <item.icon className="size-[18px] shrink-0 text-[#6b826c]" />
              {item.label}
            </div>
          ))}
        </div>
      </section>

      {/* Methods */}
      <section className="mx-auto w-full max-w-[1200px] px-6 pt-14 pb-10 text-center lg:px-0 lg:pt-[77px] lg:pb-[64px]">
        <p className="text-[12px] leading-[19.2px] font-semibold tracking-[1.8px] text-[#52796a] uppercase">
          Cara bercerita, pilihanmu
        </p>
        <h2 className="mt-[13px] font-heading text-[34px] leading-[1.12] font-normal tracking-[-0.9px] text-[#203b33] sm:text-[40px] sm:leading-[44.8px] dark:text-foreground">
          Nyaman dengan caramu sendiri.
        </h2>
        <p className="mt-[12px] text-[12px] leading-[22.8px] text-[#59645f] dark:text-muted-foreground">
          Dua cara terhubung, satu ruang untuk didengarkan.
        </p>

        <div className="mt-[33px] grid gap-6 text-left md:grid-cols-2">
          {methods.map((method) => (
            <div
              key={method.title}
              className={`flex gap-[22px] rounded-[14px] p-[30px] ${method.className} dark:bg-card`}
            >
              <span
                className={`flex size-[57px] shrink-0 items-center justify-center rounded-[14px] ${method.iconBoxClassName} dark:bg-accent`}
              >
                <method.icon
                  className={`size-[30px] ${method.iconClassName} dark:text-accent-foreground`}
                />
              </span>
              <div>
                <p className="text-[17px] leading-[27.2px] font-semibold text-[#203b33] dark:text-foreground">
                  {method.title}
                </p>
                <p className="mt-[10px] text-[14px] leading-[26.6px] text-[#59645f] dark:text-muted-foreground">
                  {method.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto grid w-full max-w-[1200px] gap-12 px-6 pt-5 pb-16 lg:grid-cols-[471.8px_638.3px] lg:gap-[90px] lg:px-0 lg:pb-20">
        <div>
          <p className="text-[12px] leading-[19.2px] font-semibold tracking-[1.8px] text-[#52796a] uppercase">
            Mungkin kamu bertanya
          </p>
          <h2 className="mt-4 font-heading text-[34px] leading-[1.12] font-normal tracking-[-0.9px] text-[#203b33] sm:text-[40px] sm:leading-[44.8px] dark:text-foreground">
            Kenali dulu,
            <br />
            tak perlu terburu-buru.
          </h2>
          <p className="mt-4 max-w-[260px] text-[12px] leading-[22.8px] text-[#59645f] dark:text-muted-foreground">
            Beberapa hal yang bisa membantumu
            <br />
            sebelum mulai bercerita.
          </p>
          <LeafMark className="mt-[32px] -ml-[6px] size-[42px] rotate-[20deg] text-[#9ba889] opacity-90" />
        </div>

        <div className="border-t border-[#e1e7e1] dark:border-border">
          {faqs.map((faq, index) => (
            <details
              key={faq.question}
              open={index === 0}
              className="group border-b border-[#e1e7e1] [&_summary::-webkit-details-marker]:hidden dark:border-border"
            >
              <summary className="flex h-[68px] cursor-pointer items-center justify-between gap-4 text-[14px] leading-[22.4px] font-medium text-[#203b33] dark:text-foreground">
                {faq.question}
                <span className="flex size-[18px] shrink-0 items-center justify-center text-[#6b8066]">
                  <PlusLineIcon className="size-[18px] group-open:hidden" />
                  <XLineIcon className="hidden size-[18px] group-open:block" />
                </span>
              </summary>
              <p className="max-w-[609px] pr-[30px] pb-[22px] text-[14px] leading-[26.6px] text-[#59645f] dark:text-muted-foreground">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-[1200px] px-6 lg:px-0">
        <div className="relative flex flex-col gap-6 overflow-hidden rounded-2xl bg-[#203b33] px-7 py-10 text-white sm:flex-row sm:items-center sm:justify-between lg:gap-[30px] lg:rounded-[16px] lg:px-[48px] lg:py-[42px] dark:bg-primary">
          <div className="max-w-[480px]">
            <p className="text-[12px] leading-[19.2px] font-semibold tracking-[1.8px] text-[#b9cbb6] uppercase">
              Beri dirimu waktu dan ruang
            </p>
            <h2 className="mt-[12px] font-heading text-[28px] leading-[1.12] font-normal tracking-[-0.9px] text-white sm:text-[32px] sm:leading-[35.84px] lg:whitespace-nowrap">
              Langkah kecilmu bisa dimulai hari ini.
            </h2>
            <p className="mt-[9px] text-[12px] leading-[19.2px] text-[#c2cfc4]">
              Kami di sini, saat kamu siap bercerita.
            </p>
          </div>
          <Button
            size="lg"
            variant="secondary"
            className="shrink-0 gap-[22px] bg-white text-[#203b33] hover:bg-[#f5f7f5] dark:bg-white dark:text-[#203b33]"
            asChild
          >
            <Link href="/services">
              Temukan layananmu
              <ArrowRight weight="bold" className="size-[18px]" />
            </Link>
          </Button>
          <div
            aria-hidden
            className="pointer-events-none absolute right-[-20px] bottom-[-270px] hidden size-[330px] rounded-full border border-white/[0.07] lg:block"
          />
        </div>
      </section>
    </div>
  );
}
