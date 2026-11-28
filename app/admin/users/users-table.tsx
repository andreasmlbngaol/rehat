"use client";

import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlass, SpinnerGap, X } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckLineIcon } from "@/components/ui/figma-icons";
import { Input } from "@/components/ui/input";
import { InlineLoading } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/page-skeleton";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch, errorMessage } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/use-api";
import { ROLE_LABEL } from "@/lib/format";
import type { AdminUser, Paginated } from "@/lib/types/api";

export function UsersTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setApplied(search.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const path = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (applied) params.set("q", applied);
    return `/api/v1/admin/users?${params.toString()}`;
  }, [page, applied]);

  const list = useApi<Paginated<AdminUser>>(path);

  async function toggleActive(user: AdminUser) {
    setToggling(true);
    try {
      await apiFetch(`/api/v1/admin/users/${user.id}`, {
        method: "PATCH",
        body: { isActive: !user.isActive },
      });
      toast.success(
        user.isActive ? "Akun dinonaktifkan." : "Akun diaktifkan kembali.",
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
        title="Pengguna"
        description="Kelola kebutuhanmu dengan lebih mudah di sini."
      />

      <div className="relative">
        <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-[13px] size-[18px] -translate-y-1/2 text-[#68746d]" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari pengguna..."
          className="h-11 pl-10 text-[12px]"
        />
        {list.refreshing ? (
          <InlineLoading className="absolute top-1/2 right-4 -translate-y-1/2" />
        ) : null}
      </div>

      {list.loading ? (
        <TableSkeleton rows={6} showHeader={false} showSearch={false} />
      ) : list.error ? (
        <EmptyState title="Gagal memuat pengguna" description={list.error} />
      ) : !list.data || list.data.items.length === 0 ? (
        <EmptyState
          title="Tidak ada pengguna"
          description="Coba ubah kata kunci pencarian."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-[13px] border border-[#e1e7e1] bg-white dark:border-border dark:bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[34%]">Nama</TableHead>
                  <TableHead className="w-[21%]">
                    Peran
                  </TableHead>
                  <TableHead className="w-[19%]">
                    Status
                  </TableHead>
                  <TableHead className="w-[26%]">
                    Tindakan
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data.items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="py-[24px]">
                      <p className="text-[12px] leading-[19.2px] font-semibold text-[#203b33] dark:text-foreground">
                        {user.fullName}
                      </p>
                    </TableCell>
                    <TableCell className="py-[24px] dark:border-border">
                      <span className="text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
                        {ROLE_LABEL[user.role]}
                      </span>
                    </TableCell>
                    <TableCell className="py-[24px] dark:border-border">
                      <Badge
                        variant={user.isActive ? "success" : "destructive"}
                        className="gap-1.5"
                      >
                        <span className="size-1 rounded-full bg-current" />
                        {user.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-[24px] dark:border-border">
                      {user.role !== "admin" ? (
                        <button
                          type="button"
                          onClick={() => setSelected(user)}
                          className="text-[12px] leading-[19.2px] font-medium text-[#31594d] hover:underline dark:text-primary"
                        >
                          {user.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {(list.data.totalPages ?? 1) > 1 ? (
            <Pagination
              page={list.data.page}
              totalPages={list.data.totalPages}
              total={list.data.total}
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}

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
              {selected?.isActive ? "Nonaktifkan akun?" : "Aktifkan akun?"}
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
            Status akun {selected?.fullName} akan diubah. Akun nonaktif tidak
            dapat digunakan untuk masuk.
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
