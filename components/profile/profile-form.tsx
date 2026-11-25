"use client";

/* eslint-disable react-hooks/set-state-in-effect -- form fields are hydrated from the fetched profile. */

import { useEffect, useRef, useState } from "react";
import { Camera, SpinnerGap, Trash } from "@phosphor-icons/react/dist/ssr";
import { CheckLineIcon } from "@/components/ui/figma-icons";
import { toast } from "sonner";
import { useSession } from "@/components/providers/session-provider";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DetailSkeleton } from "@/components/ui/page-skeleton";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, errorMessage, fieldError } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/use-api";
import type { Profile } from "@/lib/types/api";

export function ProfileForm() {
  const { refresh } = useSession();
  const { data, loading, error, refetch } = useApi<Profile>("/api/v1/profile");
  const [fullName, setFullName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!data) return;
    setFullName(data.fullName);
    setSpecialization(data.counselorProfile?.specialization ?? "");
    setBio(data.counselorProfile?.bio ?? "");
  }, [data]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data) return;
    setSaving(true);
    setFieldErrors({});

    try {
      const body: Record<string, unknown> = { fullName };
      if (data.role === "counselor") {
        body.specialization = specialization;
        body.bio = bio || null;
      }

      await apiFetch<Profile>("/api/v1/profile", {
        method: "PATCH",
        body,
      });
      toast.success("Profil berhasil diperbarui.");
      await Promise.all([refetch(), refresh()]);
    } catch (cause) {
      toast.error(errorMessage(cause));
      setFieldErrors({
        fullName: fieldError(cause, "fullName") ?? "",
        specialization: fieldError(cause, "specialization") ?? "",
        bio: fieldError(cause, "bio") ?? "",
      });
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await apiFetch("/api/v1/profile/avatar", {
        method: "POST",
        formData,
      });
      toast.success("Foto profil diperbarui.");
      await Promise.all([refetch(), refresh()]);
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeAvatar() {
    setRemoving(true);
    try {
      await apiFetch("/api/v1/profile/avatar", { method: "DELETE" });
      toast.success("Foto profil dihapus.");
      await Promise.all([refetch(), refresh()]);
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setRemoving(false);
    }
  }

  if (loading) {
    return <DetailSkeleton columns={2} />;
  }

  if (error || !data) {
    return <Alert variant="destructive">{error ?? "Profil tidak ditemukan."}</Alert>;
  }

  return (
    <Card className="max-w-[696px]">
      <CardHeader>
        <CardTitle>
          {data.role === "counselor" ? "Profil profesional" : "Informasi dirimu"}
        </CardTitle>
        <CardDescription>Kelola nama, foto, dan informasi profilmu.</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-5 pb-2 sm:flex-row sm:items-center">
          <Avatar src={data.avatarUrl} name={data.fullName} size="xl" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading || removing}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <SpinnerGap className="animate-spin" />
                ) : (
                  <Camera className="size-4" />
                )}
                Ubah foto
              </Button>
              {data.avatarUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={uploading || removing}
                  onClick={removeAvatar}
                  className="text-[#9b3f3f] hover:bg-[#fdf2f2] hover:text-[#9b3f3f] dark:text-destructive dark:hover:bg-destructive/10"
                >
                  {removing ? (
                    <SpinnerGap className="animate-spin" />
                  ) : (
                    <Trash className="size-4" />
                  )}
                  Hapus foto
                </Button>
              ) : null}
            </div>
            <p className="mt-1.5 text-[11px] leading-[18px] text-[#68746d] dark:text-muted-foreground">
              JPG, PNG, WebP · Maks. 5 MB
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadAvatar(file);
            }}
          />
        </div>

        <form onSubmit={save} className="mt-6 max-w-[520px] space-y-5">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nama lengkap *</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              aria-invalid={Boolean(fieldErrors.fullName)}
              required
            />
            {fieldErrors.fullName ? (
              <p className="text-[11px] text-[#9b3f3f]">{fieldErrors.fullName}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={data.email} disabled readOnly />
          </div>

          {data.role === "counselor" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="specialization">Keahlian *</Label>
                <Input
                  id="specialization"
                  value={specialization}
                  onChange={(event) => setSpecialization(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.specialization)}
                  required
                />
                {fieldErrors.specialization ? (
                  <p className="text-[11px] text-[#9b3f3f]">
                    {fieldErrors.specialization}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Deskripsi profesional *</Label>
                <Textarea
                  id="bio"
                  rows={6}
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.bio)}
                  maxLength={2000}
                  className="resize-none"
                />
                {fieldErrors.bio ? (
                  <p className="text-[11px] text-[#9b3f3f]">{fieldErrors.bio}</p>
                ) : null}
              </div>
            </>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="gap-[22px]"
            disabled={saving}
          >
            {saving ? <SpinnerGap className="animate-spin" /> : null}
            {saving ? "Menyimpan..." : "Simpan perubahan"}
            {saving ? null : <CheckLineIcon className="size-[18px]" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
