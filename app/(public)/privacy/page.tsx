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
      "Data identitas dan kontak: nama lengkap, alamat email, dan foto profil.",
      "Data akun: peran pengguna, status verifikasi email, dan waktu masuk terakhir.",
      "Data pemesanan: layanan yang dipilih, konselor, jadwal, metode konseling, dan status pembayaran.",
      "Data sesi: isi pesan chat, tautan rapat Zoom, dan waktu mulai serta selesai sesi.",
      "Data konselor: bidang keahlian dan deskripsi profesional yang tampil di profil publik.",
      "Data teknis: alamat IP dan log akses yang diperlukan untuk keamanan.",
    ],
  },
  {
    title: "2. Tujuan penggunaan data",
    body: [
      "Menyediakan layanan konseling, termasuk menghubungkan kamu dengan konselor dan membuat sesi chat atau Zoom.",
      "Memproses pembayaran dan mengirim status transaksi.",
      "Mengirim email transaksional: verifikasi akun, pemulihan password, undangan konselor, konfirmasi perubahan email, dan tautan masuk.",
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
      "Supabase: basis data, autentikasi, dan Realtime chat.",
      "Vercel: hosting aplikasi dan log server.",
      "Midtrans: pemrosesan pembayaran. REHAT tidak menyimpan data kartu atau kredensial pembayaran.",
      "Zoom: pembuatan dan penyelenggaraan sesi video.",
      "Resend: pengiriman email transaksional.",
      "Cloudflare R2: penyimpanan foto profil.",
      "Google: jika kamu memilih masuk dengan Google, kami menerima nama, email, dan foto profil dari akun Google kamu.",
      "Data yang dikirim ke penyedia di atas dibatasi pada yang diperlukan untuk fungsinya.",
    ],
  },
  {
    title: "5. Transfer data ke luar Indonesia",
    body: [
      "Penyedia pada bagian 4 menyimpan dan memproses data di luar Indonesia, mengikuti lokasi pusat data masing-masing.",
      "Kami memilih penyedia yang menerapkan standar perlindungan data dan hanya mengirimkan data yang diperlukan. Dengan menggunakan layanan, kamu memahami bahwa data dapat diproses di luar Indonesia.",
    ],
  },
  {
    title: "6. Google API Limited Use",
    body: [
      "Penggunaan informasi yang diterima dari Google API oleh REHAT mematuhi Google API Services User Data Policy, termasuk persyaratan Limited Use.",
      "REHAT hanya menggunakan data Google untuk autentikasi dan pembuatan profil akun. Data tersebut tidak dijual, tidak digunakan untuk iklan, dan tidak dibagikan kepada pihak ketiga selain yang diperlukan untuk menyediakan layanan.",
    ],
  },
  {
    title: "7. Penyimpanan dan retensi",
    body: [
      "Data akun dan profil disimpan selama akun aktif.",
      "Data pemesanan, pembayaran, dan sesi disimpan selama akun aktif dan selama diperlukan untuk kewajiban pembukuan atau penyelesaian sengketa.",
      "Log akses disimpan maksimal 30 hari.",
      "Setelah akun dihapus, data profil dan isi chat dihapus, kecuali data transaksi yang wajib disimpan menurut hukum.",
    ],
  },
  {
    title: "8. Keamanan",
    body: [
      "Kami menggunakan koneksi terenkripsi, kontrol akses berbasis peran, Row Level Security pada basis data, dan pembatasan akses internal.",
      "Tidak ada sistem yang sepenuhnya bebas risiko. Jika terjadi pelanggaran data yang berdampak pada kamu, kami akan memberi tahu sesuai ketentuan hukum yang berlaku.",
    ],
  },
  {
    title: "9. Hak kamu",
    body: [
      "Mengakses dan memperbarui data profil melalui halaman profil.",
      "Meminta salinan, koreksi, atau penghapusan data pribadi.",
      "Menarik persetujuan dan menutup akun. Layanan yang sedang berjalan mungkin tidak dapat dilanjutkan.",
      "Mengajukan keberatan atas pemrosesan data tertentu.",
      "Mengadu ke lembaga pengawas perlindungan data pribadi jika kamu menilai pemrosesan kami melanggar hukum.",
      "Permintaan dan keluhan dikirim ke lgandre45@gmail.com.",
    ],
  },
  {
    title: "10. Cookie",
    body: [
      "REHAT menggunakan cookie yang diperlukan untuk menjaga sesi login dan keamanan. Kami tidak menggunakan cookie iklan.",
      "Menonaktifkan cookie dapat membuat kamu tidak dapat masuk atau menggunakan bagian tertentu dari layanan.",
    ],
  },
  {
    title: "11. Anak dan remaja",
    body: [
      "Layanan ditujukan untuk pengguna berusia 18 tahun ke atas. Pengguna di bawah 18 tahun wajib memperoleh izin orang tua atau wali.",
      "Jika kami mengetahui adanya data anak yang dikumpulkan tanpa izin yang sah, kami akan menghapusnya.",
    ],
  },
  {
    title: "12. Pengendali data",
    body: [
      "Pengendali data pribadi untuk layanan ini adalah tim REHAT.",
      "Kontak: lgandre45@gmail.com.",
    ],
  },
  {
    title: "13. Perubahan kebijakan",
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
        Terakhir diperbarui: 28 November 2026
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
            href="mailto:lgandre45@gmail.com"
          >
            lgandre45@gmail.com
          </a>{" "}
          atau melalui{" "}
          <Link className="underline underline-offset-2 transition-colors hover:text-primary" href="/contact">
            halaman Kontak
          </Link>
          .
        </p>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Dokumen ini berlaku sejak tanggal pembaruan di atas. Versi terbaru
        selalu tersedia di halaman ini.
      </p>
    </div>
  );
}
