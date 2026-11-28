"use client";

import { useMemo, useRef, useState } from "react";
import {
  Clock,
  LockSimple,
  SpinnerGap,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { useSession } from "@/components/providers/session-provider";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  CalendarTrustIcon,
  CheckLineIcon,
  PlusLineIcon,
} from "@/components/ui/figma-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineLoading } from "@/components/ui/loading-state";
import { ListSkeleton } from "@/components/ui/page-skeleton";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { apiFetch, errorMessage, fieldError } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/use-api";
import {
  SLOT_STATUS_LABEL,
  formatDate,
  formatDateInput,
  formatDateTimeInput,
  formatTime,
} from "@/lib/format";
import type {
  Counselor,
  Paginated,
  Service,
  TimeSlot,
} from "@/lib/types/api";

type Mode = "counselor" | "admin";

function wibInputToIso(value: string): string {
  return new Date(`${value}:00+07:00`).toISOString();
}

function slotDuration(slot: TimeSlot): number {
  return Math.round(
    (new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) /
      60_000,
  );
}

function DateField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      <button
        id={id}
        type="button"
        onClick={() => {
          const input = ref.current;
          if (!input) return;
          if (typeof input.showPicker === "function") input.showPicker();
          else input.focus();
        }}
        className="h-11 w-full rounded-[9px] border border-[#c4cec5] bg-white px-3 text-left text-[12px] leading-[19.2px] text-[#203b33] transition-colors hover:bg-[#f5f7f5] dark:border-border dark:bg-card dark:text-foreground"
      >
        {value ? formatDate(`${value}T00:00:00+07:00`) : ""}
      </button>
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  );
}

