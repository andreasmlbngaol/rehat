"use client";

import { useMemo, useState } from "react";
import {
  MagnifyingGlass,
  SpinnerGap,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { ArrowRight } from "@phosphor-icons/react";
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
import {
  CheckLineIcon,
  PlusLineIcon,
} from "@/components/ui/figma-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineLoading } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/page-skeleton";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, errorMessage, fieldError } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/use-api";
import type { Counselor, Service } from "@/lib/types/api";

type FormState = {
  fullName: string;
  email: string;
  specialization: string;
  bio: string;
  serviceIds: string[];
  isActive: boolean;
};

const emptyForm: FormState = {
  fullName: "",
  email: "",
  specialization: "",
  bio: "",
  serviceIds: [],
  isActive: true,
};

export function CounselorsManager() {
  const list = useApi<Counselor[]>("/api/v1/admin/counselors");
  const services = useApi<Service[]>("/api/v1/services");

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Counselor | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return list.data ?? [];
    return (list.data ?? []).filter((counselor) => {
      return (
        counselor.fullName.toLowerCase().includes(query) ||
        (counselor.specialization ?? "").toLowerCase().includes(query) ||
        counselor.services.some((service) =>
          service.name.toLowerCase().includes(query),
        )
      );
    });
  }, [list.data, search]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  }

  function openEdit(counselor: Counselor) {
    setEditing(counselor);
    setForm({
      fullName: counselor.fullName,
      email: counselor.email ?? "",
      specialization: counselor.specialization ?? "",
      bio: counselor.bio ?? "",
      serviceIds: counselor.services.map((service) => service.id),
      isActive: counselor.isActive ?? true,
    });
    setError(null);
    setOpen(true);
  }

  function toggleService(id: string) {
    setForm((current) => ({
      ...current,
      serviceIds: current.serviceIds.includes(id)
        ? current.serviceIds.filter((item) => item !== id)
        : [...current.serviceIds, id],
    }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        fullName: form.fullName,
        specialization: form.specialization,
        bio: form.bio || null,
        serviceIds: form.serviceIds,
        isActive: form.isActive,
      };

      if (editing) {
        await apiFetch(`/api/v1/admin/counselors/${editing.id}`, {
          method: "PATCH",
          body,
        });
        toast.success("Data konselor diperbarui.");
      } else {
        body.email = form.email;
        await apiFetch("/api/v1/admin/counselors", {
          method: "POST",
          body,
        });
        toast.success("Akun konselor dibuat dan undangan email dikirim.");
      }

      setOpen(false);
      await list.refetch();
    } catch (cause) {
      setError(
        fieldError(cause, "fullName") ??
          fieldError(cause, "email") ??
          fieldError(cause, "specialization") ??
          fieldError(cause, "serviceIds") ??
          errorMessage(cause),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6" aria-busy={list.refreshing}>
      <PageHeader
        eyebrow="Ruang Admin"
        title="Konselor"
        description="Kelola kebutuhanmu dengan lebih mudah di sini."
      />

      <div className="flex flex-wrap items-center gap-[15px]">
        <div className="relative min-w-56 flex-1">
          <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-[13px] size-[18px] -translate-y-1/2 text-[#68746d]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari konselor..."
            className="h-11 pl-10 text-[12px]"
          />
          {list.refreshing ? (
            <InlineLoading className="absolute top-1/2 right-4 -translate-y-1/2" />
          ) : null}
        </div>
        <Button
          className="h-[43px] gap-5 rounded-[9px] px-5 text-[12px]"
          onClick={openCreate}
        >
          <PlusLineIcon className="size-[17px]" />
          Tambah konselor
        </Button>
      </div>

      {list.loading ? (
        <TableSkeleton rows={5} showHeader={false} showSearch={false} />
      ) : list.error ? (
        <EmptyState title="Gagal memuat konselor" description={list.error} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Belum ada konselor"
          description="Tambahkan akun konselor pertama."
          action={<Button onClick={openCreate}>Tambah konselor</Button>}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((counselor) => (
            <div
              key={counselor.id}
              className="flex flex-col items-center rounded-[12px] border border-[#e1e7e1] bg-white p-[28px] text-center dark:border-border dark:bg-card"
            >
              <Avatar
                src={counselor.avatarUrl}
                name={counselor.fullName}
                size="xl"
              />
              <p className="mt-4 text-[14px] leading-[22px] font-semibold text-[#203b33] dark:text-foreground">
                {counselor.fullName}
              </p>
              <p className="mt-1 text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                {counselor.specialization ?? "-"}
              </p>
              <Badge
                variant={counselor.isActive ? "success" : "destructive"}
                className="mt-3 gap-1.5"
              >
                <span className="size-1 rounded-full bg-current" />
                {counselor.isActive ? "Aktif" : "Nonaktif"}
              </Badge>
              <p className="mt-3 text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                Layanan:{" "}
                {counselor.services.map((service) => service.name).join(", ") ||
                  "-"}
              </p>
              <Button
                variant="outline"
                className="mt-6 h-[50px] w-full gap-2 text-[12px]"
                onClick={() => openEdit(counselor)}
              >
                Kelola profil
                <ArrowRight className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[calc(100vh-2rem)] max-w-[calc(100%-2rem)] overflow-y-auto sm:max-w-[540px]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[#e1e7e1] pb-[18px] dark:border-border">
            <DialogTitle className="text-[18px] leading-[28.8px]">
              {editing ? "Kelola profil konselor" : "Buat akun konselor"}
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

          <form onSubmit={save} className="space-y-4">
            {error ? <Alert variant="destructive">{error}</Alert> : null}

            <div className="space-y-2">
              <Label htmlFor="counselor-name">Nama *</Label>
              <Input
                id="counselor-name"
                value={form.fullName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                className="h-11"
                required
              />
            </div>

            {!editing ? (
              <div className="space-y-2">
                <Label htmlFor="counselor-email">Email *</Label>
                <Input
                  id="counselor-email"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className="h-11"
                  required
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="counselor-specialization">Keahlian *</Label>
              <Input
                id="counselor-specialization"
                value={form.specialization}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    specialization: event.target.value,
                  }))
                }
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="counselor-bio">Deskripsi *</Label>
              <Textarea
                id="counselor-bio"
                rows={4}
                value={form.bio}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bio: event.target.value }))
                }
                className="resize-none"
                required
              />
            </div>

            {!editing ? (
              <div className="space-y-2">
                <Label htmlFor="counselor-service">Layanan terkait</Label>
                <Select
                  id="counselor-service"
                  value={form.serviceIds[0] ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      serviceIds: event.target.value
                        ? [event.target.value]
                        : [],
                    }))
                  }
                  className="h-11"
                >
                  <option value="">Pilih layanan</option>
                  {services.data?.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[12px] leading-[19.2px] font-medium text-[#203b33] dark:text-foreground">
                  Layanan terkait
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {services.data?.map((service) => (
                    <label
                      key={service.id}
                      className="flex items-center gap-2 rounded-[8px] border border-[#e1e7e1] px-3 py-2 text-[12px] dark:border-border"
                    >
                      <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={form.serviceIds.includes(service.id)}
                        onChange={() => toggleService(service.id)}
                      />
                      {service.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 text-[12px] leading-[19.2px] text-[#203b33] dark:text-foreground">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              Konselor aktif
            </label>

            <Button
              type="submit"
              size="lg"
              className="w-full gap-[22px]"
              disabled={saving}
            >
              {saving ? <SpinnerGap className="animate-spin" /> : null}
              {saving
                ? "Menyimpan..."
                : editing
                  ? "Simpan perubahan"
                  : "Simpan konselor"}
              {saving ? null : <CheckLineIcon className="size-[18px]" />}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
