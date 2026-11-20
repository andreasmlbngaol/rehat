import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CaretDown,
  CaretRight,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import {
  CalendarTrustIcon,
  ChatTrustIcon,
  CheckLineIcon,
  ClockPrepIcon,
  HeartLineIcon,
  InfoCircleIcon,
  LeafLineIcon,
  ShieldCheckPrepIcon,
  VideoPrepIcon,
} from "@/components/ui/figma-icons";

export const metadata: Metadata = {
  title: "Cara Kerja",
  description:
    "Kenali alur konseling REHAT: pilih layanan, atur waktu, lalu mulai bercerita saat kamu siap.",
};

const steps = [
  {
    number: "01",
    icon: LeafLineIcon,
    title: "Pilih ruang yang sesuai.",
    description:
      "Mulai dari kebutuhanmu, bukan dari keharusan untuk punya semua jawaban.",
    points: [
      "Kenali deskripsi layanan, durasi, tarif, dan metode konseling yang tersedia.",
      "Daftar atau masuk sebagai pasien untuk melanjutkan pilihan layananmu.",
      "Baca pengantar dan keahlian konselor, lalu pilih teman cerita yang terasa tepat.",
    ],
    note: "Belum yakin? Kamu bisa melihat-lihat layanan terlebih dahulu, tanpa harus memesan.",
  },
  {
    number: "02",
    icon: CalendarTrustIcon,
    title: "Atur waktu untuk dirimu.",
    description:
      "Pilih cara bercerita dan jadwal yang paling nyaman untuk keseharianmu.",
    points: [
      "Pilih Chat atau Zoom sesuai metode yang tersedia pada layanan.",
      "Tentukan tanggal dan slot kosong. Semua waktu ditampilkan dalam WIB.",
      "Periksa ringkasan layanan, konselor, jadwal, dan harga sebelum konfirmasi serta pembayaran.",
    ],
    note: "Sesi terkonfirmasi setelah pembayaran berhasil. Pembayaran yang belum selesai dapat dilanjutkan dari dashboard.",
  },
  {
    number: "03",
    icon: ChatTrustIcon,
    title: "Hadir, lalu mulai bercerita.",
    description:
      "Tidak perlu menyusun cerita yang sempurna. Hadir dengan apa yang kamu rasakan.",
    points: [
      "Buka Sesi Saya untuk melihat detail dan status sesi yang sudah kamu pesan.",
      "Saat sesi aktif, masuk ke ruang chat atau gabung Zoom sesuai metode pilihanmu.",
      "Setelah sesi selesai, lihat kembali detail sesi dan percakapan chat hanya-baca melalui Riwayat.",
    ],
    note: "Sebelum waktu sesi, detail jadwal tetap tersedia. Ruang sesi baru dapat diakses saat sesi dimulai.",
  },
];

const preparations = [
  {
    icon: ShieldCheckPrepIcon,
    title: "Tempat yang nyaman",
    description:
      "Cari ruang yang tenang dan privat agar kamu leluasa bercerita, tanpa banyak gangguan.",
  },
  {
    icon: VideoPrepIcon,
    title: "Perangkat yang siap",
    description:
      "Siapkan koneksi internet yang stabil. Untuk sesi Zoom, pastikan aplikasi Zoom sudah tersedia.",
  },
  {
    icon: ClockPrepIcon,
    title: "Waktu untuk hadir",
    description:
      "Periksa kembali jadwal dalam WIB. Buka detail sesi beberapa saat sebelum waktu yang dipilih.",
  },
];

