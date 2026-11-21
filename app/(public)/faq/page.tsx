import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pertanyaan Umum",
  description: "Jawaban atas pertanyaan yang sering diajukan tentang REHAT.",
};

const faqs = [
  {
    question: "Apa itu REHAT?",
    answer:
      "REHAT adalah platform konseling daring yang menghubungkan kamu dengan konselor profesional melalui chat atau Zoom. Kamu dapat memilih layanan, konselor, dan jadwal yang tersedia.",
  },
  {
    question: "Apakah REHAT menggantikan psikolog atau psikiater?",
    answer:
      "Tidak. REHAT menyediakan ruang konseling, bukan diagnosis medis atau resep obat. Untuk kondisi yang memerlukan penanganan klinis, tetap konsultasikan dengan psikolog atau psikiater.",
  },
  {
    question: "Bagaimana cara memesan sesi?",
    answer:
      "Pilih layanan, pilih konselor, tentukan slot jadwal dan metode, lalu selesaikan pembayaran. Setelah pembayaran berhasil, sesi akan muncul di dashboard.",
  },
  {
    question: "Metode pembayaran apa yang tersedia?",
    answer:
      "Pembayaran diproses melalui Midtrans dan mendukung berbagai metode yang tersedia di halaman pembayaran, seperti transfer bank, e-wallet, dan kartu.",
  },
  {
    question: "Apakah isi chat saya rahasia?",
    answer:
      "Isi chat hanya dapat diakses oleh kamu, konselor yang menangani sesi, dan administrator untuk keperluan operasional. Kami tidak menjual atau menggunakan isi chat untuk iklan.",
  },
  {
    question: "Bagaimana jika saya perlu membatalkan atau mengubah jadwal?",
    answer:
      "Hubungi kami melalui halaman Kontak. Kebijakan pembatalan dan pengembalian dana mengikuti Syarat & Ketentuan yang berlaku.",
  },
  {
    question: "Apakah REHAT layanan darurat?",
    answer:
      "Bukan. Jika kamu dalam bahaya atau membutuhkan bantuan segera, hubungi 119 atau layanan kesehatan terdekat.",
  },
  {
    question: "Apakah akun saya bisa dinonaktifkan?",
    answer:
      "Akun dapat dinonaktifkan jika melanggar Syarat & Ketentuan, disalahgunakan, atau atas permintaan pemilik akun. Administrator dapat mengaktifkan kembali sesuai kebijakan.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
        Bantuan
      </p>
      <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        Pertanyaan umum
      </h1>
      <p className="mt-3 text-muted-foreground">
        Belum menemukan jawaban? Hubungi kami melalui halaman kontak.
      </p>

      <div className="mt-8 divide-y rounded-xl border">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="group p-4 transition-colors hover:bg-muted/40"
          >
            <summary className="cursor-pointer list-none font-medium marker:hidden">
              <span className="flex items-center justify-between gap-4">
                {faq.question}
                <span className="text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3 rounded-xl bg-muted/40 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Masih ada pertanyaan?</p>
          <p className="text-sm text-muted-foreground">
            Tim kami siap membantu pada hari kerja.
          </p>
        </div>
        <Button asChild>
          <Link href="/contact">Hubungi kami</Link>
        </Button>
      </div>
    </div>
  );
}
