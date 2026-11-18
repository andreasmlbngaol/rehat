import { randomUUID } from "node:crypto";
import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { errors } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { avatarPublicUrl, deleteObject, uploadObject } from "@/lib/integrations/r2";

const MAX_BYTES = 5 * 1024 * 1024;
// Multipart boundaries and headers add a small overhead on top of the file.
const MAX_REQUEST_BYTES = MAX_BYTES + 1024 * 1024;

type DetectedImage = { mime: string; ext: string };

function detectImage(buffer: Buffer): DetectedImage | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  ) {
    return { mime: "image/png", ext: "png" };
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { mime: "image/webp", ext: "webp" };
  }

  return null;
}

export const POST = apiRoute(
  { auth: "required", rateLimit: { limit: 10, windowMs: 60_000 } },
  async ({ request, user }) => {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      throw errors.validation({ file: ["Ukuran file maksimal 5 MB."] });
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw errors.validation({ file: ["Gunakan format multipart/form-data."] });
    }

    const file = form.get("file");

    if (!(file instanceof File)) {
      throw errors.validation({ file: ["File foto wajib diunggah."] });
    }

    if (file.size === 0) {
      throw errors.validation({ file: ["File foto kosong."] });
    }

    if (file.size > MAX_BYTES) {
      throw errors.validation({ file: ["Ukuran file maksimal 5 MB."] });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = detectImage(buffer);

    if (!detected) {
      throw errors.validation({
        file: ["Format file harus JPG, PNG, atau WebP."],
      });
    }

    const key = `avatars/${user!.id}/${randomUUID()}.${detected.ext}`;
    await uploadObject({ key, body: buffer, contentType: detected.mime });

    const previous = await prisma.profile.findUnique({
      where: { id: user!.id },
      select: { avatarKey: true },
    });

    await prisma.profile.update({
      where: { id: user!.id },
      data: { avatarKey: key },
    });

    if (previous?.avatarKey) {
      try {
        await deleteObject(previous.avatarKey);
      } catch {
        // File lama gagal dihapus tidak boleh menggagalkan update profil.
      }
    }

    return ok(
      { avatarKey: key, avatarUrl: avatarPublicUrl(key) },
      "Foto profil berhasil diperbarui.",
    );
  },
);

export const DELETE = apiRoute({ auth: "required" }, async ({ user }) => {
  const profile = await prisma.profile.findUnique({
    where: { id: user!.id },
    select: { avatarKey: true },
  });

  if (profile?.avatarKey) {
    try {
      await deleteObject(profile.avatarKey);
    } catch {
      // Lanjutkan; referensi di database tetap harus dibersihkan.
    }
  }

  await prisma.profile.update({
    where: { id: user!.id },
    data: { avatarKey: null },
  });

  return ok(null, "Foto profil berhasil dihapus.");
});
