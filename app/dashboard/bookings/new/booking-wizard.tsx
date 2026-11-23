"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarBlank,
  Check,
  LockSimple,
  SpinnerGap,
  X,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingOverlay } from "@/components/ui/loading-state";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
  CalendarTrustIcon,
  ChatTrustIcon,
  CheckLineIcon,
  InfoCircleIcon,
  MethodVideoIcon,
  ShieldCheckLineIcon,
} from "@/components/ui/figma-icons";
import { ServiceArt, serviceArtMeta } from "@/components/service/public-service-card";
import { Skeleton } from "@/components/ui/skeleton";
import { startNavigationProgress } from "@/components/layout/navigation-progress";
import { apiFetch, errorMessage, fieldError } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/use-api";
import {
  formatDate,
  formatDateInput,
  formatRupiah,
  formatTime,
  todayInput,
} from "@/lib/format";
import type {
  Booking,
  CounselingMethod,
  Counselor,
  Service,
  TimeSlot,
} from "@/lib/types/api";

type Step = 1 | 2 | 3 | 4;

const stepLabels: Array<{ step: Step; label: string }> = [
  { step: 1, label: "Konselor" },
  { step: 2, label: "Metode" },
  { step: 3, label: "Jadwal" },
  { step: 4, label: "Ringkasan" },
];

