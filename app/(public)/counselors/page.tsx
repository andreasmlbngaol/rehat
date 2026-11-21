import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, SealCheck } from "@phosphor-icons/react/dist/ssr";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPublicCounselors, getPublicServices } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Konselor",
  description: "Kenali konselor REHAT dan pilih yang paling cocok untukmu.",
};

export const instant = false;

export default async function CounselorsPage({
  searchParams,
}: {
  searchParams: Promise<{ serviceId?: string }>;
}) {
  await connection();
  const { serviceId } = await searchParams;
  const [counselors, services] = await Promise.all([
    getPublicCounselors(serviceId),
    getPublicServices(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
          Konselor
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Kenali pendampingmu
        </h1>
        <p className="text-muted-foreground">
          Semua konselor REHAT telah melalui verifikasi. Pilih berdasarkan bidang
          keahlian dan layanan yang tersedia.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          variant={!serviceId ? "default" : "outline"}
          size="sm"
          asChild
        >
          <Link href="/counselors">Semua layanan</Link>
        </Button>
        {services.map((service) => (
          <Button
            key={service.id}
            variant={serviceId === service.id ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`/counselors?serviceId=${service.id}`}>
              {service.name}
            </Link>
          </Button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {counselors.map((counselor) => (
          <Card key={counselor.id}>
            <CardHeader className="flex-row items-start gap-4">
              <Avatar
                src={counselor.avatarUrl}
                name={counselor.fullName}
                size="xl"
              />
              <div className="min-w-0 flex-1">
                <CardTitle className="flex items-center gap-1.5">
                  {counselor.fullName}
                  <SealCheck className="size-4 text-primary" />
                </CardTitle>
                <CardDescription className="mt-1 text-primary">
                  {counselor.specialization}
                </CardDescription>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {counselor.services.map((service) => (
                    <Badge key={service.id} variant="secondary">
                      {service.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="line-clamp-3 text-sm text-muted-foreground">
                {counselor.bio}
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/counselors/${counselor.id}`}>
                  Lihat profil
                  <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {counselors.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Belum ada konselor untuk layanan ini.
        </p>
      ) : null}
    </div>
  );
}
