import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  ChatTeardropText,
  VideoCamera,
} from "@phosphor-icons/react/dist/ssr";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatRupiah } from "@/lib/format";
import { getPublicCounselors, getPublicService } from "@/lib/data/public";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const service = await getPublicService(id);

  return {
    title: service?.name ?? "Layanan",
    description: service?.description,
  };
}

export const instant = false;

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const [service, counselors] = await Promise.all([
    getPublicService(id),
    getPublicCounselors(id),
  ]);

  if (!service) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/services">
          <ArrowLeft />
          Semua layanan
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {service.methods.map((method) => (
                <Badge key={method} variant="secondary" className="gap-1">
                  {method === "chat" ? (
                    <ChatTeardropText className="size-3" />
                  ) : (
                    <VideoCamera className="size-3" />
                  )}
                  {method === "chat" ? "Chat" : "Zoom"}
                </Badge>
              ))}
              <Badge variant="outline" className="gap-1">
                <Clock className="size-3" />
                {service.durationMinutes} menit
              </Badge>
            </div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {service.name}
            </h1>
            <p className="text-muted-foreground">{service.description}</p>
          </div>

          <Card>
            <CardContent className="space-y-3">
              <p className="font-medium">Yang kamu dapatkan</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Sesi bersama konselor terverifikasi",
                  "Ruang chat yang aman atau tautan Zoom pribadi",
                  "Ringkasan jadwal dan status sesi yang jelas",
                  "Pembayaran aman melalui Midtrans",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 size-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h2 className="font-heading text-xl font-semibold">
              Konselor untuk layanan ini
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {counselors.map((counselor) => (
                <Card key={counselor.id}>
                  <CardContent className="flex items-center gap-3">
                    <Avatar
                      src={counselor.avatarUrl}
                      name={counselor.fullName}
                      size="lg"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{counselor.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {counselor.specialization}
                      </p>
                      <Button variant="link" size="xs" className="px-0" asChild>
                        <Link href={`/counselors/${counselor.id}`}>
                          Lihat profil
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Harga sesi</p>
                <p className="font-heading text-3xl font-semibold">
                  {formatRupiah(service.price)}
                </p>
              </div>
              <div className="space-y-2 border-t pt-4 text-sm text-muted-foreground">
                <p className="flex justify-between gap-4">
                  <span>Durasi</span>
                  <span className="font-medium text-foreground">
                    {service.durationMinutes} menit
                  </span>
                </p>
                <p className="flex justify-between gap-4">
                  <span>Metode</span>
                  <span className="font-medium text-foreground">
                    {service.methods
                      .map((method) => (method === "chat" ? "Chat" : "Zoom"))
                      .join(" / ")}
                  </span>
                </p>
              </div>
              <Button className="w-full" size="lg" asChild>
                <Link
                  href={`/dashboard/bookings/new?serviceId=${service.id}`}
                >
                  Pesan layanan ini
                  <ArrowRight />
                </Link>
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Kamu akan diminta masuk terlebih dahulu.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