function Stepper({ step }: { step: Step }) {
  return (
    <div className="flex items-center overflow-x-auto pb-1">
      {stepLabels.map((item, index) => {
        const active = item.step === step;
        const done = item.step < step;
        return (
          <div key={item.step} className="flex items-center">
            <div className="flex items-center gap-2.5">
              <span
                className={`flex size-[27px] shrink-0 items-center justify-center rounded-full text-[12px] ${
                  active || done
                    ? "bg-[#203b33] text-white dark:bg-primary dark:text-primary-foreground"
                    : "text-[#929b96] ring-1 ring-[#dce2de] dark:ring-border"
                }`}
              >
                {done ? <Check className="size-3" /> : item.step}
              </span>
              <span
                className={`text-[12px] leading-[20px] font-medium ${
                  active || done
                    ? "text-[#31594d] dark:text-foreground"
                    : "text-[#929b96] dark:text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </div>
            {index < stepLabels.length - 1 ? (
              <span className="mx-3 h-px w-12 bg-[#dce2de] sm:w-16 dark:bg-border" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function BookingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialServiceId = searchParams.get("serviceId") ?? "";
  const initialCounselorId = searchParams.get("counselorId") ?? "";

  const [serviceId, setServiceId] = useState(initialServiceId);
  const [counselorId, setCounselorId] = useState(initialCounselorId);
  const [slotId, setSlotId] = useState("");
  const [method, setMethod] = useState<CounselingMethod | "">("");
  const [selectedDate, setSelectedDate] = useState("");
  const [step, setStep] = useState<Step>(initialCounselorId ? 2 : 1);
  const [submitting, setSubmitting] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKey = useRef("");
  const dateInputRef = useRef<HTMLInputElement>(null);

  const services = useApi<Service[]>("/api/v1/services");
  const counselors = useApi<Counselor[]>(
    serviceId ? `/api/v1/counselors?serviceId=${serviceId}` : null,
  );
  const slots = useApi<TimeSlot[]>(
    counselorId && serviceId
      ? `/api/v1/time-slots?counselorId=${counselorId}&serviceId=${serviceId}`
      : null,
  );

  const service = services.data?.find((item) => item.id === serviceId) ?? null;
  const counselor =
    counselors.data?.find((item) => item.id === counselorId) ?? null;

  const slotsByDate = useMemo(() => {
    const map = new Map<string, TimeSlot[]>();
    for (const slot of slots.data ?? []) {
      const key = formatDateInput(slot.startTime);
      const list = map.get(key) ?? [];
      list.push(slot);
      map.set(key, list);
    }
    return map;
  }, [slots.data]);

  const dates = useMemo(
    () => Array.from(slotsByDate.keys()).sort(),
    [slotsByDate],
  );

  const activeDate = selectedDate || dates[0] || "";
  const activeSlots = slotsByDate.get(activeDate) ?? [];
  const selectedSlot = slots.data?.find((slot) => slot.id === slotId) ?? null;

  function chooseService(id: string) {
    setServiceId(id);
    setCounselorId("");
    setSlotId("");
    setMethod("");
    setSelectedDate("");
    setStep(1);
    setError(null);
  }

  function chooseCounselor(id: string) {
    setCounselorId(id);
    setSlotId("");
    setMethod("");
    setSelectedDate("");
    setStep(2);
  }

  function chooseMethod(value: CounselingMethod) {
    setMethod(value);
    setStep(3);
  }

  function chooseSlot(id: string) {
    setSlotId(id);
    const slot = slots.data?.find((item) => item.id === id);
    if (slot) setSelectedDate(formatDateInput(slot.startTime));
    setStep(4);
  }

  async function submit() {
    if (!service || !counselor || !selectedSlot || !method) return;

    setSubmitting(true);
    setError(null);

    if (!idempotencyKey.current) {
      idempotencyKey.current = crypto.randomUUID();
    }

    try {
      const booking = await apiFetch<Booking>("/api/v1/bookings", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey.current },
        body: {
          timeSlotId: selectedSlot.id,
          serviceId: service.id,
          method,
        },
      });

      toast.success("Pemesanan dibuat. Lanjutkan pembayaran.");
      setSubmitting(false);
      setPaymentBooking(booking);
    } catch (cause) {
      setError(
        fieldError(cause, "timeSlotId") ??
          fieldError(cause, "serviceId") ??
          fieldError(cause, "method") ??
          errorMessage(cause),
      );
      setSubmitting(false);
    }
  }

  if (!serviceId) {
    return (
      <div className="space-y-5">
        <PageHeader
          date={false}
          eyebrow="Pemesanan"
          title="Pilih layanan terlebih dahulu."
          description="Setelah memilih layanan, kamu dapat menentukan konselor, metode, dan jadwal."
        />
        {services.loading ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
        ) : services.error ? (
          <EmptyState title="Gagal memuat layanan" description={services.error} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {services.data?.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => chooseService(item.id)}
                className="rounded-xl border border-[#e1e7e1] bg-white p-5 text-left transition-colors hover:border-[#31594d] dark:border-border dark:bg-card"
              >
                <p className="text-[10px] font-semibold tracking-[1.2px] text-[#52796a] uppercase">
                  Layanan
                </p>
                <p className="mt-1 text-[16px] font-semibold text-[#203b33] dark:text-foreground">
                  {item.name}
                </p>
                <p className="mt-1 line-clamp-2 text-[12px] leading-[19px] text-[#59645f] dark:text-muted-foreground">
                  {item.description}
                </p>
                <div className="mt-3 flex items-center justify-between text-[12px] text-[#68746d]">
                  <span>{item.durationMinutes} menit</span>
                  <span className="font-semibold text-[#203b33] dark:text-foreground">
                    {formatRupiah(item.price)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
        <Link href="/dashboard/services">
          <ArrowLeft />
          Kembali ke layanan
        </Link>
      </Button>

      <PageHeader
        date={false}
        eyebrow="Satu langkah lebih dekat"
        title="Jadwalkan ruang ceritamu."
        description="Kamu bisa meninjau kembali semua pilihan sebelum membayar."
      />

      <Stepper step={step} />

      {error ? <Alert variant="destructive">{error}</Alert> : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_410px]">
        <div className="space-y-4">
          {step === 1 ? (
            <section className="rounded-[16px] border border-[#e1e7e1] bg-white p-8 dark:border-border dark:bg-card">
              <p className="text-[10px] font-semibold tracking-[1.2px] text-[#52796a] uppercase">
                Langkah 01
              </p>
              <h2 className="mt-2 font-heading text-[26px] leading-[1.12] font-normal tracking-[-0.5px] text-[#203b33] dark:text-foreground">
                Kenali teman ceritamu.
              </h2>
              <p className="mt-1.5 text-[12px] leading-[19px] text-[#59645f] dark:text-muted-foreground">
                Konselor yang tersedia untuk {service?.name ?? "layanan ini"}.
              </p>

              <div className="mt-5 space-y-3">
                {counselors.loading ? (
                  <>
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                  </>
                ) : counselors.error ? (
                  <EmptyState title="Gagal memuat konselor" description={counselors.error} />
                ) : (counselors.data?.length ?? 0) === 0 ? (
                  <EmptyState
                    title="Belum ada konselor"
                    description="Layanan ini belum memiliki konselor aktif."
                  />
                ) : (
                  counselors.data?.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-xl border border-[#e1e7e1] p-4 sm:flex-row sm:items-center sm:justify-between dark:border-border"
                    >
                      <div className="flex gap-3">
                        <Avatar src={item.avatarUrl} name={item.fullName} size="lg" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[14px] leading-[22px] font-semibold text-[#203b33] dark:text-foreground">
                              {item.fullName}
                            </p>
                            <Badge variant="success">Aktif</Badge>
                          </div>
                          <p className="text-[11px] text-[#31594d] dark:text-primary">
                            {item.specialization}
                          </p>
                          <p className="mt-1 line-clamp-2 text-[12px] leading-[19px] text-[#59645f] dark:text-muted-foreground">
                            {item.bio}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={counselorId === item.id ? "default" : "outline"}
                        onClick={() => chooseCounselor(item.id)}
                      >
                        {counselorId === item.id ? "Dipilih" : "Pilih"}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="rounded-[16px] border border-[#e1e7e1] bg-white p-8 dark:border-border dark:bg-card">
              <p className="text-[10px] font-semibold tracking-[1.2px] text-[#52796a] uppercase">
                Langkah 02
              </p>
              <h2 className="mt-2 font-heading text-[26px] leading-[1.12] font-normal tracking-[-0.5px] text-[#203b33] dark:text-foreground">
                Pilih cara yang nyaman.
              </h2>
              <div className="mt-6 space-y-3">
                {(service?.methods ?? []).map((value) => {
                  const selected = method === value;
                  const isChat = value === "chat";
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => chooseMethod(value)}
                      className={`relative block w-full rounded-[10px] border p-[23px] text-left transition-colors ${
                        selected
                          ? "border-[#52796a] bg-[#f4f8f1] dark:bg-accent"
                          : "border-[#e1e7e1] bg-white hover:border-[#c4cec5] dark:border-border dark:bg-card"
                      }`}
                    >
                      {selected ? (
                        <span className="absolute top-[23px] right-[23px] flex size-5 items-center justify-center rounded-full bg-[#31594d] text-white">
                          <CheckLineIcon className="size-3" />
                        </span>
                      ) : null}
                      {isChat ? (
                        <ChatTrustIcon className="size-6 text-[#52796a]" />
                      ) : (
                        <MethodVideoIcon className="size-6 text-[#927d5e]" />
                      )}
                      <p className="mt-[10px] text-[14px] leading-[23px] font-semibold text-[#203b33] dark:text-foreground">
                        {isChat ? "Konseling lewat chat" : "Sesi melalui Zoom"}
                      </p>
                      <p className="mt-1 text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                        {isChat
                          ? "Bercerita lewat tulisan di ruang chat REHAT."
                          : "Berbincang tatap muka secara online melalui Zoom."}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="rounded-[16px] border border-[#e1e7e1] bg-white p-8 dark:border-border dark:bg-card">
              <p className="text-[10px] font-semibold tracking-[1.2px] text-[#52796a] uppercase">
                Langkah 03
              </p>
              <h2 className="mt-2 font-heading text-[26px] leading-[1.12] font-normal tracking-[-0.5px] text-[#203b33] dark:text-foreground">
                Sediakan waktu untuk dirimu.
              </h2>
              <div className="mt-5">
                <Label htmlFor="session-date">Tanggal sesi *</Label>
                <div className="relative mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const input = dateInputRef.current;
                      if (!input) return;
                      if (typeof input.showPicker === "function") input.showPicker();
                      else input.focus();
                    }}
                    className="flex h-[50px] w-full items-center justify-between rounded-[9px] border border-[#aab7af] bg-white px-3.5 text-left text-[13px] text-[#203b33] dark:border-input dark:bg-card dark:text-foreground"
                  >
                    {activeDate
                      ? formatDate(`${activeDate}T00:00:00+07:00`)
                      : "Pilih tanggal"}
                    <CalendarTrustIcon className="size-[18px] text-[#68746d]" />
                  </button>
                  <input
                    ref={dateInputRef}
                    id="session-date"
                    type="date"
                    min={todayInput()}
                    value={activeDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="sr-only"
                    tabIndex={-1}
                  />
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <Label>Waktu tersedia (WIB) *</Label>
                {slots.loading ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Skeleton className="h-[60px]" />
                    <Skeleton className="h-[60px]" />
                    <Skeleton className="h-[60px]" />
                    <Skeleton className="h-[60px]" />
                  </div>
                ) : slots.error ? (
                  <EmptyState title="Gagal memuat jadwal" description={slots.error} />
                ) : activeSlots.length === 0 ? (
                  <EmptyState
                    title="Belum ada jadwal tersedia"
                    description="Coba pilih tanggal lain atau kembali lagi nanti."
                    icon={<CalendarBlank className="size-6" />}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {activeSlots.map((slot) => {
                      const selected = slotId === slot.id;
                      const booked = slot.status !== "available";
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={booked}
                          onClick={() => chooseSlot(slot.id)}
                          className={`flex h-[60px] flex-col items-center justify-center rounded-[10px] border text-[13px] transition-colors ${
                            selected
                              ? "border-[#203b33] bg-[#203b33] text-white dark:border-primary dark:bg-primary dark:text-primary-foreground"
                              : booked
                                ? "border-[#e1e7e1] bg-[#f5f7f5] text-[#929b96] dark:border-border dark:bg-muted"
                                : "border-[#e1e7e1] text-[#203b33] hover:border-[#31594d] dark:border-border dark:text-foreground"
                          }`}
                        >
                          <span className="font-medium">
                            {formatTime(slot.startTime)}
                          </span>
                          <span
                            className={`mt-0.5 text-[11px] ${
                              selected
                                ? "text-white/70"
                                : booked
                                  ? "text-[#929b96]"
                                  : "text-[#68746d]"
                            }`}
                          >
                            {booked
                              ? "Terisi"
                              : `${service?.durationMinutes ?? 45} menit`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-[11px] leading-[18px] text-[#68746d] dark:text-muted-foreground">
                  Slot yang terisi tidak dapat dipilih. Semua waktu menggunakan WIB.
                </p>
              </div>
            </section>
          ) : null}

          {step === 4 && service && counselor && selectedSlot ? (
            <section className="rounded-[16px] border border-[#e1e7e1] bg-white p-8 dark:border-border dark:bg-card">
              <p className="text-[10px] font-semibold tracking-[1.2px] text-[#52796a] uppercase">
                Langkah 04
              </p>
              <h2 className="mt-2 font-heading text-[26px] leading-[1.12] font-normal tracking-[-0.5px] text-[#203b33] dark:text-foreground">
                Sudah sesuai denganmu?
              </h2>
              <div className="mt-4 flex items-start gap-3 rounded-[10px] bg-[#eff6f2] px-4 py-4 text-[12px] leading-[19.2px] text-[#31594d] dark:bg-accent dark:text-accent-foreground">
                <ShieldCheckLineIcon className="mt-0.5 size-4 shrink-0" />
                Periksa pilihanmu. Setelah konfirmasi, lanjutkan ke pembayaran
                untuk mengonfirmasi sesi.
              </div>

              <dl className="mt-4 divide-y divide-[#e9eee7] text-[12px] dark:divide-border">
                {[
                  ["Layanan", service.name],
                  ["Konselor", counselor.fullName],
                  ["Metode", method === "chat" ? "Chat" : "Zoom"],
                  [
                    "Jadwal",
                    `${formatDate(selectedSlot.startTime)}, ${formatTime(selectedSlot.startTime)} WIB`,
                  ],
                  ["Durasi", `${service.durationMinutes} menit`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4 py-3">
                    <dt className="text-[#68746d] dark:text-muted-foreground">{label}</dt>
                    <dd className="text-right font-medium text-[#203b33] dark:text-foreground">
                      {value}
                    </dd>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-4 py-4">
                  <dt className="text-[12px] text-[#68746d] dark:text-muted-foreground">
                    Total pembayaran
                  </dt>
                  <dd className="text-[16px] leading-[26px] font-semibold text-[#203b33] dark:text-foreground">
                    {formatRupiah(service.price)}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-col gap-2 border-t border-[#e1e7e1] pt-5 sm:flex-row sm:justify-between dark:border-border">
                <Button variant="outline" size="lg" onClick={() => setStep(3)}>
                  Kembali
                </Button>
                <Button size="lg" disabled={submitting} onClick={submit}>
                  {submitting ? <SpinnerGap className="animate-spin" /> : null}
                  {submitting ? "Membuat pemesanan..." : "Konfirmasi & bayar"}
                  {submitting ? null : <ArrowRight />}
                </Button>
              </div>
            </section>
          ) : null}

          {step < 4 ? (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setStep((step - 1) as Step)}
                disabled={step === 1}
              >
                Kembali
              </Button>
              {step === 1 ? (
                <Button onClick={() => setStep(2)} disabled={!counselorId}>
                  Lanjutkan
                  <ArrowRight />
                </Button>
              ) : step === 2 ? (
                <Button onClick={() => setStep(3)} disabled={!method}>
                  Lanjutkan
                  <ArrowRight />
                </Button>
              ) : (
                <Button onClick={() => setStep(4)} disabled={!slotId}>
                  Lanjutkan
                  <ArrowRight />
                </Button>
              )}
            </div>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-[100px] lg:self-start">
          <div className="overflow-hidden rounded-[13px] border border-[#e1e7e1] bg-white p-[22px] dark:border-border dark:bg-card">
            {service ? (
              <div className="mb-5">
                <ServiceArt {...serviceArtMeta(service.name)} compact />
              </div>
            ) : null}
            <h2 className="text-[16px] leading-[26px] font-semibold text-[#203b33] dark:text-foreground">
              {service?.name ?? "Pilih layanan"}
            </h2>
            {service ? (
              <p className="mt-1 text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                {service.description}
              </p>
            ) : null}

            <div className="mt-5 border-t border-[#e1e7e1] text-[12px] dark:border-border">
              <div className="flex justify-between gap-4 py-3">
                <span className="text-[#68746d] dark:text-muted-foreground">Durasi</span>
                <span className="font-medium text-[#203b33] dark:text-foreground">
                  {service ? `${service.durationMinutes} menit` : "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-t border-[#e1e7e1] py-3 dark:border-border">
                <span className="text-[#68746d] dark:text-muted-foreground">Metode</span>
                <span className="font-medium text-[#203b33] dark:text-foreground">
                  {method === "chat" ? "Chat" : method === "zoom" ? "Zoom" : "Belum dipilih"}
                </span>
              </div>
              {selectedSlot ? (
                <div className="flex justify-between gap-4 border-t border-[#e1e7e1] py-3 dark:border-border">
                  <span className="text-[#68746d] dark:text-muted-foreground">Jadwal</span>
                  <span className="text-right font-medium text-[#203b33] dark:text-foreground">
                    {formatDate(selectedSlot.startTime)}
                    <br />
                    {formatTime(selectedSlot.startTime)} WIB
                  </span>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between border-t border-[#e1e7e1] py-4 dark:border-border">
              <span className="text-[12px] text-[#68746d] dark:text-muted-foreground">
                Per sesi
              </span>
              <span className="text-[16px] font-semibold text-[#203b33] dark:text-foreground">
                {service ? formatRupiah(service.price) : "-"}
              </span>
            </div>

            <p className="mt-1 flex items-center gap-1.5 text-[11px] leading-[18px] text-[#68746d] dark:text-muted-foreground">
              <LockSimple className="size-3.5" />
              Pilihanmu tersimpan selama alur ini terbuka.
            </p>
          </div>
        </aside>
      </div>

      <Dialog
        open={Boolean(paymentBooking)}
        onOpenChange={(open) => {
          if (open) return;
          setPaymentBooking(null);
          router.push("/dashboard/bookings");
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-[540px] gap-0 rounded-[16px] p-[30px] sm:max-w-[540px]"
        >
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-[20px] leading-[30px] font-semibold text-[#203b33] dark:text-foreground">
              Pembayaran sesi
            </DialogTitle>
            <DialogClose asChild>
              <button
                type="button"
                aria-label="Tutup"
                className="text-[#68746d] transition-colors hover:text-[#203b33] dark:text-muted-foreground"
              >
                <X className="size-5" />
              </button>
            </DialogClose>
          </div>

          <div className="mt-4 border-t border-[#e1e7e1] pt-5 dark:border-border">
            <div className="flex items-center gap-2 text-[#31594d] dark:text-primary">
              <LockSimple className="size-4" />
              <span className="text-[20px] leading-[28px] font-bold tracking-[-0.4px] text-[#203b33] dark:text-foreground">
                midtrans
                <span className="font-normal text-[#68746d] dark:text-muted-foreground">
                  snap
                </span>
              </span>
            </div>
            <p className="mt-3 text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
              Periksa rincian tagihan sebelum mengonfirmasi pembayaran sesi.
            </p>

            <div className="mt-4 rounded-[10px] bg-[#eff6f2] p-5 dark:bg-accent">
              <p className="text-[11px] leading-[18px] text-[#59645f] dark:text-muted-foreground">
                {paymentBooking?.bookingCode} · {paymentBooking?.serviceName}
              </p>
              <p className="mt-1 text-[30px] leading-[1.2] font-semibold text-[#203b33] dark:text-foreground">
                {paymentBooking ? formatRupiah(paymentBooking.price) : "-"}
              </p>
              <p className="mt-1 text-[11px] leading-[18px] text-[#59645f] dark:text-muted-foreground">
                Durasi {paymentBooking?.durationMinutes} menit ·{" "}
                {paymentBooking?.method === "chat" ? "Chat" : "Zoom"}
              </p>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-[10px] bg-[#eff6f2] px-4 py-3 text-[11px] leading-[18px] text-[#59645f] dark:bg-accent dark:text-muted-foreground">
              <InfoCircleIcon className="mt-0.5 size-4 shrink-0 text-[#31594d] dark:text-primary" />
              Menutup modal tidak membatalkan pesanan. Kamu dapat melanjutkan
              pembayaran dari dashboard.
            </div>

            <Button
              size="lg"
              className="mt-5 w-full gap-[22px]"
              onClick={() => {
                if (!paymentBooking) return;
                startNavigationProgress(
                  `/dashboard/bookings/${paymentBooking.id}/payment`,
                );
                router.push(`/dashboard/bookings/${paymentBooking.id}/payment`);
              }}
            >
              Konfirmasi pembayaran
              <ArrowRight />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {submitting ? (
        <LoadingOverlay label="Membuat pemesanan..." />
      ) : null}
    </div>
  );
}
