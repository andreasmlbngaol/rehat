import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description: "Ketentuan penggunaan layanan konseling daring REHAT.",
};

const sections = [
  {
    title: "1. Tentang layanan",
    body: [
      "REHAT adalah platform yang menghubungkan pengguna dengan konselor profesional untuk sesi konseling daring melalui chat atau Zoom.",
      "REHAT bukan penyedia layanan medis darurat, diagnosis, atau pengganti perawatan psikiatri. Untuk kondisi darurat, hubungi 119 atau layanan kesehatan terdekat.",
    ],
  },
  {
    title: "2. Akun pengguna",
    body: [
      "Kamu wajib memberikan informasi yang benar dan menjaga kerahasiaan kredensial akun.",
      "Kamu bertanggung jawab atas seluruh aktivitas yang terjadi melalui akunmu.",
      "Akun dapat dinonaktifkan jika melanggar ketentuan ini atau digunakan untuk aktivitas yang merugikan.",
    ],
  },
  {
    title: "3. Pemesanan dan pembayaran",
    body: [
      "Pemesanan dianggap sah setelah pembayaran berhasil dikonfirmasi. Slot yang belum dibayar dalam batas waktu akan dilepas kembali.",
      "Harga, durasi, dan metode layanan ditampilkan sebelum pembayaran. Pembayaran diproses oleh Midtrans.",
      "Kami tidak menyimpan data kartu atau kredensial pembayaran.",
    ],
  },
  {
    title: "4. Pembatalan dan pengembalian dana",
    body: [
      "Pembatalan belum tersedia langsung di aplikasi. Ajukan pembatalan melalui email ke support@booroong.online sebelum jadwal sesi dimulai.",
      "Tim REHAT akan mengonfirmasi status pembatalan dan jumlah pengembalian dana melalui email yang sama.",
      "Jika sesi dibatalkan oleh konselor atau gagal karena gangguan teknis dari pihak REHAT, kamu berhak atas penjadwalan ulang atau pengembalian dana penuh.",
      "Biaya layanan pihak ketiga yang sudah terpakai dapat tidak dikembalikan.",
    ],
  },
  {
    title: "5. Perilaku pengguna",
    body: [
      "Dilarang menggunakan layanan untuk mengancam, melecehkan, menyebarkan kebencian, atau melakukan tindakan melanggar hukum.",
      "Dilarang merekam, menyebarkan, atau menyalahgunakan isi sesi tanpa persetujuan pihak lain.",
      "Kami dapat menangguhkan akun yang melanggar ketentuan ini.",
    ],
  },
  {
    title: "6. Batasan tanggung jawab",
    body: [
      "Konselor bertanggung jawab atas proses konseling sesuai kompetensinya. REHAT menyediakan platform dan tidak menjamin hasil tertentu dari sesi.",
      "REHAT tidak bertanggung jawab atas gangguan yang disebabkan oleh jaringan, perangkat pengguna, atau layanan pihak ketiga di luar kendali kami.",
    ],
  },
  {
    title: "7. Kekayaan intelektual",
    body: [
      "Merek, logo, dan materi REHAT dilindungi hukum. Kamu tidak boleh menyalin atau menggunakannya tanpa izin.",
      "Isi chat tetap milik pengguna dan konselor yang bersangkutan, dengan akses terbatas untuk keperluan operasional dan keamanan.",
    ],
  },
  {
    title: "8. Privasi",
    body: [
      "Penggunaan data diatur dalam Kebijakan Privasi yang merupakan bagian tidak terpisahkan dari ketentuan ini.",
    ],
  },
  {
    title: "9. Perubahan ketentuan",
    body: [
      "Kami dapat memperbarui ketentuan ini. Perubahan material akan diberitahukan melalui email atau halaman ini.",
      "Dengan terus menggunakan layanan setelah perubahan berlaku, kamu dianggap menyetujui ketentuan yang diperbarui.",
    ],
  },
  {
    title: "10. Hukum yang berlaku",
    body: [
      "Ketentuan ini tunduk pada hukum Republik Indonesia. Sengketa diselesaikan secara musyawarah terlebih dahulu.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
        Legal
      </p>
      <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        Syarat &amp; Ketentuan
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
        <p className="font-medium">Butuh bantuan?</p>
        <p className="mt-1 text-muted-foreground">
          Hubungi{" "}
          <a
            className="underline underline-offset-2 transition-colors hover:text-primary"
            href="mailto:support@booroong.online"
          >
            support@booroong.online
          </a>{" "}
          atau kunjungi{" "}
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