export function TimeSlotManager({ mode }: { mode: Mode }) {
  const { user } = useSession();
  const [page, setPage] = useState(1);
  const [counselorFilter, setCounselorFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [now] = useState(() => Date.now());

  const services = useApi<Service[]>("/api/v1/services");
  const counselors = useApi<Counselor[]>(
    mode === "admin" ? "/api/v1/admin/counselors" : null,
  );
  const ownProfile = useApi<Counselor>(
    mode === "counselor" && user ? `/api/v1/counselors/${user.id}` : null,
  );

  const listPath = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (mode === "admin" && counselorFilter) {
      params.set("counselorId", counselorFilter);
    }
    const base =
      mode === "admin"
        ? "/api/v1/admin/time-slots"
        : "/api/v1/counselor/time-slots";
    return `${base}?${params.toString()}`;
  }, [mode, page, counselorFilter]);

  const list = useApi<Paginated<TimeSlot>>(listPath);

  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState("");
  const [createTime, setCreateTime] = useState("09:00");
  const [createService, setCreateService] = useState("");
  const [createCounselor, setCreateCounselor] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [editing, setEditing] = useState<TimeSlot | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("09:00");
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<TimeSlot | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const serviceList = services.data ?? [];
  const counselorList = useMemo(
    () => counselors.data ?? [],
    [counselors.data],
  );

  const availableServiceIds = useMemo(() => {
    if (mode === "counselor") {
      return new Set(ownProfile.data?.services.map((item) => item.id) ?? []);
    }
    if (!createCounselor) return new Set<string>();
    const selected = counselorList.find((item) => item.id === createCounselor);
    return new Set(selected?.services.map((item) => item.id) ?? []);
  }, [mode, ownProfile.data, createCounselor, counselorList]);

  const selectableServices = serviceList.filter((service) =>
    availableServiceIds.has(service.id),
  );

  const defaultDate = useMemo(() => {
    const firstUpcoming =
      (list.data?.items ?? []).find(
        (slot) => new Date(slot.startTime).getTime() >= now,
      ) ?? list.data?.items?.[0];
    return firstUpcoming ? formatDateInput(firstUpcoming.startTime) : "";
  }, [list.data, now]);

  const activeDate = dateFilter || defaultDate;

  const visibleSlots = useMemo(() => {
    return (list.data?.items ?? [])
      .filter((slot) => !activeDate || formatDateInput(slot.startTime) === activeDate)
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
  }, [list.data, activeDate]);

  function counselorName(slot: TimeSlot) {
    if (mode === "counselor") return user?.fullName ?? "Konselor";
    return (
      counselorList.find((counselor) => counselor.id === slot.counselorId)
        ?.fullName ?? "Konselor"
    );
  }

  function openCreate() {
    setCreateError(null);
    setCreateDate(formatDateInput(new Date()));
    setCreateTime("09:00");
    setCreateService("");
    setCreateCounselor("");
    setCreateOpen(true);
  }

  async function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      const body: Record<string, unknown> = {
        startTime: wibInputToIso(`${createDate}T${createTime}`),
        serviceId: createService,
      };
      if (mode === "admin") body.counselorId = createCounselor;

      await apiFetch(
        mode === "admin"
          ? "/api/v1/admin/time-slots"
          : "/api/v1/counselor/time-slots",
        { method: "POST", body },
      );

      toast.success("Slot jadwal berhasil dibuat.");
      setCreateOpen(false);
      await list.refetch();
    } catch (cause) {
      setCreateError(
        fieldError(cause, "startTime") ??
          fieldError(cause, "serviceId") ??
          fieldError(cause, "counselorId") ??
          errorMessage(cause),
      );
    } finally {
      setCreating(false);
    }
  }

  function openEdit(slot: TimeSlot) {
    const value = formatDateTimeInput(slot.startTime);
    setEditing(slot);
    setEditDate(value.slice(0, 10));
    setEditTime(value.slice(11, 16));
    setEditError(null);
  }

  async function submitEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    setEditError(null);

    try {
      await apiFetch(
        mode === "admin"
          ? `/api/v1/admin/time-slots/${editing.id}`
          : `/api/v1/counselor/time-slots/${editing.id}`,
        {
          method: "PATCH",
          body: {
            startTime: wibInputToIso(`${editDate}T${editTime}`),
          },
        },
      );

      toast.success("Slot jadwal berhasil diperbarui.");
      setEditing(null);
      await list.refetch();
    } catch (cause) {
      setEditError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);

    try {
      await apiFetch(
        mode === "admin"
          ? `/api/v1/admin/time-slots/${deleting.id}`
          : `/api/v1/counselor/time-slots/${deleting.id}`,
        { method: "DELETE" },
      );
      toast.success("Slot jadwal berhasil dihapus.");
      setDeleting(null);
      await list.refetch();
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-4" aria-busy={list.refreshing}>
      <div className="flex flex-wrap items-center gap-[15px]">
        {mode === "admin" ? (
          <Select
            value={counselorFilter}
            onChange={(event) => {
              setCounselorFilter(event.target.value);
              setPage(1);
            }}
            className="w-[160px]"
            aria-label="Filter konselor"
          >
            <option value="">Semua konselor</option>
            {counselorList.map((counselor) => (
              <option key={counselor.id} value={counselor.id}>
                {counselor.fullName}
              </option>
            ))}
          </Select>
        ) : null}

        <div
          className={
            mode === "admin"
              ? "mx-auto flex items-center gap-2"
              : "flex items-center gap-2"
          }
        >
        <label className="flex items-center gap-[7px] text-[12px] leading-[19.2px] text-[#68746d] dark:text-muted-foreground">
          Tanggal
          <span className="relative inline-flex">
            <button
              type="button"
              onClick={() => {
                const input = dateInputRef.current;
                if (!input) return;
                if (typeof input.showPicker === "function") input.showPicker();
                else input.focus();
              }}
              className="h-11 w-[136px] rounded-[9px] border border-[#c4cec5] bg-white px-3 text-left text-[12px] leading-[19.2px] whitespace-nowrap text-[#203b33] transition-colors hover:bg-[#f5f7f5] dark:border-border dark:bg-card dark:text-foreground"
            >
              {activeDate
                ? formatDate(`${activeDate}T00:00:00+07:00`)
                : ""}
            </button>
            <input
              ref={dateInputRef}
              type="date"
              value={activeDate}
              onChange={(event) => setDateFilter(event.target.value)}
              className="sr-only"
              tabIndex={-1}
              aria-label="Filter tanggal"
            />
          </span>
        </label>

        {dateFilter ? (
          <button
            type="button"
            onClick={() => setDateFilter("")}
            className="h-11 text-[11px] leading-[18px] font-semibold text-[#31594d] hover:underline dark:text-primary"
          >
            Reset
          </button>
        ) : null}
        </div>

        {list.refreshing ? <InlineLoading /> : null}

        <Button
          className={
            mode === "counselor"
              ? "ml-auto h-[43px] gap-5 rounded-[9px] px-5 text-[12px]"
              : "h-[43px] gap-5 rounded-[9px] px-5 text-[12px]"
          }
          onClick={openCreate}
        >
          <PlusLineIcon className="size-[17px]" />
          Tambah slot
        </Button>
      </div>

      {list.loading ? (
        <ListSkeleton
          rows={3}
          rowClassName="h-24"
          showHeader={false}
          showFilter={false}
        />
      ) : list.error ? (
        <EmptyState title="Gagal memuat jadwal" description={list.error} />
      ) : visibleSlots.length === 0 ? (
        <EmptyState
          title="Belum ada slot jadwal"
          description="Tambahkan slot agar pasien dapat memesan sesi."
          action={<Button onClick={openCreate}>Tambah slot</Button>}
          icon={<Clock className="size-8" />}
        />
      ) : (
        <>
          <div className="rounded-[13px] border border-[#e1e7e1] bg-white p-[26px] dark:border-border dark:bg-card">
            <div className="flex items-center justify-between gap-[15px]">
              <p className="text-[16px] leading-[25.6px] font-semibold text-[#203b33] dark:text-foreground">
                Slot konseling
              </p>
              <p className="text-[12px] leading-[19.2px] text-[#68746d] dark:text-muted-foreground">
                Zona waktu WIB
              </p>
            </div>

            <div className="mt-5 divide-y divide-[#e9eee7] dark:divide-border">
              {visibleSlots.map((slot) => {
                const canEdit = slot.status === "available";
                return (
                  <div
                    key={slot.id}
                    className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:gap-[15px]"
                  >
                    <span className="flex size-[46px] shrink-0 items-center justify-center rounded-[9px] bg-[#eff6f2] text-[#52796a] dark:bg-accent dark:text-accent-foreground">
                      <CalendarTrustIcon className="size-[22px]" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] leading-[19.2px] text-[#202725] dark:text-foreground">
                        {formatDate(slot.startTime)} ·{" "}
                        {formatTime(slot.startTime)} WIB
                      </p>
                      <p className="text-[12px] leading-[19.2px] text-[#68746d] dark:text-muted-foreground">
                        {counselorName(slot)} · {slotDuration(slot)} menit
                      </p>
                    </div>

                    <Badge variant="info" className="shrink-0 gap-1.5">
                      <span className="size-1 rounded-full bg-current" />
                      {SLOT_STATUS_LABEL[slot.status]}
                    </Badge>

                    {canEdit ? (
                      <div className="flex shrink-0 items-center gap-[18px]">
                        <button
                          type="button"
                          onClick={() => openEdit(slot)}
                          className="text-[12px] leading-[19.2px] font-medium text-[#31594d] hover:underline dark:text-primary"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(slot)}
                          className="text-[12px] leading-[19.2px] font-medium text-[#b34b4b] hover:underline dark:text-destructive"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <span className="flex shrink-0 items-center gap-1.5 text-[12px] leading-[19.2px] text-[#68746d] dark:text-muted-foreground">
                        <LockSimple className="size-4" />
                        Slot terpesan tidak dapat diubah
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {(list.data?.totalPages ?? 1) > 1 ? (
            <Pagination
              page={list.data?.page ?? 1}
              totalPages={list.data?.totalPages ?? 1}
              total={list.data?.total ?? 0}
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[calc(100%-2rem)] sm:max-w-[540px]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[#e1e7e1] pb-[18px] dark:border-border">
            <DialogTitle className="text-[18px] leading-[28.8px]">
              Tambah slot
            </DialogTitle>
            <DialogClose asChild>
              <button
                type="button"
                aria-label="Tutup"
                className="-mt-1 flex size-11 shrink-0 items-center justify-center rounded-[8px] text-[#59645f] transition-colors hover:bg-[#f5f7f5] dark:text-muted-foreground dark:hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </DialogClose>
          </div>

          <form onSubmit={submitCreate} className="space-y-4">
            {createError ? (
              <Alert variant="destructive">{createError}</Alert>
            ) : null}

            {mode === "admin" ? (
              <div className="space-y-2">
                <Label htmlFor="slot-counselor">Konselor</Label>
                <Select
                  id="slot-counselor"
                  value={createCounselor}
                  onChange={(event) => {
                    setCreateCounselor(event.target.value);
                    setCreateService("");
                  }}
                  className="h-11"
                  required
                >
                  <option value="">Pilih konselor</option>
                  {counselorList.map((counselor) => (
                    <option key={counselor.id} value={counselor.id}>
                      {counselor.fullName}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="slot-date">Tanggal *</Label>
              <DateField
                id="slot-date"
                value={createDate}
                onChange={setCreateDate}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slot-time">Waktu (WIB) *</Label>
              <Input
                id="slot-time"
                type="time"
                value={createTime}
                onChange={(event) => setCreateTime(event.target.value)}
                step={60}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slot-service">Layanan *</Label>
              <Select
                id="slot-service"
                value={createService}
                onChange={(event) => setCreateService(event.target.value)}
                className="h-11"
                required
              >
                <option value="">Pilih layanan</option>
                {selectableServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} · {service.durationMinutes} menit
                  </option>
                ))}
              </Select>
              {mode === "admin" && !createCounselor ? (
                <p className="text-[11px] leading-[18px] text-[#68746d] dark:text-muted-foreground">
                  Pilih konselor terlebih dahulu.
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full gap-[22px]"
              disabled={creating}
            >
              {creating ? <SpinnerGap className="animate-spin" /> : null}
              {creating ? "Menyimpan..." : "Simpan slot"}
              {creating ? null : <CheckLineIcon className="size-[18px]" />}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-[calc(100%-2rem)] sm:max-w-[540px]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[#e1e7e1] pb-[18px] dark:border-border">
            <DialogTitle className="text-[18px] leading-[28.8px]">
              Edit slot
            </DialogTitle>
            <DialogClose asChild>
              <button
                type="button"
                aria-label="Tutup"
                className="-mt-1 flex size-11 shrink-0 items-center justify-center rounded-[8px] text-[#59645f] transition-colors hover:bg-[#f5f7f5] dark:text-muted-foreground dark:hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </DialogClose>
          </div>

          <form onSubmit={submitEdit} className="space-y-4">
            {editError ? <Alert variant="destructive">{editError}</Alert> : null}

            <div className="space-y-2">
              <Label htmlFor="edit-date">Tanggal *</Label>
              <DateField
                id="edit-date"
                value={editDate}
                onChange={setEditDate}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-time">Waktu (WIB) *</Label>
              <Input
                id="edit-time"
                type="time"
                value={editTime}
                onChange={(event) => setEditTime(event.target.value)}
                step={60}
                className="h-11"
                required
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full gap-[22px]"
              disabled={saving}
            >
              {saving ? <SpinnerGap className="animate-spin" /> : null}
              {saving ? "Menyimpan..." : "Simpan slot"}
              {saving ? null : <CheckLineIcon className="size-[18px]" />}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-[calc(100%-2rem)] sm:max-w-[540px]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[#e1e7e1] pb-[18px] dark:border-border">
            <DialogTitle className="text-[18px] leading-[28.8px]">
              Hapus slot kosong?
            </DialogTitle>
            <DialogClose asChild>
              <button
                type="button"
                aria-label="Tutup"
                className="-mt-1 flex size-11 shrink-0 items-center justify-center rounded-[8px] text-[#59645f] transition-colors hover:bg-[#f5f7f5] dark:text-muted-foreground dark:hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </DialogClose>
          </div>

          <p className="text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
            Slot ini tidak akan ditampilkan sebagai waktu tersedia. Slot yang
            sudah dipesan tidak akan terpengaruh.
          </p>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleting(null)}
              disabled={deleteLoading}
            >
              Batal
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleteLoading}
              className="gap-[22px]"
            >
              {deleteLoading ? <SpinnerGap className="animate-spin" /> : null}
              {deleteLoading ? "Menghapus..." : "Ya, lanjutkan"}
              {deleteLoading ? null : (
                <CheckLineIcon className="size-[18px]" />
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
