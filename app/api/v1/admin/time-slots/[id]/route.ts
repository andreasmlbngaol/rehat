import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { errors } from "@/lib/api/errors";
import { parseBody, parseParam, readJson } from "@/lib/api/validation";
import { uuidSchema } from "@/lib/validation/common";
import { updateTimeSlotSchema } from "@/lib/validation/time-slot";
import { prisma } from "@/lib/prisma";
import {
  deleteTimeSlot,
  toTimeSlotDto,
  updateTimeSlot,
} from "@/lib/services/time-slot.service";

export const PATCH = apiRoute<{ id: string }>(
  { auth: "required", roles: ["admin"] },
  async ({ request, params }) => {
    const id = parseParam(uuidSchema, params.id);
    const input = parseBody(updateTimeSlotSchema, await readJson(request));

    const existing = await prisma.timeSlot.findUnique({
      where: { id },
      select: { counselorId: true },
    });

    if (!existing) {
      throw errors.notFound("Slot jadwal tidak ditemukan.");
    }

    const slot = await updateTimeSlot({
      id,
      counselorId: existing.counselorId,
      startTime: input.startTime,
      serviceId: input.serviceId,
      durationMinutes: input.durationMinutes,
    });

    return ok(toTimeSlotDto(slot), "Slot jadwal berhasil diperbarui.");
  },
);

export const DELETE = apiRoute<{ id: string }>(
  { auth: "required", roles: ["admin"] },
  async ({ params }) => {
    const id = parseParam(uuidSchema, params.id);
    await deleteTimeSlot({ id });

    return ok(null, "Slot jadwal berhasil dihapus.");
  },
);
