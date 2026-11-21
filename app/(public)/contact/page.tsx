import type { Metadata } from "next";
import { Clock, EnvelopeSimple, ChatTeardropText, Phone } from "@phosphor-icons/react/dist/ssr";
import { Alert } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Kontak",
  description: "Hubungi tim REHAT untuk bantuan akun, jadwal, atau pembayaran.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
        Bantuan
      </p>
      <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        Hubungi REHAT
      </h1>
      <p className="mt-3 text-muted-foreground">
        Kami membantu untuk pertanyaan seputar akun, jadwal, pembayaran, dan
        kendala teknis.
      </p>

      <Alert variant="warning" className="mt-6">
        <strong>Bukan layanan darurat.</strong> Jika kamu dalam bahaya atau
        membutuhkan bantuan segera, hubungi{" "}
        <a
          className="font-medium underline transition-colors hover:text-primary"
          href="tel:119"
        >
          119
        </a>{" "}
        atau layanan kesehatan terdekat.
      </Alert>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <EnvelopeSimple className="size-4 text-primary" />
              Email
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <a
              className="font-medium text-foreground underline underline-offset-2 transition-colors hover:text-primary"
              href="mailto:support@booroong.online"
            >
              support@booroong.online
            </a>
            <p className="mt-1">Balasan dalam 1×24 jam pada hari kerja.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              Jam operasional
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Senin–Jumat, 09.00–17.00 WIB</p>
            <p className="mt-1">Sabtu, 09.00–12.00 WIB</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChatTeardropText className="size-4 text-primary" />
              Kendala sesi
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              Sertakan kode pemesanan dan waktu sesi agar kami dapat memeriksa
              lebih cepat.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="size-4 text-primary" />
              Darurat
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              Hubungi{" "}
              <a className="font-medium text-foreground underline transition-colors hover:text-primary" href="tel:119">
                119
              </a>{" "}
              atau datang ke fasilitas kesehatan terdekat.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 rounded-xl border p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Alamat</p>
        <p className="mt-1">
          REHAT - proyek tugas kelompok
          <br />
          Indonesia
        </p>
      </div>
    </div>
  );
}
