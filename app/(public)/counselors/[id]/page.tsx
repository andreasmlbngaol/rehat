import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  ArrowLeft,
  ArrowRight,
  SealCheck,
  CalendarBlank,
  ChatTeardropText,
  VideoCamera,
} from "@phosphor-icons/react/dist/ssr";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPublicCounselor } from "@/lib/data/public";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const counselor = await getPublicCounselor(id);

  return {
    title: counselor?.fullName ?? "Konselor",
    description: counselor?.bio ?? undefined,
  };
}

export const instant = false;

export default async function CounselorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const counselor = await getPublicCounselor(id);

  if (!counselor) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/counselors">
          <ArrowLeft />
          Semua konselor
        </Link>
      </Button>

      <Card>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Avatar
              src={counselor.avatarUrl}
              name={counselor.fullName}
              size="xl"
            />
            <div className="min-w-0 flex-1 space-y-2">
              <h1 className="flex items-center gap-2 font-heading text-3xl font-semibold tracking-tight">
                {counselor.fullName}
                <SealCheck className="size-5 text-primary" />
              </h1>
              <p className="text-primary">{counselor.specialization}</p>
              <div className="flex flex-wrap gap-1.5">
                {counselor.services.map((service) => (
                  <Badge key={service.id} variant="secondary">
                    {service.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-heading text-lg font-semibold">Tentang</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {counselor.bio ?? "Profil konselor belum dilengkapi."}
            </p>
          </div>

          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <CalendarBlank className="mt-0.5 size-5 text-primary" />
              <div className="space-y-1">
                <p className="font-medium">Pilih jadwal yang tersedia</p>
                <p className="text-sm text-muted-foreground">
                  Jadwal ditampilkan saat kamu memesan. Slot yang sudah terisi
                  otomatis disembunyikan.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button size="lg" asChild>
              <Link
                href={`/dashboard/bookings/new?counselorId=${counselor.id}${
                  counselor.services[0]
                    ? `&serviceId=${counselor.services[0].id}`
                    : ""
                }`}
              >
                Pesan sesi
                <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/services">Bandingkan layanan</Link>
            </Button>
          </div>

          <div className="grid gap-3 border-t pt-4 text-sm text-muted-foreground sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <ChatTeardropText className="size-4 text-primary" />
              Sesi chat realtime
            </p>
            <p className="flex items-center gap-2">
              <VideoCamera className="size-4 text-primary" />
              Sesi Zoom terjadwal
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Layanan yang ditangani</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {counselor.services.map((service) => (
            <Link
              key={service.id}
              href={`/services/${service.id}`}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
            >
              {service.name}
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