const faqs = [
  {
    question: "Apa bedanya sesi Chat dan Zoom?",
    answer:
      "Chat berlangsung melalui percakapan teks di ruang REHAT. Zoom menggunakan percakapan video. Kamu bisa memilih metode yang paling nyaman untukmu.",
  },
  {
    question: "Bagaimana jika pembayaran belum selesai?",
    answer:
      "Buka Ringkasan atau detail sesi di Sesi Saya, lalu pilih Lanjutkan pembayaran. Sesi aktif setelah pembayaran berhasil dikonfirmasi.",
  },
  {
    question: "Apakah saya bisa langsung masuk ke ruang sesi?",
    answer:
      "Ruang chat atau Zoom dapat diakses saat sesi aktif dan pemesanan telah dikonfirmasi. Sebelum itu, detail jadwal tetap tersedia di Sesi Saya.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="bg-[#fdfdfb] dark:bg-background">
      {/* Hero */}
      <section className="bg-[#f6f7f2] pt-7 pb-16 dark:bg-background">
        <div className="mx-auto w-full max-w-[1200px] px-6 lg:px-0">
          <nav className="flex h-11 items-center gap-[10px] text-[12px] leading-[19.2px]">
            <Link
              href="/"
              className="text-[#59645f] transition-colors hover:text-[#203b33]"
            >
              Beranda
            </Link>
            <CaretRight className="size-[13px] text-[#929b96]" />
            <span className="text-[#31594d]">Cara Kerja</span>
          </nav>

          <div className="mt-[30px] flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
            <div className="w-full max-w-[595px]">
              <p className="text-[12px] leading-[19.2px] font-semibold tracking-[1.8px] text-[#52796a] uppercase">
                Cara kerja REHAT
              </p>
              <h1 className="mt-[22px] font-heading text-[44px] leading-[1.03] font-medium tracking-[-1.5px] text-[#203b33] sm:text-[64px] sm:leading-[66.56px] sm:tracking-[-1.8px] dark:text-foreground">
                Langkah kecil,
                <br />
                <span className="italic text-[#65816b]">
                  ruang yang berarti.
                </span>
              </h1>
              <p className="mt-[22px] max-w-[450px] text-[16px] leading-[28.8px] text-[#59645f] dark:text-muted-foreground">
                Kenali alurnya, pilih yang nyaman, lalu mulai bercerita saat
                kamu siap. Kami menemanimu dari langkah pertama.
              </p>
              <div className="mt-[28px] flex flex-wrap items-center gap-3">
                <Button size="lg" className="gap-[22px]" asChild>
                  <Link href="/services">
                    Temukan layananmu
                    <ArrowRight weight="bold" className="size-[18px]" />
                  </Link>
                </Button>
              </div>
              <p className="mt-[20px] flex items-center gap-2 text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                <HeartLineIcon className="size-[17px] shrink-0 text-[#52796a]" />
                Pelan-pelan, dengan caramu sendiri.
              </p>
            </div>

            <div className="w-full max-w-[541px] rounded-[16px] bg-[#e9eee3] px-5 py-[35px] dark:bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/auth-illustration.png"
                alt="Ilustrasi perjalanan kecil menuju ruang aman"
                className="w-full rounded-[12px]"
              />
              <p className="mt-3 text-center font-quote text-[22px] leading-[30.8px] text-[#52694d] italic dark:text-muted-foreground">
                Tidak perlu terburu-buru untuk memulai.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto w-full max-w-[1200px] px-6 py-16 lg:px-0 lg:py-[72px]">
        <div className="max-w-[680px]">
          <p className="text-[12px] leading-[19.2px] font-semibold tracking-[1.8px] text-[#52796a] uppercase">
            Tiga langkah sederhana
          </p>
          <h2 className="mt-4 font-heading text-[34px] leading-[1.12] font-normal tracking-[-0.9px] text-[#203b33] sm:text-[40px] sm:leading-[44.8px] dark:text-foreground">
            Mulai dengan mudah,
            <br />
            jalani dengan nyaman.
          </h2>
          <p className="mt-4 text-[12px] leading-[22.8px] text-[#59645f] dark:text-muted-foreground">
            Dari memilih layanan sampai bertemu konselor, ini yang bisa kamu
            harapkan.
          </p>
        </div>

        <div className="mx-auto mt-10 w-full max-w-[960px]">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative flex gap-[30px] pb-7 last:pb-0"
            >
              {index < steps.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute top-16 left-8 h-[calc(100%-4rem)] w-px bg-[#dce2de]"
                />
              ) : null}
              <div className="relative z-10 flex size-16 shrink-0 items-center justify-center rounded-full bg-[#eff6f2] font-heading text-[18px] leading-none text-[#52796a] dark:bg-accent">
                {step.number}
              </div>

              <article className="flex-1 rounded-[16px] border border-[#e1e7e1] bg-white p-8 dark:border-border dark:bg-card">
                <div className="flex items-start gap-4">
                  <span className="flex size-[50px] shrink-0 items-center justify-center rounded-[12px] bg-[#eff6f2] text-[#52796a] dark:bg-accent dark:text-accent-foreground">
                    <step.icon className="size-[25px]" />
                  </span>
                  <div>
                    <p className="text-[10px] leading-[16px] font-semibold tracking-[1.2px] text-[#52796a] uppercase">
                      Langkah {step.number}
                    </p>
                    <h3 className="mt-[7px] font-heading text-[24px] leading-[1.2] font-medium tracking-[-0.3px] text-[#203b33] sm:text-[28px] sm:leading-[33.6px] dark:text-foreground">
                      {step.title}
                    </h3>
                  </div>
                </div>

                <p className="mt-5 text-[14px] leading-[25.2px] text-[#59645f] dark:text-muted-foreground">
                  {step.description}
                </p>

                <ul className="mt-5 space-y-[10px]">
                  {step.points.map((point) => (
                    <li
                      key={point}
                      className="flex gap-2.5 text-[14px] leading-[25.2px] text-[#344b40] dark:text-muted-foreground"
                    >
                      <CheckLineIcon className="mt-1 size-4 shrink-0 text-[#52796a]" />
                      {point}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-start gap-2.5 rounded-[10px] bg-[#f5f7f2] p-4 text-[12px] leading-[21.6px] text-[#59645f] dark:bg-muted dark:text-muted-foreground">
                  <InfoCircleIcon className="mt-0.5 size-4 shrink-0 text-[#52796a]" />
                  <p>{step.note}</p>
                </div>
              </article>
            </div>
          ))}
        </div>
      </section>

      {/* Preparation */}
      <section className="bg-[#f5f2ec] py-16 dark:bg-card">
        <div className="mx-auto w-full max-w-[1200px] px-6 lg:px-0">
          <div className="max-w-[680px]">
            <p className="text-[12px] leading-[19.2px] font-semibold tracking-[1.8px] text-[#52796a] uppercase">
              Sebelum mulai sesi
            </p>
            <h2 className="mt-4 font-heading text-[34px] leading-[1.12] font-normal tracking-[-0.9px] text-[#203b33] sm:text-[40px] sm:leading-[44px] dark:text-foreground">
              Beri dirimu sedikit ruang.
            </h2>
            <p className="mt-4 text-[12px] leading-[22.8px] text-[#59645f] dark:text-muted-foreground">
              Beberapa persiapan kecil agar kamu bisa hadir dengan lebih nyaman.
            </p>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {preparations.map((item) => (
              <div key={item.title}>
                <span className="flex size-[50px] items-center justify-center rounded-[12px] bg-[#e9e0d4] text-[#756344] dark:bg-accent dark:text-accent-foreground">
                  <item.icon className="size-6" />
                </span>
                <h3 className="mt-5 text-[16px] leading-[26px] font-semibold text-[#203b33] dark:text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-[12px] leading-[22px] text-[#59645f] dark:text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto grid w-full max-w-[1200px] gap-12 px-6 py-16 lg:grid-cols-[511.2px_624.8px] lg:gap-16 lg:px-0 lg:py-[72px]">
        <div>
          <p className="text-[12px] leading-[19.2px] font-semibold tracking-[1.8px] text-[#52796a] uppercase">
            Sebelum melangkah
          </p>
          <h2 className="mt-4 font-heading text-[34px] leading-[1.12] font-normal tracking-[-0.9px] text-[#203b33] sm:text-[40px] sm:leading-[44px] dark:text-foreground">
            Hal kecil yang perlu kamu tahu.
          </h2>
        </div>

        <div className="dark:border-border">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group border-b border-[#e1e7e1] [&_summary::-webkit-details-marker]:hidden dark:border-border"
            >
              <summary className="flex h-[72px] cursor-pointer items-center justify-between gap-4 text-[14px] leading-[22.4px] font-medium text-[#203b33] dark:text-foreground">
                {faq.question}
                <span className="flex size-[18px] shrink-0 items-center justify-center text-[#6b8066]">
                  <CaretDown className="size-[18px] transition-transform group-open:rotate-180" />
                </span>
              </summary>
              <p className="max-w-[600px] pr-10 pb-6 text-[14px] leading-[25.9px] text-[#59645f] dark:text-muted-foreground">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-[1200px] px-6 pb-16 lg:px-0 lg:pb-[22px]">
        <div className="relative flex flex-col gap-6 overflow-hidden rounded-[16px] bg-[#203b33] px-7 py-10 text-white sm:flex-row sm:items-center sm:justify-between lg:px-[48px] lg:py-[42px] dark:bg-primary">
          <div className="max-w-[537px]">
            <p className="text-[12px] leading-[19.2px] font-semibold tracking-[1.8px] text-[#b9cbb6] uppercase">
              Saat kamu siap
            </p>
            <h2 className="mt-3 font-heading text-[28px] leading-[1.12] font-normal tracking-[-0.9px] text-white sm:text-[32px] sm:leading-[35.84px] lg:whitespace-nowrap">
              Langkah pertamamu punya tempat di sini.
            </h2>
            <p className="mt-2 text-[12px] leading-[19.2px] text-[#c2cfc4]">
              Temukan layanan yang sesuai. Sisanya, kita jalani satu per satu.
            </p>
          </div>
          <Button
            variant="secondary"
            className="h-[50px] shrink-0 gap-[22px] bg-white px-6 text-[#203b33] hover:bg-[#f5f7f5] dark:bg-white dark:text-[#203b33]"
            asChild
          >
            <Link href="/services">
              Lihat layanan
              <ArrowRight weight="bold" className="size-[18px]" />
            </Link>
          </Button>
          <div
            aria-hidden
            className="pointer-events-none absolute right-[-20px] bottom-[-270px] hidden size-[330px] rounded-full border border-white/[0.07] lg:block"
          />
        </div>

        <p className="mt-[22px] flex flex-wrap items-center justify-center gap-2 text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
          Sudah siap melanjutkan?
          <Link
            href="/login"
            className="inline-flex items-center gap-1 font-semibold text-[#31594d] transition-colors hover:text-[#203b33] dark:text-primary"
          >
            Masuk ke akunmu
            <ArrowRight weight="bold" className="size-3.5" />
          </Link>
        </p>
      </section>
    </div>
  );
}
