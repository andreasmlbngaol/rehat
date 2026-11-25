import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: "Bagaimana REHAT mengumpulkan, menggunakan, dan melindungi data kamu.",
};

const sections = [
  {
    title: "1. Data yang kami kumpulkan",
    body: [
      "Data identitas dan kontak: nama lengkap, alamat email, foto profil, dan nomor telepon jika kamu memberikannya.",
      "Data akun: peran pengguna, status verifikasi email, dan riwayat masuk.",
      "Data pemesanan: layanan yang dipilih, konselor, jadwal, metode konseling, dan status pembayaran.",
      "Data sesi: isi pesan chat, tautan rapat Zoom, dan waktu mulai/selesai sesi.",
      "Data teknis: alamat IP, jenis perangkat, dan log akses yang diperlukan untuk keamanan.",
    ],
  },
  {
    title: "2. Tujuan penggunaan data",
    body: [
      "Menyediakan layanan konseling, termasuk menghubungkan kamu dengan konselor dan membuat sesi chat atau Zoom.",
      "Memproses pembayaran dan mengirim status transaksi.",
      "Mengirim email transaksional seperti verifikasi akun, pemulihan password, dan pengingat sesi.",
      "Menjaga keamanan, mencegah penyalahgunaan, dan memenuhi kewajiban hukum.",
    ],
  },
  {
    title: "3. Dasar hukum",
    body: [
      "Kami memproses data berdasarkan persetujuan kamu saat mendaftar dan menggunakan layanan, pelaksanaan perjanjian layanan, serta kepatuhan terhadap hukum yang berlaku, termasuk Undang-Undang Perlindungan Data Pribadi Indonesia.",
      "Data terkait kesehatan mental dan isi chat merupakan data sensitif. Kami memprosesnya hanya untuk menyelenggarakan sesi konseling yang kamu minta.",
    ],
  },
  {
    title: "4. Pihak ketiga yang memproses data",
    body: [
      "Supabase - basis data, autentikasi, dan Realtime chat.",
      "Vercel - hosting aplikasi.",
      "Midtrans - pemrosesan pembayaran. REHAT tidak menyimpan data kartu atau kredensial pembayaran.",
      "Zoom - pembuatan dan penyelenggaraan sesi video.",
      "Resend - pengiriman email transaksional.",
      "Cloudflare R2 - penyimpanan foto profil.",
      "Google - jika kamu memilih masuk dengan Google, kami menerima nama, email, dan foto profil dari akun Google kamu.",
    ],
  },
  {
    title: "5. Google API Limited Use",
    body: [
      "Penggunaan informasi yang diterima dari Google API oleh REHAT mematuhi Google API Services User Data Policy, termasuk persyaratan Limited Use.",
      "REHAT hanya menggunakan data Google untuk autentikasi dan pembuatan profil akun. Data tersebut tidak dijual, tidak digunakan untuk iklan, dan tidak dibagikan kepada pihak ketiga selain yang diperlukan untuk menyediakan layanan.",
    ],
  },
  {
    title: "6. Penyimpanan dan retensi",
    body: [
      "Data disimpan selama akun aktif dan selama diperlukan untuk menyediakan layanan, memenuhi kewajiban hukum, menyelesaikan sengketa, atau menegakkan perjanjian.",
      "Kamu dapat meminta penghapusan akun dan data terkait. Beberapa data dapat dipertahankan untuk keperluan hukum atau audit.",
    ],
  },
  {
    title: "7. Keamanan",
    body: [
      "Kami menggunakan koneksi terenkripsi, kontrol akses berbasis peran, Row Level Security pada basis data, dan pembatasan akses internal.",
      "Tidak ada sistem yang sepenuhnya bebas risiko. Jika terjadi pelanggaran data yang berdampak pada kamu, kami akan memberi tahu sesuai ketentuan hukum yang berlaku.",
    ],
  },
  {
    title: "8. Hak kamu",
    body: [
      "Mengakses dan memperbarui data profil melalui halaman profil.",
      "Meminta salinan, koreksi, atau penghapusan data pribadi.",
      "Menarik persetujuan dan menutup akun, dengan memahami bahwa layanan yang sedang berjalan mungkin tidak dapat dilanjutkan.",
      "Mengajukan keluhan melalui kontak yang tersedia di halaman Kontak.",
    ],
  },
  {
    title: "9. Cookie",
    body: [
      "REHAT menggunakan cookie yang diperlukan untuk menjaga sesi login dan keamanan. Kami tidak menggunakan cookie iklan.",
      "Menonaktifkan cookie dapat membuat kamu tidak dapat masuk atau menggunakan bagian tertentu dari layanan.",
    ],
  },
  {
    title: "10. Anak dan remaja",
    body: [
      "Layanan ditujukan untuk pengguna berusia 18 tahun ke atas. Pengguna di bawah 18 tahun wajib memperoleh izin orang tua atau wali.",
      "Jika kami mengetahui adanya data anak yang dikumpulkan tanpa izin yang sah, kami akan menghapusnya.",
    ],
  },
  {
    title: "11. Perubahan kebijakan",
    body: [
      "Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan material akan diberitahukan melalui email atau halaman ini.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
        Legal
      </p>
      <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        Kebijakan Privasi
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Terakhir diperbarui: 7 November 2026
      </p>

      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <section key={section.title} className="space-y-3">
            <h2 className="font-heading text-lg font-semibold">
              {section.title}
            </h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-xl border bg-muted/30 p-4 text-sm">
        <p className="font-medium">Pertanyaan tentang privasi?</p>
        <p className="mt-1 text-muted-foreground">
          Hubungi kami di{" "}
          <a
            className="underline underline-offset-2 transition-colors hover:text-primary"
            href="mailto:support@booroong.online"
          >
            support@booroong.online
          </a>{" "}
          atau melalui{" "}
          <Link className="underline underline-offset-2 transition-colors hover:text-primary" href="/contact">
            halaman Kontak
          </Link>
          .
        </p>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Dokumen ini disusun untuk keperluan tugas kelompok dan bukan merupakan
        nasihat hukum. Sebelum digunakan secara komersial, mintalah tinjauan
        hukum.
      </p>
    </div>
  );
}
