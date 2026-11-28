"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MagnifyingGlass,
  SpinnerGap,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
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
  CheckLineIcon,
  PlusLineIcon,
} from "@/components/ui/figma-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineLoading } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/page-skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch, errorMessage, fieldError } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/use-api";
import { formatRupiah } from "@/lib/format";
import type { CounselingMethod, Service } from "@/lib/types/api";

type FormState = {
  name: string;
  description: string;
  durationMinutes: string;
  price: string;
  methods: CounselingMethod[];
};

const emptyForm: FormState = {
  name: "",
  description: "",
  durationMinutes: "45",
  price: "150000",
  methods: ["chat"],
};

export function ServicesManager() {
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setApplied(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const path = useMemo(() => {
    const params = new URLSearchParams();
    if (applied) params.set("q", applied);
    const query = params.toString();
    return `/api/v1/admin/services${query ? `?${query}` : ""}`;
  }, [applied]);

  const list = useApi<Service[]>(path);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Service | null>(null);
  const [toggling, setToggling] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  }

  function openEdit(service: Service) {
    setEditing(service);
    setForm({
      name: service.name,
      description: service.description,
      durationMinutes: String(service.durationMinutes),
      price: String(service.price),
      methods: service.methods,
    });
    setError(null);
    setOpen(true);
  }

  function toggleMethod(method: CounselingMethod) {
    setForm((current) => ({
      ...current,
      methods: current.methods.includes(method)
        ? current.methods.filter((item) => item !== method)
        : [...current.methods, method],
    }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const body = {
        name: form.name,
        description: form.description,
        durationMinutes: Number(form.durationMinutes),
        price: Number(form.price),
        methods: form.methods,
      };

      await apiFetch(
        editing
          ? `/api/v1/admin/services/${editing.id}`
          : "/api/v1/admin/services",
        { method: editing ? "PATCH" : "POST", body },
      );

      toast.success(editing ? "Layanan diperbarui." : "Layanan dibuat.");
      setOpen(false);
      await list.refetch();
    } catch (cause) {
      setError(
        fieldError(cause, "name") ??
          fieldError(cause, "description") ??
          fieldError(cause, "durationMinutes") ??
          fieldError(cause, "price") ??
          fieldError(cause, "methods") ??
          errorMessage(cause),
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(service: Service) {
    setToggling(true);
    try {
      await apiFetch(`/api/v1/admin/services/${service.id}`, {
        method: "PATCH",
        body: { isActive: !service.isActive },
      });
      toast.success(
        service.isActive ? "Layanan dinonaktifkan." : "Layanan diaktifkan.",
      );
      setSelected(null);
      await list.refetch();
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="space-y-6" aria-busy={list.refreshing}>
      <PageHeader
        eyebrow="Ruang Admin"
        title="Layanan"
        description="Kelola kebutuhanmu dengan lebih mudah di sini."
      />

      <div className="flex flex-wrap items-center gap-[15px]">
        <div className="relative min-w-56 flex-1">
          <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-[13px] size-[18px] -translate-y-1/2 text-[#68746d]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari layanan..."
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
          Tambah layanan
        </Button>
      </div>

      {list.loading ? (
        <TableSkeleton rows={5} showHeader={false} showSearch={false} />
      ) : list.error ? (
        <EmptyState title="Gagal memuat layanan" description={list.error} />
      ) : !list.data || list.data.length === 0 ? (
        <EmptyState
          title="Belum ada layanan"
          description="Tambahkan layanan pertama."
          action={<Button onClick={openCreate}>Tambah layanan</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-[13px] border border-[#e1e7e1] bg-white dark:border-border dark:bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[34%]">Layanan</TableHead>
                <TableHead className="w-[20%]">
                  Durasi / Metode
                </TableHead>
                <TableHead className="w-[14%]">
                  Tarif
                </TableHead>
                <TableHead className="w-[14%]">
                  Status
                </TableHead>
                <TableHead className="w-[18%]">
                  Tindakan
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.data.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="py-[22px]">
                    <p className="text-[12px] leading-[19.2px] font-semibold text-[#203b33] dark:text-foreground">
                      {service.name}
                    </p>
                    <p className="mt-0.5 line-clamp-2 max-w-[420px] whitespace-normal text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                      {service.description}
                    </p>
                  </TableCell>
                  <TableCell className="py-[22px] dark:border-border">
                    <p className="text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                      {service.durationMinutes} menit
                    </p>
                    <p className="text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                      {service.methods
                        .map((method) => (method === "chat" ? "Chat" : "Zoom"))
                        .join(" / ")}
                    </p>
                  </TableCell>
                  <TableCell className="py-[22px] text-[12px] dark:border-border">
                    {formatRupiah(service.price)}
                  </TableCell>
                  <TableCell className="py-[22px] dark:border-border">
                    <Badge
                      variant={service.isActive ? "success" : "destructive"}
                      className="gap-1.5"
                    >
                      <span className="size-1 rounded-full bg-current" />
                      {service.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-[22px] dark:border-border">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => openEdit(service)}
                        className="text-[12px] leading-[19.2px] font-medium text-[#31594d] hover:underline dark:text-primary"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelected(service)}
                        className="text-[12px] leading-[19.2px] font-medium text-[#31594d] hover:underline dark:text-primary"
                      >
                        {service.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[calc(100vh-2rem)] max-w-[calc(100%-2rem)] overflow-y-auto sm:max-w-[540px]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[#e1e7e1] pb-[18px] dark:border-border">
            <DialogTitle className="text-[18px] leading-[28.8px]">
              {editing ? "Edit layanan" : "Tambah layanan"}
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
              <Label htmlFor="service-name">Nama layanan *</Label>
              <Input
                id="service-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-description">Deskripsi *</Label>
              <Textarea
                id="service-description"
                rows={4}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="resize-none"
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="service-duration">Durasi (menit) *</Label>
                <Input
                  id="service-duration"
                  type="number"
                  min={1}
                  max={480}
                  value={form.durationMinutes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      durationMinutes: event.target.value,
                    }))
                  }
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-price">Tarif (Rp) *</Label>
                <Input
                  id="service-price"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      price: event.target.value,
                    }))
                  }
                  className="h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[12px] leading-[19.2px] font-medium text-[#203b33] dark:text-foreground">
                Metode layanan *
              </p>
              <div className="flex gap-4">
                {(["chat", "zoom"] as const).map((method) => (
                  <label
                    key={method}
                    className="flex items-center gap-2 text-[12px] leading-[19.2px] text-[#203b33] dark:text-foreground"
                  >
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={form.methods.includes(method)}
                      onChange={() => toggleMethod(method)}
                    />
                    {method === "chat" ? "Chat" : "Zoom"}
                  </label>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full gap-[22px]"
              disabled={saving || form.methods.length === 0}
            >
              {saving ? <SpinnerGap className="animate-spin" /> : null}
              {saving ? "Menyimpan..." : "Simpan layanan"}
              {saving ? null : <CheckLineIcon className="size-[18px]" />}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-[calc(100%-2rem)] sm:max-w-[540px]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[#e1e7e1] pb-[18px] dark:border-border">
            <DialogTitle className="text-[18px] leading-[28.8px]">
              {selected?.isActive
                ? "Nonaktifkan layanan?"
                : "Aktifkan layanan?"}
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
            {selected?.isActive
              ? `${selected.name} tidak akan muncul di katalog. Pesanan yang sudah ada tetap tersedia.`
              : `${selected?.name} akan muncul kembali di katalog dan dapat dipesan pasien.`}
          </p>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setSelected(null)}
              disabled={toggling}
            >
              Batal
            </Button>
            <Button
              onClick={() => selected && toggleActive(selected)}
              disabled={toggling}
              className="gap-[22px]"
            >
              {toggling ? <SpinnerGap className="animate-spin" /> : null}
              {toggling ? "Memproses..." : "Ya, lanjutkan"}
              {toggling ? null : <CheckLineIcon className="size-[18px]" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
